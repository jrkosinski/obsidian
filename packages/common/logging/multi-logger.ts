import { ILogger } from './ILogger';

/**
 * @title MultiLogger
 * @description Combines multiple loggers
 */
export class MultiLogger implements ILogger {
    constructor(protected readonly loggers: ILogger[]) {}

    debug(message: any, paymentAddress?: string): Promise<void> {
        return new Promise(() => {
            this.loggers.map((l) => {
                l.debug(message, paymentAddress);
            });
        });
    }

    info(message: any, paymentAddress?: string): Promise<void> {
        return new Promise(() => {
            this.loggers.map((l) => {
                l.info(message, paymentAddress);
            });
        });
    }

    warn(message: any, paymentAddress?: string): Promise<void> {
        return new Promise(() => {
            this.loggers.map((l) => {
                l.warn(message, paymentAddress);
            });
        });
    }

    error(message: any, error?: any, paymentAddress?: string): Promise<void> {
        return new Promise(() => {
            this.loggers.map((l) => {
                l.error(message, error, paymentAddress);
            });
        });
    }
}
