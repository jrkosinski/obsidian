import { BigNumberish } from 'ethers';
import { ChainType } from '../models';

/**
 * Chain-type specific handling for operations. Each of these would vary based on what type of chain is
 * being handled (e.g. EVM, Solana, etc.)
 */
export interface IChainHelper {
    /**
     * Override to return the chain type being served.
     */
    get chainType(): ChainType;

    /**
     * Get the balance of a wallet or account on the specific chain.
     * @param chainId The specific sub-chain (e.g. '11155111', 'testnet', etc. - may not be relevant for all chaintypes)
     * @param currency The currency to check the balance in; for EVM chains, this can be zero-address (for native) or the
     * token contract address for a token currency; this may not be relevant for all chain types (e.g. Bitcoin)
     * @param address The address of the wallet whose balance to check (relevant for all chain types)
     */
    getBalance(
        chainId: string,
        currency: string,
        address: string
    ): Promise<BigNumberish>;

    /**
     * Gets a list of accepted currencies (by name) for the chain type.
     */
    getAcceptedCurrencies(): string[];

    /**
     * Validates the format of an address for the specific chain type.
     * @param address The address to validate
     */
    validateAddressFormat(address: string): boolean;

    /**
     * Returns a list of transactions which paid into the given payment address.
     * @param chainId
     * @param paymentAddress
     */
    getPaymentTransactions(
        chainId: string,
        paymentAddress: string
    ): Promise<PaymentTransaction[]>;

    /**
     * Transfers a given amount of currency from source wallet to destination wallet.
     *
     * @param chainId
     * @param currency Address of the currency to transfer
     * @param amount The amount to transfer; can be the string 'max'
     * @param sourceWallet The PRIVATE KEY of the source wallet.
     * @param destAddress The ADDRESS of the destination wallet.
     * @returns The transaction id resulting from the transfer.
     */
    transfer(
        chainId: string,
        currency: string,
        amount: string,
        sourceWallet: string,
        destAddress: string
    ): Promise<string>;

    /**
     * Sends a refund of overpaid amount back to the original payer.
     *
     * @param chainId The chain ID to send the refund on
     * @param sourceAddress The payment address that received the overpayment (has the funds)
     * @param refundToAddress The address to send the refund to (original payer)
     * @param currency The currency address of the overpaid amount
     * @param refundAmount The amount to refund
     * @returns The transaction hash of the refund transaction
     */
    sendRefund(
        chainId: string,
        sourcePrivateKey: string,
        refundToAddress: string,
        currency: string,
        refundAmount: BigNumberish
    ): Promise<string>;
}

/**
 * Abstraction of a blockchain transaction.
 */
export type PaymentTransaction = {
    id: string;
    value: string;
};

// EXPORTS
export { EvmChainHelper } from './evm';
export { BitcoinChainHelper } from './bitcoin';
