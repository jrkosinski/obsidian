import { ethers } from 'ethers';
import { ContractBase } from './contract-base';
import { relayNode } from '../contract-artifacts/relay-node';

export class RelayNode extends ContractBase {
    constructor(chainId: string, address: string, wallet?: ethers.Wallet) {
        super(chainId, address, relayNode.abi, wallet);
    }

    async relay(): Promise<void> {
        try {
            return await this.contract.relay();
        } catch (error) {
            throw new Error(`Failed to call relay on RelayNode: ${error}`);
        }
    }

    async refundAll(currency: string): Promise<void> {
        try {
            return await this.contract.refundAll(currency);
        } catch (error) {
            throw new Error(`Failed to call refundAll on RelayNode: ${error}`);
        }
    }
}
