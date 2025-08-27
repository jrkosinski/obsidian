import { Injectable } from '@nestjs/common';
import { ILogger } from '../logging';
import { ServiceMethodOutput } from '../models';
import { isValidUuid } from '../utils';

@Injectable()
export abstract class ServiceBase {
    protected readonly logger: ILogger;

    constructor(name: string) {
        //this.logger = LoggerFactory.createLogger(name);
    }

    protected validateExistenceOfInput<T>(
        value: any,
        name: string
    ): ServiceMethodOutput<T> | null {
        if (!value || !value?.toString()?.length)
            return this.create400Output<T>(`${name} is required`);

        return null;
    }

    protected validateNotFound<T>(
        value: any,
        name: string
    ): ServiceMethodOutput<T> | null {
        if (!value) return this.create404Output<T>(`${name} not found`);

        return null;
    }

    protected validateEscrowId<T>(id: string): ServiceMethodOutput<T> | null {
        //validate that it exists
        const escrowIdOutput = this.validateExistenceOfInput<T>(
            id,
            'Escrow id'
        );
        if (escrowIdOutput) return escrowIdOutput;

        //validate format
        if (!isValidUuid(id))
            return this.create400Output(`Invalid escrow id format: ${id}`);

        return null; //no errors
    }

    protected validateEthAddress<T>(
        address: string,
        name: string,
        required: boolean = true
    ): ServiceMethodOutput<T> | null {
        //validate that it exists
        if (required) {
            const addressOutput = this.validateExistenceOfInput<T>(
                address,
                name
            );
            if (addressOutput) return addressOutput;
        }

        //validate format
        if (address?.length) {
            if (!/^0x[a-fA-F0-9]{40}$/.test(address))
                return this.create400Output(
                    `Invalid format for ${name}: ${address}`
                );
        }

        return null; //no errors
    }

    protected create400Output<T>(message: string): ServiceMethodOutput<T> {
        return this.createErrorOutput<T>(message, 400);
    }

    protected create404Output<T>(message: string): ServiceMethodOutput<T> {
        return this.createErrorOutput<T>(message, 404);
    }

    protected create500Output<T>(message: string): ServiceMethodOutput<T> {
        return this.createErrorOutput<T>(message, 500);
    }

    protected createErrorOutput<T>(
        message: string,
        code: number
    ): ServiceMethodOutput<T> {
        return {
            message,
            code,
        };
    }
}
