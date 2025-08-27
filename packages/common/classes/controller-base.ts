import {
    BadRequestException,
    HttpException,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { ServiceMethodOutput } from '../models';
import { ILogger } from '../logging';

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

/**
 * @title ControllerBase
 * @description Abstract base class for all controllers.
 */
export abstract class ControllerBase {
    protected readonly logger: ILogger;

    constructor(name: string, logger: ILogger) {
        this.logger = logger;
    }

    protected async executeRequest(
        endpoint: string,
        action: () => Promise<any>,
        paymentAddress?: string
    ): Promise<any> {
        try {
            // Skip logging for log-related endpoints to prevent recursive logging
            const isLogEndpoint =
                endpoint.includes('/logs/') ||
                endpoint.toLowerCase().includes('logs');

            if (!isLogEndpoint) {
                this.logger.info(endpoint, paymentAddress);
            }

            const output: any = await action();

            // Skip logging for log-related endpoints to prevent recursive logging
            if (!isLogEndpoint) {
                this.logger.info(
                    `${endpoint} returning ${JSON.stringify(output)}`,
                    paymentAddress
                );
            }

            console.log('returning', output);
            return output;
        } catch (e: any) {
            if (e instanceof HttpException) throw e;
            const errorMessage = e.message || String(e);
            this.logger.error(
                `Error in ${endpoint}: ${errorMessage}`,
                e,
                paymentAddress
            );
            throw new InternalServerErrorException(e);
        }
    }

    protected handleOutputErrors<T>(
        endpoint: string,
        output: ServiceMethodOutput<T>,
        paymentAddress?: string
    ) {
        if (output?.code) {
            if (output.code === 400) {
                this.throwException(
                    endpoint,
                    output.code,
                    output?.message ?? '',
                    new BadRequestException(output.message),
                    paymentAddress
                );
            }
            if (output.code === 404) {
                this.throwException(
                    endpoint,
                    output.code,
                    output?.message ?? '',
                    new NotFoundException(output.message),
                    paymentAddress
                );
            }
            if (output.code === 500) {
                this.throwException(
                    endpoint,
                    output.code,
                    output?.message ?? '',
                    new InternalServerErrorException(output.message),
                    paymentAddress
                );
            } else if (output.code) {
                this.throwException(
                    endpoint,
                    output.code,
                    output?.message ?? '',
                    new InternalServerErrorException(
                        `code: ${output.code} message: ${output.message}`
                    ),
                    paymentAddress
                );
            }
        }
    }

    protected throwException(
        endpoint: string,
        code: number,
        message: string,
        exception: any,
        paymentAddress?: string
    ) {
        this.logger.error(
            `${endpoint} returning error code ${code}: ${message}`,
            null,
            paymentAddress
        );
        throw exception;
    }
}
