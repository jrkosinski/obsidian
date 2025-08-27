import {
    BigNumberish,
    ethers,
    isAddress,
    JsonRpcProvider,
    Wallet,
} from 'ethers';
import { Config } from '../config';
import { erc20abi } from '../abi/erc20';
import { IChainHelper, PaymentTransaction } from '.';
import { ChainType, ITransactionOutput } from '../models';
import {
    isNativeCurrency,
    isValidCurrencyAddress,
    isValidEvmAddress,
    isZeroAddress,
} from '../utils';
import { ILogger, NullLogger } from '../logging';
import { getCurrencyAddress } from '../config/currency.config';
import { DecodesErrors } from '../contracts';

/**
 * IChainHelper implementation for EVM chains.
 */
export class EvmChainHelper extends DecodesErrors implements IChainHelper {
    constructor(protected readonly logger: ILogger = new NullLogger()) {
        super();
    }
    private recentRefunds = new Map<
        string,
        { txHash: string; timestamp: number }
    >();

    public get chainType(): ChainType {
        return ChainType.EVM;
    }

    async getBalance(
        chainId: string,
        currency: string,
        address: string
    ): Promise<BigNumberish> {
        const provider = new ethers.JsonRpcProvider(
            Config.getHttpsRpcUrl(chainId, this.chainType)
        );

        if (this._currencyIsEth(currency))
            return await provider.getBalance(address);

        return await this._getTokenBalance(
            chainId,
            provider,
            currency,
            address
        );
    }

    /**
     * Gets a list of accepted currencies (by name) for the chain type.
     */
    getAcceptedCurrencies(): string[] {
        return ['eth', 'usdt', 'usdc'];
    }

    public validateAddressFormat(address: string): boolean {
        return isValidEvmAddress(address);
    }

