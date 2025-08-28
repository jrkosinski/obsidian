import { polyEscrow } from '../contract-artifacts/poly-escrow';
import { Config } from 'common/config';
import { Escrow, EscrowApiInput, EscrowInput } from 'common/models';
import { BigNumberish, ethers } from 'ethers';
import { ContractBase } from './contract-base';

export class PolyEscrow extends ContractBase {
    constructor(chainId: string, address: string, wallet?: ethers.Wallet) {
        super(chainId, address, polyEscrow.abi, wallet);
    }

    async getEscrow(escrowId: string): Promise<Escrow> {
        try {
            const rawOutput = await this.contract.getEscrow(
                ethers.keccak256(ethers.toUtf8Bytes(escrowId))
            );

            return this._convertRawEscrow(rawOutput);
        } catch (error) {
            throw new Error(`Failed to get escrow: ${error}`);
        }
    }

    async createEscrow(input: EscrowInput): Promise<Escrow> {
        try {
            if (!input.arbiters?.length) {
                input.quorum = 0;
            }
            const realInput = {
                ...input,
                id: ethers.keccak256(ethers.toUtf8Bytes(input.id)),
            };

            console.log('creating escrow with input', realInput);

            const tx = await this.contract.createEscrow(realInput);
            await tx.wait();

            return await this.getEscrow(input.id);
        } catch (error) {
            throw new Error(`Failed to create escrow: ${error}`);
        }
    }

    async releaseEscrow(escrowId: string): Promise<Escrow> {
        try {
            await this.contract.releaseEscrow(
                ethers.keccak256(ethers.toUtf8Bytes(escrowId))
            );
            return await this.contract.getEscrow(escrowId);
        } catch (error) {
            throw new Error(`Failed to release escrow: ${error}`);
        }
    }

    async refundEscrow(
        escrowId: string,
        amount: BigNumberish
    ): Promise<Escrow> {
        try {
            await this.contract.refundEscrow(
                ethers.keccak256(ethers.toUtf8Bytes(escrowId)),
                amount
            );
            return await this.contract.getEscrow(escrowId);
        } catch (error) {
            throw new Error(`Failed to refund escrow: ${error}`);
        }
    }

    async deployRelayNode(escrowId: string): Promise<string> {
        try {
            const tx = await this.contract.deployRelayNode(
                ethers.keccak256(ethers.toUtf8Bytes(escrowId)),
                true
            );
            const receipt = await tx.wait();
            if (receipt?.logs?.length > 1 && receipt?.logs[0]?.args?.length > 0)
                return receipt.logs[1].args[0];
        } catch (e: any) {}
        return '';
    }

    private _convertRawEscrow(rawData: any[]): Escrow {
        return {
            id: rawData[0],
            payer: rawData[1],
            receiver: rawData[2],
            arbiters: rawData[3],
            quorum: rawData[4],
            amount: rawData[5],
            currency: rawData[6],
            amountRefunded: rawData[7],
            amountReleased: rawData[8],
            amountPaid: rawData[9],
            timestamp: rawData[10],
            startTime: rawData[11],
            endTime: rawData[12],
            status: rawData[13],
            fullyPaid: rawData[14],
            payerReleased: rawData[15],
            receiverReleased: rawData[16],
            released: rawData[17],
            arbitrationModule: rawData[18],
        };
    }
}
