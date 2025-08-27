/**
 * @title ILogger
 * @description
 */
export interface ILogger {
    debug(log: any, paymentAddress?: string): Promise<void>;

    info(log: any, paymentAddress?: string): Promise<void>;

    warn(log: any, paymentAddress?: string): Promise<void>;

    error(log: any, error?: any, paymentAddress?: string): Promise<void>;
}