    public async getPaymentTransactions(
        chainId: string,
        paymentAddress: string
    ): Promise<PaymentTransaction[]> {
        try {
            let baseUrl = 'https://api.etherscan.io/api';

            //TODO: (LOW) create a dictionary of these
            if (chainId === '11155111') {
                baseUrl = 'https://api-sepolia.etherscan.io/api';
            } else if (chainId === '42161') {
                baseUrl = 'https://api.arbiscan.io/api';
            } else if (chainId === '10') {
                baseUrl = 'https://api-optimistic.etherscan.io/api';
            }

            const apiKey = Config.etherscanApiKey;
            const url = `${baseUrl}?module=account&action=txlist&address=${paymentAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.status === '1' && Array.isArray(data.result)) {
                // Filter for successful transactions to this address
                const validTransactions = data.result.filter(
                    (tx: any) =>
                        tx.isError === '0' &&
                        tx.to?.toLowerCase() === paymentAddress.toLowerCase()
                );

                // Calculate the total value
                const totalValue = validTransactions.reduce(
                    (sum: bigint, tx: PaymentTransaction) =>
                        sum + BigInt(tx.value),
                    BigInt(0)
                );

                return validTransactions.map((tx: any) => ({
                    id: tx.hash,
                    value: tx.value,
                }));
            }

            //this.logger.info(`No valid transactions found for ${address}`);
            return [];
        } catch (error) {
            //this.logger.error(
            //    `Error fetching transactions from Etherscan: ${error}`
            //);
            return [];
        }
    }

    async transfer(
        chainId: string,
        currency: string,
        amount: string,
        sourceWalletPrivateKey: string,
        destAddress: string
    ): Promise<string> {
        //validate the addresses
        if (!isValidCurrencyAddress(currency)) {
            throw new Error(`Invalid currency address ${currency}`);
        }
        if (!isValidEvmAddress(destAddress)) {
            throw new Error(`Invalid EVM address ${destAddress}`);
        }
        const isNative = isNativeCurrency(currency);

        //get the source wallet address
        const sourceWallet: Wallet = new Wallet(
            sourceWalletPrivateKey,
            new JsonRpcProvider(Config.getHttpsRpcUrl(chainId, this.chainType))
        );
        const sourceAddress: string = sourceWallet.address;

        //get initial balance
        const balance = await this.getBalance(chainId, currency, sourceAddress);

        //validate amount
        if (amount.trim().toLowerCase() === 'max') {
            //if max native, do this special step
            if (isNative) {
                const result = await this._transferMax(
                    chainId,
                    sourceAddress,
                    destAddress,
                    sourceWalletPrivateKey
                );
                return result.transaction_id;
            } else {
                //if max token, just make the amount = balance
                amount = balance.toString();
            }
        } else {
            if (BigInt(amount) > BigInt(balance.toString())) {
                throw new Error(
                    `The amount to transfer exceeds the balance of ${sourceAddress}`
                );
            }
        }

        //transfer the amount of ETH
        if (isNative) {
            const tx = await sourceWallet.sendTransaction({
                to: destAddress,
                value: amount,
            });
            await tx.wait();
            return tx.hash;
        }

        //transfer the amount of token
        return await this._transferToken(
            chainId,
            sourceWallet,
            destAddress,
            currency,
            amount
        );
    }

    /**
     * Sends a refund
     */
    async sendRefund(
        chainId: string,
        sourcePrivateKey: string,
        refundToAddress: string,
        currency: string,
        refundAmount: BigNumberish
    ): Promise<string> {
        this._cleanupOldRefunds();

        // Create simple key for this exact refund
        const refundKey = `${sourcePrivateKey.slice(-10)}-${refundToAddress}-${currency}-${refundAmount.toString()}`;

        // Check if we already did this exact refund recently
        const existing = this.recentRefunds.get(refundKey);
        if (existing) {
            this.logger.warn(
                `Duplicate refund prevented! Returning existing tx: ${existing.txHash}`
            );
            return existing.txHash;
        }

        // Validate inputs
        if (!isValidCurrencyAddress(currency)) {
            throw new Error(`Invalid currency address: ${currency}`);
        }
        if (!isValidEvmAddress(refundToAddress)) {
            throw new Error(
                `Invalid refund recipient address: ${refundToAddress}`
            );
        }

        // Initialize provider and wallet
        const provider = new JsonRpcProvider(
            Config.getHttpsRpcUrl(chainId, this.chainType)
        );
        const sourceWallet = new Wallet(sourcePrivateKey, provider);

        // Check if it's native currency or token
        const isNative = this._currencyIsEth(currency);

        this.logger.info(
            `Sending refund: ${refundAmount.toString()} ${isNative ? 'ETH' : 'tokens'} from ${sourceWallet.address} to ${refundToAddress}`
        );

        try {
            let txHash: string;

            if (isNative) {
                txHash = await this._sendNativeRefund(
                    sourceWallet,
                    refundToAddress,
                    refundAmount
                );
            } else {
                txHash = await this._sendTokenRefund(
                    sourceWallet,
                    currency,
                    refundToAddress,
                    refundAmount,
                    chainId
                );
            }

            this.recentRefunds.set(refundKey, {
                txHash: txHash,
                timestamp: Date.now(),
            });

            this.logger.info(`Refund successful and cached: ${txHash}`);
            return txHash;
        } catch (error: any) {
            this.logger.error(`Refund failed: ${error.message}`);

            if (
                error.message.includes('insufficient funds') ||
                error.message.includes('Insufficient')
            ) {
                throw new Error(
                    `Insufficient funds in wallet ${sourceWallet.address} for refund transaction`
                );
            }

            throw new Error(`Refund transaction failed: ${error.message}`);
        }
    }

    // -- NON-PUBLIC METHODS --

    /**
     * Transfers the maximum possible ETH from source wallet to destination wallet.
     * @param sourceWalletAddress - The wallet to send ETH from (Wallet A).
     * @param destinationWalletAddress - The wallet to receive ETH (Wallet B).
     * @param chainId - The blockchain chain ID (e.g., '11155111' for Sepolia).
     * @returns ServiceMethodOutput with transaction details or error.
     */
    private async _transferMax(
        chainId: string,
        sourceAddress: string,
        destAddress: string,
        sourceWalletPrivateKey: string
    ): Promise<ITransactionOutput> {
        try {
            // Read configuration from environment variables.
            let maxAttempts = Config.transferMaxAttempts;
            let initialGasMultiplier = Config.transferInitialGasMultiplier;
            let gasIncrementPercent = Config.transferGasIncrementPercent;

            this.logger.info(
                `Configuration: maxAttempts=${maxAttempts}, initialGasMultiplier=${initialGasMultiplier}, gasIncrementPercent=${gasIncrementPercent}`
            );

            // Initialize provider and wallet
            const provider = new ethers.JsonRpcProvider(
                Config.getHttpsRpcUrl(chainId)
            );
            const wallet = new ethers.Wallet(sourceWalletPrivateKey, provider);

            // Constants
            const GAS_LIMIT = BigInt(21000);
            let attempt = 1;
            let lastError: any;

            while (attempt <= maxAttempts) {
                this.logger.info(`Attempt ${attempt}/${maxAttempts}`);

                try {
                    // Get balance and fee data
                    const balance = await provider.getBalance(sourceAddress);
                    const feeData = await provider.getFeeData();
                    const baseGasPrice =
                        feeData.gasPrice || ethers.parseUnits('20', 'gwei');

                    // Calculate gas price with multiplier (increases per attempt)
                    const gasMultiplier =
                        initialGasMultiplier +
                        (attempt - 1) * (gasIncrementPercent / 100);
                    const gasPrice =
                        (baseGasPrice *
                            BigInt(Math.floor(gasMultiplier * 100))) /
                        BigInt(100);
                    const gasCost = gasPrice * GAS_LIMIT;

                    // Check if balance is sufficient
                    if (balance <= gasCost) {
                        throw new Error(
                            `Insufficient balance: ${ethers.formatEther(balance)} ETH, needed ${ethers.formatEther(gasCost)} ETH for gas`
                        );
                    }

                    // Calculate max transferable amount
                    const amountToSend = balance - gasCost;
                    this.logger.info(
                        `Attempting to send ${ethers.formatEther(amountToSend)} ETH with gas price ${ethers.formatUnits(gasPrice, 'gwei')} gwei`
                    );

                    // Send transaction
                    const tx = await wallet.sendTransaction({
                        to: destAddress,
                        value: amountToSend,
                        gasLimit: GAS_LIMIT,
                        gasPrice,
                    });

                    this.logger.info(`Transaction sent: ${tx.hash}`);

                    // Wait for confirmation
                    const receipt = await tx.wait();
                    if (!receipt) {
                        throw new Error(
                            'Transaction failed: No receipt received'
                        );
                    }

                    this.logger.info(
                        `Transaction confirmed in block ${receipt.blockNumber}`
                    );

                    // Construct ITransactionOutput per the interface
                    const result: ITransactionOutput = {
                        transaction_id: tx.hash,
                        tx: tx,
                        receipt: receipt,
                    };

                    return result;
                } catch (error: any) {
                    lastError = error;
                    this.logger.warn(
                        `Attempt ${attempt} failed: ${error.message}`
                    );

                    // Check if error is gas-related
                    if (
                        !error.message.includes('underpriced') &&
                        !error.message.includes('insufficient funds') &&
                        !error.message.includes('gas required exceeds')
                    ) {
                        this.logger.error(
                            `Non-gas-related error: ${error.message}`
                        );
                        break;
                    }

                    attempt++;
                    if (attempt > maxAttempts) {
                        this.logger.error(
                            `Max attempts (${maxAttempts}) reached`
                        );
                        break;
                    }

                    // Small delay before retry to avoid spamming
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }

            // If all attempts fail
            throw new Error(
                `Failed to transfer after ${maxAttempts} attempts: ${lastError?.message || 'Unknown error'}`
            );
        } catch (error: any) {
            this.logger.error(`Error in transferMaxAmount: ${error.message}`);
            throw error;
        }
    }

    private _currencyIsEth(currency: string): boolean {
        return isZeroAddress(currency);
    }

    private async _getTokenBalance(
        chainId: string,
        provider: ethers.Provider,
        currency: string,
        address: string
    ): Promise<BigNumberish> {
        const token = this._getTokenContract(chainId, provider, currency);

        return await this.wrapCallInDecodedErrorHandler(
            'token.balanceOf',
            async () => {
                return await token.balanceOf(address);
            }
        );
    }

    private async _transferToken(
        chainId: string,
        sourceWallet: Wallet,
        destAddress: string,
        currency: string,
        amount: BigNumberish
    ): Promise<string> {
        const token = this._getTokenContract(chainId, sourceWallet, currency);

        return await this.wrapCallInDecodedErrorHandler(
            'token.transfer',
            async () => {
                const tx = await token.transfer(destAddress, amount);
                await tx.wait();
                return tx.hash.toString();
            }
        );
    }

    private _getTokenContract(
        chainId: string,
        providerOrSigner: ethers.Provider | ethers.Signer,
        currency: string
    ): ethers.Contract {
        //check first for addressness
        if (!isAddress(currency)) {
            const originalCurrency = currency;
            currency = getCurrencyAddress(currency, chainId);
            if (!isAddress(currency))
                throw new Error(
                    `${originalCurrency} not recognized as a currency`
                );
        }
        const token = new ethers.Contract(currency, erc20abi, providerOrSigner);
        return token;
    }

    // -- REFUND HELPER METHODS --

    /**
     * Sends native currency (ETH) refund with precise gas calculation
     */
    private async _sendNativeRefund(
        sourceWallet: Wallet,
        refundToAddress: string,
        refundAmount: BigNumberish
    ): Promise<string> {
        const provider = sourceWallet.provider as JsonRpcProvider;
        const sourceAddress = sourceWallet.address;

        // Use similar config as _transferMax
        let maxAttempts = Config.transferMaxAttempts || 3;
        let initialGasMultiplier = Config.transferInitialGasMultiplier || 1.2;
        let gasIncrementPercent = Config.transferGasIncrementPercent || 10;

        const balance = await provider.getBalance(sourceAddress);
        const refundAmountBig = BigInt(refundAmount.toString());

        // Validate we have enough balance
        if (balance < refundAmountBig) {
            throw new Error(
                `Insufficient ETH balance. Have ${ethers.formatEther(balance)} ETH, need ${ethers.formatEther(refundAmountBig)} ETH`
            );
        }

        const gasLimit = BigInt(21000);
        let attempt = 1;
        let lastError: any;

        while (attempt <= maxAttempts) {
            try {
                // Get current fee data
                const feeData = await provider.getFeeData();
                const baseGasPrice =
                    feeData.gasPrice || ethers.parseUnits('20', 'gwei');

                // Calculate gas price with multiplier
                const gasMultiplier =
                    initialGasMultiplier +
                    (attempt - 1) * (gasIncrementPercent / 100);
                const gasPrice =
                    (baseGasPrice * BigInt(Math.floor(gasMultiplier * 100))) /
                    BigInt(100);
                const estimatedGasCost = gasPrice * gasLimit;

                // Calculate actual refund amount after gas deduction
                const actualRefundAmount = refundAmountBig - estimatedGasCost;

                if (actualRefundAmount <= BigInt(0)) {
                    throw new Error(
                        `Refund amount ${ethers.formatEther(refundAmountBig)} ETH is too small to cover gas costs ${ethers.formatEther(estimatedGasCost)} ETH`
                    );
                }

                this.logger.info(
                    `Attempt ${attempt}: Sending ${ethers.formatEther(actualRefundAmount)} ETH refund (${ethers.formatEther(refundAmountBig)} minus ${ethers.formatEther(estimatedGasCost)} gas) with gas price ${ethers.formatUnits(gasPrice, 'gwei')} gwei`
                );

                // Send the transaction
                const transaction = await sourceWallet.sendTransaction({
                    to: refundToAddress,
                    value: actualRefundAmount,
                    gasLimit: gasLimit,
                    gasPrice: gasPrice,
                });

                // Wait for confirmation
                const receipt = await transaction.wait();
                if (!receipt || receipt.status !== 1) {
                    throw new Error('Transaction failed or was reverted');
                }

                this.logger.info(`ETH refund successful: ${transaction.hash}`);
                return transaction.hash;
            } catch (error: any) {
                lastError = error;
                this.logger.warn(
                    `Refund attempt ${attempt} failed: ${error.message}`
                );

                // Check if error is gas-related
                if (
                    !error.message.includes('underpriced') &&
                    !error.message.includes('insufficient funds') &&
                    !error.message.includes('gas required exceeds') &&
                    !error.message.includes('replacement fee too low')
                ) {
                    // Non-gas-related error, don't retry
                    break;
                }

                attempt++;
                if (attempt > maxAttempts) {
                    break;
                }

                // Small delay before retry
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }

        // If all attempts failed
        throw new Error(
            `Failed to send refund after ${maxAttempts} attempts: ${lastError?.message || 'Unknown error'}`
        );
    }

    /**
     * Sends ERC-20 token refund (requires ETH for gas)
     */
    private async _sendTokenRefund(
        sourceWallet: Wallet,
        tokenAddress: string,
        refundToAddress: string,
        refundAmount: BigNumberish,
        chainId: string
    ): Promise<string> {
        const provider = sourceWallet.provider as JsonRpcProvider;
        const sourceAddress = sourceWallet.address;

        const resolvedTokenAddress = this._resolveTokenAddress(
            tokenAddress,
            chainId
        );

        // Get network conditions
        const [ethBalance, feeData] = await Promise.all([
            provider.getBalance(sourceAddress),
            provider.getFeeData(),
        ]);

        // Estimate gas costs for token transfer
        const gasLimit = BigInt(100000);
        const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
        const gasBuffer = BigInt(150);
        const estimatedGasCost =
            (gasPrice * gasLimit * gasBuffer) / BigInt(100);

        // Check if we have enough ETH for gas
        if (ethBalance < estimatedGasCost) {
            throw new Error(
                `Insufficient ETH for gas. Have ${ethers.formatEther(ethBalance)} ETH, need ${ethers.formatEther(estimatedGasCost)} ETH`
            );
        }

        // Create properly typed ERC-20 contract
        const tokenContract = new ethers.Contract(
            resolvedTokenAddress,
            [
                'function transfer(address to, uint256 amount) returns (bool)',
                'function balanceOf(address owner) view returns (uint256)',
                'function decimals() view returns (uint8)',
                'function symbol() view returns (string)',
            ],
            sourceWallet
        );

        // Check token balance
        const tokenBalance = await tokenContract.balanceOf(sourceAddress);
        const refundAmountBig = BigInt(refundAmount.toString());

        if (BigInt(tokenBalance.toString()) < refundAmountBig) {
            throw new Error(
                `Insufficient token balance. Have ${tokenBalance.toString()}, need ${refundAmountBig.toString()}`
            );
        }

        this.logger.info(
            `Sending ${refundAmountBig.toString()} tokens to ${refundToAddress}`
        );

        // Send the token transfer
        const transaction = await tokenContract.transfer(
            refundToAddress,
            refundAmountBig,
            {
                gasLimit: gasLimit,
                gasPrice: gasPrice,
            }
        );

        // Wait for confirmation
        const receipt = await transaction.wait();
        if (!receipt || receipt.status !== 1) {
            throw new Error('Token transfer failed or was reverted');
        }

        this.logger.info(`Token refund successful: ${transaction.hash}`);
        return transaction.hash;
    }

    /**
     * Resolves token address from symbol
     */
    private _resolveTokenAddress(
        tokenAddressOrSymbol: string,
        chainId: string
    ): string {
        if (isAddress(tokenAddressOrSymbol)) {
            return tokenAddressOrSymbol;
        }

        try {
            const resolvedAddress = getCurrencyAddress(
                tokenAddressOrSymbol,
                chainId
            );

            if (isAddress(resolvedAddress)) {
                return resolvedAddress;
            }
        } catch (error) {
            this.logger.error(
                `Error resolving token address: ${error.message}`
            );
        }

        throw new Error(
            `Could not resolve token address for: ${tokenAddressOrSymbol}`
        );
    }

    /**
     * Clean up old refund entries
     */
    private _cleanupOldRefunds(): void {
        const now = Date.now();
        const fiveMinutesAgo = now - 5 * 60 * 1000;

        for (const [key, value] of this.recentRefunds.entries()) {
            if (value.timestamp < fiveMinutesAgo) {
                this.recentRefunds.delete(key);
            }
        }
    }
}
