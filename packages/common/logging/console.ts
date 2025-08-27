import { Config } from '../config';
import { ILogger } from './ILogger';
import * as winston from 'winston';

/**
 * @title ConsoleLogger
 * @description Just logs to the console.
 */
export class ConsoleLogger implements ILogger {
    constructor(private prefix: string = '') {}

    private formatMessage(message: any): string {
        return this.prefix ? `${this.prefix}: ${message}` : message;
    }

    debug(message: any): Promise<void> {
        return new Promise(() => {
            if (Config.logToConsole.includes('debug')) {
                try {
                    if (!process.env.RUNNING_UNIT_TESTS)
                        winstonLogger.debug(this.formatMessage(message));
                } catch (e: any) {}
            }
        });
    }

    info(message: any): Promise<void> {
        return new Promise(() => {
            if (Config.logToConsole.includes('info')) {
                try {
                    if (!process.env.RUNNING_UNIT_TESTS)
                        winstonLogger.info(this.formatMessage(message));
                } catch (e: any) {}
            }
        });
    }

    warn(message: any): Promise<void> {
        return new Promise(() => {
            if (Config.logToConsole.includes('warn')) {
                try {
                    if (!process.env.RUNNING_UNIT_TESTS)
                        winstonLogger.warn(this.formatMessage(message));
                } catch (e: any) {}
            }
        });
    }

    error(message: any, error?: any): Promise<void> {
        return new Promise(() => {
            if (Config.logToConsole.includes('error')) {
                try {
                    if (!process.env.RUNNING_UNIT_TESTS)
                        winstonLogger.error(this.formatMessage(message), error);
                } catch (e: any) {}
            }
        });
    }
}

const winstonLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        winston.format.errors({ stack: true }),
        winston.format.json() // Removing splat if not using interpolation
    ),

    transports: [
        //new winston.transports.File({ filename: 'error.log', level: 'error' }),
        //new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple() // Both console and file can use simple
            ),
        }),
    ],
});
