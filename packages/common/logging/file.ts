import { ILogger } from './ILogger';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { Config } from '../config';

/**
 * @title FileLogger
 * @description Logs to both console and rotating files.
 */
export class FileLogger implements ILogger {
    private logger: winston.Logger;

    constructor(
        private prefix: string = '',
        logDir: string = 'logs'
    ) {
        this.logger = winston.createLogger({
            level: Config.logLevel,
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss',
                }),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            transports: [
                // Rotating file transport for all logs
                new winston.transports.DailyRotateFile({
                    filename: `${logDir}/application-%DATE%.log`,
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '14d',
                }),
                // Separate file for error logs
                new winston.transports.DailyRotateFile({
                    filename: `${logDir}/error-%DATE%.log`,
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '14d',
                    level: 'error',
                }),
            ],
        });
    }

    private formatMessage(message: any): string {
        return this.prefix ? `${this.prefix}: ${message}` : message;
    }

    debug(message: any): Promise<void> {
        return new Promise(() => {
            if (Config.logToFile.includes('debug')) {
                try {
                    if (!process.env.RUNNING_UNIT_TESTS)
                        this.logger.debug(this.formatMessage(message));
                } catch (e: any) {}
            }
        });
    }

    info(message: any): Promise<void> {
        return new Promise(() => {
            if (Config.logToFile.includes('info')) {
                try {
                    if (!process.env.RUNNING_UNIT_TESTS)
                        this.logger.info(this.formatMessage(message));
                } catch (e: any) {}
            }
        });
    }

    warn(message: any): Promise<void> {
        return new Promise(() => {
            if (Config.logToFile.includes('warn')) {
                try {
                    if (!process.env.RUNNING_UNIT_TESTS)
                        this.logger.warn(this.formatMessage(message));
                } catch (e: any) {}
            }
        });
    }

    error(message: any, error?: any): Promise<void> {
        return new Promise(() => {
            if (Config.logToFile.includes('error')) {
                try {
                    if (!process.env.RUNNING_UNIT_TESTS)
                        this.logger.error(this.formatMessage(message), error);
                } catch (e: any) {}
            }
        });
    }
}
