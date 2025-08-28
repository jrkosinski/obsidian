import { Injectable } from '@nestjs/common';
import { ServiceBase } from 'common/classes';
import {
    ChainType,
    RelayNodeApiInput,
    ServiceMethodOutput,
} from 'common/models';
import { EscrowApiClient } from '../classes/escrow-api-client';
import { EscrowRecord, RelayNode } from 'data-access/entity';
import {
    IEscrowDataService,
    EscrowDataService,
    IRelayNodeDataService,
    RelayNodeDataService,
} from 'data-access/repositories';
import { Config } from 'common/config';
import { ethers } from 'ethers';

export type RelayNodeApiOutput = {
    amountBefore: string;
    amountAfter: string;
};

@Injectable()
export class RelayService extends ServiceBase {
    escrowClient: EscrowApiClient = new EscrowApiClient();
    relayNodeRepository: IRelayNodeDataService = new RelayNodeDataService();
    escrowRepository: IEscrowDataService = new EscrowDataService();

    constructor() {
        super('RelayService');
    }

    public async createRelayNode(
        input: RelayNodeApiInput
    ): Promise<ServiceMethodOutput<RelayNode>> {
        try {
            const chainId = input.chainId ?? Config.defaultChainId;

            //validate input
            const validationOutput =
                await this._validateRelayNodeApiInput<RelayNode>(input);
            if (validationOutput) return validationOutput;

            //create a relay node on chain
            const relayNodeAddress = await this.escrowClient.createRelayNode(
                chainId,
                input.escrowAddress,
                input.escrowId
            );

            //save in database
            let relayNode: RelayNode = {
                escrowId: input.escrowId,
                address: relayNodeAddress,
            };

            await this.relayNodeRepository.createRelayNode(relayNode);

            return {
                data: relayNode,
            };
        } catch (e: any) {
            return {
                message: e.message,
                code: 500,
            };
        }
    }

    public async pumpRelayNode(
        chainType: ChainType = ChainType.EVM,
        chainId: string = Config.defaultChainId,
        escrowId: string,
        relayNodeAddress: string
    ): Promise<ServiceMethodOutput<RelayNodeApiOutput>> {
        try {
            chainId = chainId ?? Config.defaultChainId;

            //validate the escrow id
            const validationEscrowIdOutput =
                this.validateEscrowId<RelayNodeApiOutput>(escrowId);
            if (validationEscrowIdOutput) return validationEscrowIdOutput;

            //validate the relay node address
            const validationAddressOutput =
                this.validateEthAddress<RelayNodeApiOutput>(
                    relayNodeAddress,
                    'relayNodeAddress'
                );
            if (validationAddressOutput) return validationAddressOutput;

            //get the escrow record
            const escrowRecord: EscrowRecord | null =
                await this.escrowRepository.getEscrowById(escrowId);

            if (!escrowRecord) {
                return this.create404Output(
                    `Escrow with id ${escrowId} does not exist`
                );
            }

            //get the balance before & after pumping
            const amountBefore = await this._getRelayNodeBalance(
                chainId,
                escrowRecord.currency,
                relayNodeAddress
            );
            await this.escrowClient.pumpRelayNode(chainId, relayNodeAddress);
            const amountAfter = await this._getRelayNodeBalance(
                chainId,
                escrowRecord.currency,
                relayNodeAddress
            );

            return {
                data: { amountBefore, amountAfter },
            };
        } catch (e: any) {
            return {
                message: e.message,
                code: 500,
            };
        }
    }

    public async getRelayNodeBalance(
        chainId: string,
        currencyAddress: string,
        relayNodeAddress: string
    ): Promise<ServiceMethodOutput<string>> {
        //validate input
        if (!chainId?.length) {
            chainId = Config.defaultChainId;
        }
        if (!currencyAddress?.length) {
            currencyAddress = ethers.ZeroAddress;
        }
        const validationAddressOutput = this.validateEthAddress<string>(
            relayNodeAddress,
            'relayNodeAddress'
        );
        if (validationAddressOutput) return validationAddressOutput;

        const output =
            (
                await this.escrowClient.getRelayNodeBalance(
                    chainId,
                    currencyAddress,
                    relayNodeAddress
                )
            )?.toString() ?? '';

        return { data: output };
    }

    // -- NON-PUBLIC METHODS --

    private async _getRelayNodeBalance(
        chainId: string,
        currencyAddress: string,
        relayNodeAddress: string
    ): Promise<string> {
        return (
            (
                await this.escrowClient.getRelayNodeBalance(
                    chainId,
                    currencyAddress,
                    relayNodeAddress
                )
            )?.toString() ?? ''
        );
    }

    private async _validateRelayNodeApiInput<T>(
        input: RelayNodeApiInput
    ): Promise<ServiceMethodOutput<T> | null> {
        const create400Output = (message: string) => {
            return {
                message,
                code: 400,
            };
        };
        const create404Output = (message: string) => {
            return {
                message,
                code: 404,
            };
        };

        if (!input.escrowId?.length)
            return create400Output('No escrowId provided');
        if (!input.escrowAddress?.length)
            return create400Output('No escrowAddress provided');

        //get the escrow record
        const escrowRecord: EscrowRecord | null =
            await this.escrowRepository.getEscrowById(input.escrowId);

        if (!escrowRecord) {
            return create404Output(
                `Escrow with id ${input.escrowId} does not exist`
            );
        }

        return null; //no errors
    }
}
