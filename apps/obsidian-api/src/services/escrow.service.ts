import { Injectable } from '@nestjs/common';
import { ServiceBase } from 'common/classes';
import {
    ChainType,
    Escrow,
    EscrowApiInput,
    EscrowOutput,
    EscrowStatus,
    ServiceMethodOutput,
} from 'common/models';
import { EscrowApiClient } from '../classes/escrow-api-client';
import { EscrowRecord } from 'data-access/entity';
import {
    IEscrowDataService,
    EscrowDataService,
} from 'data-access/repositories';
import { ChainHelpers } from 'src/chain-helpers';
import { Config } from 'common/config';
import { isNumeric, isValidUuid } from 'common/utils';

export type EscrowFullOutput = {
    data: EscrowRecord | null;
    chain: Escrow | null;
};

@Injectable()
export class EscrowService extends ServiceBase {
    escrowClient: EscrowApiClient = new EscrowApiClient();
    escrowDataService: IEscrowDataService = new EscrowDataService();

    constructor() {
        super('EscrowService');
    }

    public async getEscrow(
        id: string,
        getOnChain: boolean = false
    ): Promise<ServiceMethodOutput<EscrowOutput>> {
        console.log(`getEscrow ${id}`);
        try {
            //validate escrow id
            const validationOutput = this.validateEscrowId<EscrowOutput>(id);
            if (validationOutput) return validationOutput;

            //get the escrow record
            const escrowRecord: EscrowRecord | null =
                await this.escrowDataService.getEscrowById(id);

            //if there's one in the db, then get from chain as well
            if (escrowRecord) {
                let onChainRecord = null;

                if (getOnChain) {
                    onChainRecord = await this.escrowClient.getEscrow(
                        escrowRecord.chainId,
                        escrowRecord.address,
                        id
                    );
                }
                return {
                    data: this._constructEscrowOutput(
                        escrowRecord,
                        onChainRecord
                    ),
                };
            } else {
                //otherwise, return 404
                return {
                    message: `Escrow with id ${id} not found`,
                    code: 404,
                };
            }
        } catch (e: any) {
            //general error
            return {
                message: e.message,
                code: 500,
            };
        }
    }

