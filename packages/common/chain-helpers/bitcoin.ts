import { BigNumberish } from 'ethers';
import { IChainHelper, PaymentTransaction } from '.';
import { ChainType } from '../models';
import axios from 'axios';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import ECPairFactory from 'ecpair';
import { Psbt } from 'bitcoinjs-lib';
import { ILogger, NullLogger } from '../logging';

interface Utxo {
    txid: string;
    vout: number;
    value: number;
    address: string;
}

/**
 * IChainHelper implementation for Bitcoin.
 */
export class BitcoinChainHelper implements IChainHelper {
    private readonly apiUrls: { [key: string]: string } = {
        mainnet: 'https://blockstream.info/api',
        testnet: 'https://blockstream.info/testnet/api',
    };

    constructor(protected readonly logger: ILogger = new NullLogger()) {}

    public get chainType(): ChainType {
        return ChainType.BITCOIN;
    }

    /**
     * Gets the balance of a Bitcoin address
     * @param chainId Bitcoin network (mainnet, testnet)
     * @param currency
     * @param address The Bitcoin address to check
     * @returns The balance in satoshis as BigNumberish
     */
    async getBalance(
        chainId: string,
        currency: string,
        address: string
    ): Promise<BigNumberish> {
        const timeoutMs = 8000;

        const apiEndpoints = {
            mainnet: [
                'https://mempool.space/api',
                'https://api.blockcypher.com/v1/btc/main',
            ],
            testnet: [
                'https://mempool.space/testnet/api',
                'https://api.blockcypher.com/v1/btc/test3',
            ],
        };

        try {
            // Validate the address before making API call
            if (!this.validateAddressFormat(address)) {
                console.error(`Invalid Bitcoin address format: ${address}`);
                return '0';
            }

            const networkKey =
                chainId.toLowerCase() === 'testnet' ? 'testnet' : 'mainnet';
            const endpoints =
                apiEndpoints[networkKey] || apiEndpoints['mainnet'];

            for (const apiUrl of endpoints) {
                try {
                    let response;
                    let balance = 0;

                    if (apiUrl.includes('blockcypher')) {
                        // BlockCypher API format
                        response = await axios.get(
                            `${apiUrl}/addrs/${address}/balance`,
                            {
                                timeout: timeoutMs,
                                headers: {
                                    'User-Agent': 'Bitcoin-Wallet-App/1.0',
                                },
                            }
                        );

                        // BlockCypher returns balance directly in satoshis
                        balance =
                            (response.data.balance || 0) +
                            (response.data.unconfirmed_balance || 0);
                    } else {
                        // Mempool API format
                        response = await axios.get(
                            `${apiUrl}/address/${address}`,
                            {
                                timeout: timeoutMs,
                                headers: {
                                    'User-Agent': 'Bitcoin-Wallet-App/1.0',
                                    Accept: 'application/json',
                                },
                            }
                        );

                        const { chain_stats, mempool_stats } = response.data;

                        if (!chain_stats) {
                            continue; // Skip to next API if no chain stats
                        }

                        // Calculate total balance (confirmed + unconfirmed)
                        const confirmedBalance =
                            (chain_stats.funded_txo_sum || 0) -
                            (chain_stats.spent_txo_sum || 0);
                        const unconfirmedBalance = mempool_stats
                            ? (mempool_stats.funded_txo_sum || 0) -
                              (mempool_stats.spent_txo_sum || 0)
                            : 0;

                        balance = confirmedBalance + unconfirmedBalance;
                    }

                    // Ensure balance is not negative
                    const finalBalance = balance < 0 ? 0 : balance;

                    console.log(
                        `Retrieved balance for ${address}: ${finalBalance} satoshis`
                    );
                    return finalBalance.toString();
                } catch (error: any) {
                    console.log(`API ${apiUrl} failed: ${error.message}`);
                }
            }

            // If all endpoints failed
            console.log(
                `All Bitcoin API endpoints failed for address ${address}`
            );
            return '0';
        } catch (error: any) {
            this.logger.error(
                `Unexpected error fetching Bitcoin balance for ${address}: ${error.message}`
            );
            return '0';
        }
    }

    /**
     * Gets a list of accepted currencies (by name) for the chain type.
     */
    getAcceptedCurrencies(): string[] {
        return [''];
    }

