import { Injectable } from '@nestjs/common';
import { ServiceBase } from 'common/classes';
import {
    ChainType,
    Escrow,
    EscrowApiInput,
    ServiceMethodOutput,
} from 'common/models';
import { Config } from 'common/config';
import { PolyEscrow } from '../classes/poly-escrow';
import { ethers, Wallet } from 'ethers';
import { isNumeric } from 'common/utils';

/*
  SecurityContext deployed:   0x5F98Da94E5CBE98A109a1416864F16e6A1bCBd3a
  SystemSettings deployed:    0x204a63b439c10502799C7E70b569B615ac1A9B69
  PolyEscrow deployed:        0xcd9Bb7c373b96F83AECD14aD8252E00d9F021de1
*/

@Injectable()
export class EscrowService extends ServiceBase {
    constructor() {
        super('EscrowService');
    }

    public async getEscrow(
        chainId: string,
        escrowAddress: string,
        escrowId: string
    ): Promise<ServiceMethodOutput<Escrow>> {
        try {
            //validate input
            if (!chainId?.length) chainId = Config.defaultChainId;

            //validate escrow address
            const escrowAddressOutput = this.validateEthAddress<Escrow>(
                escrowAddress,
                'Escrow address'
            );
            if (escrowAddressOutput) return escrowAddressOutput;

            //validate escrow id
            const escrowIdOutput = this.validateEscrowId<Escrow>(escrowId);
            if (escrowIdOutput) return escrowIdOutput;

            //validate escrow address
            const polyEscrow = new PolyEscrow(chainId, escrowAddress);
            const data = await await polyEscrow.getEscrow(escrowId);
            return {
                data,
            };
        } catch (e: any) {
            return {
                message: e.message,
                code: 500,
            };
        }
    }

    public async createEscrow(
        input: EscrowApiInput
    ): Promise<ServiceMethodOutput<Escrow>> {
        try {
            //validate the input
            const validationOutput =
                this._validateEscrowApiInput<Escrow>(input);
            if (validationOutput) return validationOutput;

            const chainType: ChainType = input.chainType ?? ChainType.EVM;
            const chainId: string = input.chainId ?? Config.defaultChainId;

            const polyEscrow = new PolyEscrow(
                chainId,
                input.escrowAddress,
                new Wallet(
                    Config.homeWalletPrivateKey,
                    new ethers.JsonRpcProvider(Config.getHttpsRpcUrl(chainId))
                )
            );

            return {
                data: await polyEscrow.createEscrow(input),
            };
        } catch (e: any) {
            return {
                message: e.message,
                code: 500,
            };
        }
    }

    private _validateEscrowApiInput<T>(
        input: EscrowApiInput
    ): ServiceMethodOutput<T> | null {
        //validate escrow address
        if (!input.escrowAddress?.length) {
            input.escrowAddress = Config.getDefaultEscrowAddress(
                input.chainId ?? Config.defaultChainId
            );
        }
        const validEscrowAddressOutput = this.validateEthAddress<T>(
            input.escrowAddress,
            'escrowAddress'
        );
        if (validEscrowAddressOutput) return validEscrowAddressOutput;

        //validate payer
        const validPayerOutput = this.validateEthAddress<T>(
            input.payer,
            'payer'
        );
        if (validPayerOutput) return validPayerOutput;

        //validate receiver
        const validReceiverOutput = this.validateEthAddress<T>(
            input.receiver,
            'receiver'
        );
        if (validReceiverOutput) return validReceiverOutput;

        //validate currency
        if (!input.currency?.length)
            input.currency = '0x0000000000000000000000000000000000000000';
        const validCurrencyOutput = this.validateEthAddress<T>(
            input.currency,
            'currency'
        );
        if (validCurrencyOutput) return validCurrencyOutput;

        //validate input amount
        if (
            !input.amount?.length ||
            !isNumeric(input.amount) ||
            BigInt(input.amount) <= 0
        ) {
            return {
                message: 'Invalid or missing amount provided',
                code: 400,
            };
        }

        return null; //no errors
    }
}
