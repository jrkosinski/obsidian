import { ILogger } from './ILogger';

/**
 * @title NullLogger
 * @description Does nothing.
 */
export class NullLogger implements ILogger {
    constructor() {}

    async debug(message: any): Promise<void> {}
    async info(message: any): Promise<void> {}
    async warn(message: any): Promise<void> {}
    async error(message: any, error?: any): Promise<void> {}
}