    public async getEscrows(
        filter?: string
    ): Promise<ServiceMethodOutput<EscrowRecord[]>> {
        try {
            //retrieve & return escrows
            let escrows: EscrowRecord[] =
                await this.escrowDataService.getEscrows();

            if (filter) {
                escrows = escrows.filter(
                    (e) =>
                        e.address.toLowerCase() ===
                            filter.trim().toLowerCase() ||
                        e.receiver.toLowerCase() ===
                            filter.trim().toLowerCase() ||
                        e.payer.toLowerCase() === filter.trim().toLowerCase()
                );
            }

            return {
                data: escrows,
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
    ): Promise<ServiceMethodOutput<EscrowOutput>> {
        try {
            //validate the input
            const validationOutput =
                this._validateEscrowApiInput<EscrowOutput>(input);
            if (validationOutput) return validationOutput;

            //TODO: (LOW) need a method to convert between types
            //create the record to commit to db
            let escrowRecord: EscrowRecord = {
                chainId: input.chainId?.toString() ?? Config.defaultChainId,
                //chain_type
                address: input.escrowAddress,
                payer: input.payer,
                receiver: input.receiver,
                currency: input.currency,
                amount: BigInt(input.amount),
                relayNodes: [],
                quorum: input.quorum,
                arbitrationModule: input.arbitrationModule,
            };

            try {
                if (input.id) input.id = '';

                //add escrow to database
                escrowRecord = await this.escrowDataService.createEscrow(
                    escrowRecord,
                    input.arbiters
                );
                input.id = escrowRecord.id ?? '';

                let escrow: Escrow | null = null;
                if (input.deploy) {
                    //if that succeeded, add it to the blockchain
                    const deployOutput = await this.deployEscrow(input.id);
                    if (deployOutput.data) {
                        escrow = deployOutput.data;
                    } else {
                        //if it failed, return what is available (the DB record) with errors
                        return {
                            data: this._constructEscrowOutput(escrowRecord),
                            code: deployOutput.code,
                            message: deployOutput.message,
                        };
                    }
                }

                //return all available data on success
                return {
                    data: this._constructEscrowOutput(escrowRecord, escrow),
                };
            } catch (e: any) {
                return {
                    message: `Error adding escrow record to database: ${e.message}`,
                    code: 500,
                };
            }
        } catch (e: any) {
            return {
                message: e.message,
                code: 500,
            };
        }
    }

    public async deployEscrow(
        id: string,
        force: boolean = false
    ): Promise<ServiceMethodOutput<EscrowOutput>> {
        try {
            //validate escrow id
            const validationOutput = this.validateEscrowId<EscrowOutput>(id);
            if (validationOutput) return validationOutput;

            //attempt to get the escrow record
            const escrowOutput = await this.getEscrow(id);
            if (!escrowOutput.data) {
                return {
                    code: escrowOutput.code,
                    message: escrowOutput.message,
                };
            }

            //verify that data is present
            if (!escrowOutput.data) {
                return {
                    code: 404,
                    message: `Escrow ${id} missing data in the database.`,
                };
            }

            const escrowRecord: EscrowOutput = escrowOutput.data;

            //make sure not already deployed
            if (escrowRecord.deployed && !force) {
                return {
                    code: 400,
                    message: `Escrow ${id} is already deployed.`,
                };
            }

            //input to deploy
            const escrowApiInput: EscrowApiInput = {
                id: id,
                arbiters: [],
                startTime: escrowRecord.startTime, //parseInt(escrowRecord.startDate?.toString() ?? '0'),
                endTime: escrowRecord.endTime, //parseInt(escrowRecord.endDate?.toString() ?? '0'),
                quorum: escrowRecord.quorum,
                arbitrationModule: escrowRecord.arbitrationModule,
                chainType: ChainType.EVM,
                chainId: escrowRecord.chainId,
                payer: escrowRecord.payer,
                receiver: escrowRecord.receiver,
                currency: escrowRecord.currency,
                amount: escrowRecord.amount.toString(),
                escrowAddress: escrowRecord.address,
            };

            //deploy the escrow
            const escrow = await this.escrowClient.createEscrow(escrowApiInput);

            //return the full escrow
            return await this.getEscrow(id, true);
        } catch (e: any) {
            return {
                message: `Error deploying escrow ${id} to blockchain: ${e.message}`,
                code: 500,
            };
        }
    }

    // -- NON-PUBLIC METHODS --

    private _constructEscrowOutput(
        dataRecord: EscrowRecord,
        onChainRecord?: Escrow | null
    ): EscrowOutput {
        return {
            id: dataRecord.id ?? '',
            chainId: dataRecord.chainId,
            address: dataRecord.address,
            receiver: onChainRecord?.receiver ?? dataRecord.receiver,
            payer: onChainRecord?.payer ?? dataRecord.payer,
            amountPaid: onChainRecord?.amountPaid ?? '',
            amount: onChainRecord?.amount ?? dataRecord.amount.toString(),
            amountRefunded: onChainRecord?.amountRefunded ?? '',
            amountReleased: onChainRecord?.amountReleased ?? '',
            currency: onChainRecord?.currency ?? dataRecord.currency,
            createdAt: dataRecord.createdAt ?? new Date(0),
            deployedAt: dataRecord.deployedAt,
            arbiters: dataRecord.arbiters?.map((r) => r.address) ?? [],
            relayNodes: dataRecord.relayNodes?.map((r) => r.address) ?? [],
            quorum: onChainRecord?.quorum ?? dataRecord.quorum,
            arbitrationModule:
                onChainRecord?.arbitrationModule ??
                dataRecord.arbitrationModule,
            startTime:
                onChainRecord?.startTime ??
                dataRecord.startDate?.getUTCMilliseconds() ??
                0,
            endTime:
                onChainRecord?.endTime ??
                dataRecord.endDate?.getUTCMilliseconds() ??
                0,
            fullyPaid: onChainRecord?.fullyPaid ?? false,
            receiverReleased: onChainRecord?.receiverReleased ?? false,
            payerReleased: onChainRecord?.payerReleased ?? false,
            released: onChainRecord?.released ?? false,
            timestamp: onChainRecord?.timestamp ?? 0,
            status: onChainRecord?.status ?? EscrowStatus.PENDING,
            deployed: onChainRecord?.id == dataRecord.id ? true : false,
        };
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