    /**
     * Validates a Bitcoin address format
     * @param address The Bitcoin address to validate
     * @returns true if the address format is valid, false otherwise
     */
    public validateAddressFormat(address: string): boolean {
        try {
            //TODO: (LOW) get a logger in here
            const btcAddressRegex =
                /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|(bc|tb)1[a-z0-9]{8,87}|[mn2][a-km-zA-HJ-NP-Z1-9]{25,34})$/;

            if (!btcAddressRegex.test(address)) {
                console.log(`Address ${address} failed regex validation`);
                // If regex fails, still try bitcoinjs-lib validation as a fallback
                // because the library's validation is more comprehensive
            }

            // Try bitcoinjs-lib validation even if regex fails
            try {
                // Try to parse the address as mainnet first
                bitcoin.address.toOutputScript(
                    address,
                    bitcoin.networks.bitcoin
                );
                console.log(`Address ${address} validated as mainnet address`);
                return true;
            } catch (e) {
                try {
                    // Then try as testnet
                    bitcoin.address.toOutputScript(
                        address,
                        bitcoin.networks.testnet
                    );
                    console.log(
                        `Address ${address} validated as testnet address`
                    );
                    return true;
                } catch (e) {
                    console.log(
                        `Address ${address} failed bitcoinjs-lib validation`
                    );
                    return false;
                }
            }
        } catch (error) {
            console.error(`Error validating Bitcoin address: ${error}`);
            return false;
        }
    }

    public async getPaymentTransactions(
        chainId: string,
        paymentAddress: string,
        minConfirmations: number = 6
    ): Promise<PaymentTransaction[]> {
        const timeoutMs = 20000;

        const apiEndpoints = {
            mainnet: [
                'https://mempool.space/api',
                'https://api.blockcypher.com/v1/btc/main',
            ],
            testnet: [
                'https://mempool.space/testnet/api',
                'https://api.blockcypher.com/v1/btc/test3',
            ],
        };

        try {
            if (!this.validateAddressFormat(paymentAddress)) {
                console.error(
                    `Invalid Bitcoin address format: ${paymentAddress}`
                );
                return [];
            }

            const networkKey =
                chainId.toLowerCase() === 'testnet' ? 'testnet' : 'mainnet';
            const endpoints =
                apiEndpoints[networkKey] || apiEndpoints['mainnet'];

            for (const apiUrl of endpoints) {
                try {
                    let transactions: PaymentTransaction[] = [];

                    if (apiUrl.includes('blockcypher')) {
                        transactions =
                            await this._getTransactionsFromBlockCypher(
                                apiUrl,
                                paymentAddress,
                                timeoutMs,
                                minConfirmations
                            );
                    } else {
                        transactions = await this._getTransactionsFromMempool(
                            apiUrl,
                            paymentAddress,
                            timeoutMs,
                            minConfirmations
                        );
                    }

                    if (transactions.length > 0) {
                        console.log(
                            `Retrieved ${transactions.length} safe transactions (${minConfirmations}+ confirmations) for ${paymentAddress}`
                        );
                        return transactions;
                    }
                } catch (error: any) {
                    console.log(`API ${apiUrl} failed: ${error.message}`);
                }
            }

            console.log(
                `No safe transactions found for address ${paymentAddress} with ${minConfirmations}+ confirmations`
            );
            return [];
        } catch (error: any) {
            this.logger.error(
                `Unexpected error fetching Bitcoin transactions for ${paymentAddress}: ${error.message}`
            );
            return [];
        }
    }

    async sendRefund(
        chainId: string,
        sourceAddress: string,
        refundToAddress: string,
        currency: string,
        refundAmount: BigNumberish
    ): Promise<string> {
        throw new Error('Auto-refund not implemented for Bitcoin chain');
    }

    /**
     * Get SAFE transactions from Mempool.space API (with confirmation checking)
     */
    private async _getTransactionsFromMempool(
        apiUrl: string,
        address: string,
        timeoutMs: number,
        minConfirmations: number = 6
    ): Promise<PaymentTransaction[]> {
        const response = await axios.get(`${apiUrl}/address/${address}/txs`, {
            timeout: timeoutMs,
            headers: {
                'User-Agent': 'Bitcoin-Wallet-App/1.0',
                Accept: 'application/json',
            },
        });

        const txs = response.data;
        const paymentTransactions: PaymentTransaction[] = [];

        // Get current block height to calculate confirmations
        let currentBlockHeight: number;
        try {
            const tipResponse = await axios.get(`${apiUrl}/blocks/tip/height`, {
                timeout: timeoutMs,
            });
            currentBlockHeight = tipResponse.data;
        } catch (error) {
            console.log(
                'Could not fetch current block height, skipping confirmation check'
            );
            currentBlockHeight = 0;
        }

        for (const tx of txs) {
            const confirmations = tx.status?.confirmed
                ? currentBlockHeight - tx.status.block_height + 1
                : 0;

            // ONLY include transactions with enough confirmations
            if (confirmations >= minConfirmations) {
                if (tx.vout && Array.isArray(tx.vout)) {
                    for (const vout of tx.vout) {
                        if (vout.scriptpubkey_address === address) {
                            paymentTransactions.push({
                                id: tx.txid,
                                value: vout.value.toString(),
                            });
                            console.log(
                                `Safe transaction found: ${tx.txid} (${confirmations} confirmations)`
                            );
                        }
                    }
                }
            } else {
                console.log(
                    `Unsafe transaction skipped: ${tx.txid} (${confirmations} confirmations, need ${minConfirmations})`
                );
            }
        }

        return paymentTransactions;
    }

    /**
     * Get SAFE transactions from BlockCypher API (with confirmation checking)
     */
    private async _getTransactionsFromBlockCypher(
        apiUrl: string,
        address: string,
        timeoutMs: number,
        minConfirmations: number = 6
    ): Promise<PaymentTransaction[]> {
        const response = await axios.get(
            `${apiUrl}/addrs/${address}?includeScript=true`,
            {
                timeout: timeoutMs,
                headers: {
                    'User-Agent': 'Bitcoin-Wallet-App/1.0',
                },
            }
        );

        const data = response.data;
        const paymentTransactions: PaymentTransaction[] = [];

        // Process transaction references
        if (data.txrefs && Array.isArray(data.txrefs)) {
            for (const txref of data.txrefs) {
                const confirmations = txref.confirmations || 0;

                // ONLY include transactions with enough confirmations
                if (
                    confirmations >= minConfirmations &&
                    txref.tx_output_n !== undefined &&
                    txref.value > 0
                ) {
                    paymentTransactions.push({
                        id: txref.tx_hash,
                        value: txref.value.toString(),
                    });
                    console.log(
                        `Safe transaction found: ${txref.tx_hash} (${confirmations} confirmations)`
                    );
                } else if (confirmations < minConfirmations) {
                    console.log(
                        `Unsafe transaction skipped: ${txref.tx_hash} (${confirmations} confirmations, need ${minConfirmations})`
                    );
                }
            }
        }

        return paymentTransactions;
    }

    /**
     * Transfers a given amount of Bitcoin from source wallet to destination wallet.
     *
     * @param chainId The Bitcoin network ('mainnet' or 'testnet')
     * @param currency Not used for Bitcoin (can be empty string)
     * @param amount The amount to transfer in BTC; can be the string 'max' to transfer all available funds
     * @param sourceWallet The PRIVATE KEY of the source wallet
     * @param destAddress The ADDRESS of the destination wallet
     * @returns The transaction id resulting from the transfer
     */
    async transfer(
        chainId: string,
        currency: string,
        amount: string,
        sourceWallet: string,
        destAddress: string
    ): Promise<string> {
        try {
            // Validate the destination address
            if (!this.validateAddressFormat(destAddress)) {
                throw new Error(`Invalid destination address: ${destAddress}`);
            }

            // Determine which network to use
            const network =
                chainId.toLowerCase() === 'testnet'
                    ? bitcoin.networks.testnet
                    : bitcoin.networks.bitcoin;

            // Get API URL based on chain
            const apiUrl =
                this.apiUrls[chainId.toLowerCase()] || this.apiUrls['mainnet'];

            // Initialize ECPair factory with proper BIP32 interface
            const ECPair = ECPairFactory(ecc);

            // Import private key and get the corresponding address
            const keyPair = ECPair.fromWIF(sourceWallet, network);

            // Convert to Buffer for bitcoinjs-lib compatibility
            const pubkeyBuffer = Buffer.from(keyPair.publicKey);

            // Get all possible address formats for this key
            const p2pkhAddress =
                bitcoin.payments.p2pkh({
                    pubkey: pubkeyBuffer,
                    network,
                }).address || '';

            const p2wpkhAddress =
                bitcoin.payments.p2wpkh({
                    pubkey: pubkeyBuffer,
                    network,
                }).address || '';

            const p2shP2wpkhAddress =
                bitcoin.payments.p2sh({
                    redeem: bitcoin.payments.p2wpkh({
                        pubkey: pubkeyBuffer,
                        network,
                    }),
                    network,
                }).address || '';

            // Fetch UTXOs for all possible addresses associated with this key
            let utxos: Utxo[] = [];

            // Try fetching UTXOs for the P2PKH address
            try {
                const p2pkhUtxosResponse = await axios.get(
                    `${apiUrl}/address/${p2pkhAddress}/utxo`
                );
                if (
                    p2pkhUtxosResponse.data &&
                    p2pkhUtxosResponse.data.length > 0
                ) {
                    utxos = [
                        ...utxos,
                        ...p2pkhUtxosResponse.data.map((utxo: any) => ({
                            ...utxo,
                            address: p2pkhAddress,
                        })),
                    ];
                }
            } catch (error) {
                // No UTXOs found for this address type
            }

            // Try fetching UTXOs for the P2WPKH address
            try {
                const p2wpkhUtxosResponse = await axios.get(
                    `${apiUrl}/address/${p2wpkhAddress}/utxo`
                );
                if (
                    p2wpkhUtxosResponse.data &&
                    p2wpkhUtxosResponse.data.length > 0
                ) {
                    utxos = [
                        ...utxos,
                        ...p2wpkhUtxosResponse.data.map((utxo: any) => ({
                            ...utxo,
                            address: p2wpkhAddress,
                        })),
                    ];
                }
            } catch (error) {
                // No UTXOs found for this address type
            }

            // Try fetching UTXOs for the P2SH-P2WPKH address
            try {
                const p2shP2wpkhUtxosResponse = await axios.get(
                    `${apiUrl}/address/${p2shP2wpkhAddress}/utxo`
                );
                if (
                    p2shP2wpkhUtxosResponse.data &&
                    p2shP2wpkhUtxosResponse.data.length > 0
                ) {
                    utxos = [
                        ...utxos,
                        ...p2shP2wpkhUtxosResponse.data.map((utxo: any) => ({
                            ...utxo,
                            address: p2shP2wpkhAddress,
                        })),
                    ];
                }
            } catch (error) {
                // No UTXOs found for this address type
            }

            if (!utxos || utxos.length === 0) {
                throw new Error(
                    `No UTXOs found for any address derived from this private key`
                );
            }

            // Create a new transaction using PSBT (Partially Signed Bitcoin Transaction)
            const psbt = new Psbt({ network });

            // Calculate total available balance
            let totalAvailable = 0;
            for (const utxo of utxos) {
                totalAvailable += utxo.value;
            }

            // Calculate a more accurate fee based on transaction size
            const calculateFee = (
                numInputs: number,
                numOutputs: number,
                satPerByte: number = 3
            ): number => {
                const feeRate =
                    chainId.toLowerCase() === 'testnet' ? satPerByte : 5;

                // Determine size based on address types
                let inputSize = 0;
                let segwitInputCount = 0;
                let legacyInputCount = 0;

                for (let i = 0; i < Math.min(numInputs, utxos.length); i++) {
                    if (utxos[i].address === p2wpkhAddress) {
                        segwitInputCount++;
                    } else {
                        legacyInputCount++;
                    }
                }

                // Calculate input size more precisely
                inputSize = segwitInputCount * 68 + legacyInputCount * 148;

                // Calculate total size
                const outputSize = numOutputs * 34;
                const overhead = 10;
                const estimatedSize = overhead + inputSize + outputSize;

                // Return fee with some buffer (add 10%)
                return Math.ceil(estimatedSize * feeRate * 1.1);
            };

            // Determine amount to send in satoshis
            let amountToSend: number;
            if (amount === 'max') {
                // For 'max', we need to calculate fee first, starting with 1 output (no change)
                const estimatedFee = calculateFee(utxos.length, 1);
                amountToSend = Math.max(0, totalAvailable - estimatedFee);
            } else {
                // Convert BTC to satoshis (1 BTC = 100,000,000 satoshis)
                amountToSend = Math.floor(parseFloat(amount) * 100000000);
            }

            // Check if there are enough funds
            if (amountToSend <= 0 || amountToSend > totalAvailable) {
                throw new Error(
                    `Insufficient funds. Available: ${totalAvailable} satoshis, Requested: ${amountToSend} satoshis`
                );
            }

            // Select UTXOs optimally
            let selectedUtxos: Utxo[] = [];
            let inputAmount = 0;

            // Sort UTXOs by value (largest first) for efficient selection
            const sortedUtxos = [...utxos].sort((a, b) => b.value - a.value);

            // First, try to find a single UTXO that covers the amount with room for fee
            const initialFeeEstimate = calculateFee(1, 2);

            for (const utxo of sortedUtxos) {
                if (utxo.value >= amountToSend + initialFeeEstimate) {
                    selectedUtxos = [utxo];
                    inputAmount = utxo.value;
                    break;
                }
            }

            // If we couldn't find a single UTXO, collect multiple UTXOs
            if (selectedUtxos.length === 0) {
                // Start with smallest UTXOs to minimize dust issues
                const reverseSortedUtxos = [...utxos].sort(
                    (a, b) => a.value - b.value
                );

                for (const utxo of reverseSortedUtxos) {
                    selectedUtxos.push(utxo);
                    inputAmount += utxo.value;

                    // Recalculate fee based on current input/output count
                    const currentFeeEstimate = calculateFee(
                        selectedUtxos.length,
                        2
                    );

                    // Once we have enough to cover amount plus fee, we can stop
                    if (inputAmount >= amountToSend + currentFeeEstimate) {
                        break;
                    }
                }
            }

            // Recalculate fee based on exact inputs we'll use and whether we'll have change
            const willHaveChange =
                inputAmount >
                amountToSend + calculateFee(selectedUtxos.length, 1);
            const numOutputs = willHaveChange ? 2 : 1;
            const finalFee = calculateFee(selectedUtxos.length, numOutputs);

            // Calculate final change amount
            const changeAmount = inputAmount - amountToSend - finalFee;

            // Add inputs to the transaction
            for (const utxo of selectedUtxos) {
                // Get the full transaction data
                const txResponse = await axios.get(
                    `${apiUrl}/tx/${utxo.txid}/hex`
                );
                const txHex = txResponse.data;

                // Add input to PSBT, handling different address types correctly
                const inputData: any = {
                    hash: utxo.txid,
                    index: utxo.vout,
                    nonWitnessUtxo: Buffer.from(txHex, 'hex'),
                };

                // Handle native segwit inputs (P2WPKH)
                if (utxo.address === p2wpkhAddress) {
                    const p2wpkh = bitcoin.payments.p2wpkh({
                        pubkey: pubkeyBuffer,
                        network,
                    });

                    inputData.witnessUtxo = {
                        script: p2wpkh.output,
                        value: utxo.value,
                    };
                }

                // Handle nested segwit inputs (P2SH-P2WPKH)
                if (utxo.address === p2shP2wpkhAddress) {
                    const p2wpkh = bitcoin.payments.p2wpkh({
                        pubkey: pubkeyBuffer,
                        network,
                    });

                    const p2sh = bitcoin.payments.p2sh({
                        redeem: p2wpkh,
                        network,
                    });

                    inputData.witnessUtxo = {
                        script: p2sh.output!,
                        value: utxo.value,
                    };

                    inputData.redeemScript = p2wpkh.output;
                }

                // Add the input to the PSBT
                psbt.addInput(inputData);
            }

            // Add output for recipient
            psbt.addOutput({
                address: destAddress,
                value: amountToSend,
            });

            // Add change output if necessary
            if (changeAmount > 546) {
                // Send change back to the original address format
                const changeAddress = p2wpkhAddress || p2pkhAddress;

                psbt.addOutput({
                    address: changeAddress,
                    value: changeAmount,
                });
            }

            // Create a custom signer that adapts the ECPair to the Signer interface
            const signer = {
                publicKey: pubkeyBuffer,
                sign: (hash: Buffer) => Buffer.from(keyPair.sign(hash)),
            };

            // Sign all inputs
            for (let i = 0; i < psbt.inputCount; i++) {
                psbt.signInput(i, signer);
            }

            // Finalize and extract transaction
            psbt.finalizeAllInputs();
            const tx = psbt.extractTransaction();
            const serializedTx = tx.toHex();

            // Broadcast the transaction
            const broadcastResponse = await axios.post(
                `${apiUrl}/tx`,
                serializedTx,
                {
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                }
            );

            // The response from blockstream API is the transaction ID as plain text
            const txid = broadcastResponse.data;
            return txid;
        } catch (error: any) {
            console.error(`Bitcoin transfer error: ${error}`);
            throw new Error(`Failed to transfer Bitcoin: ${error.message}`);
        }
    }
}
