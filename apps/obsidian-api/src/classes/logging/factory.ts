import { Config } from 'common/config';
import { ILogger } from 'common/logging';
import { FileLogger, ConsoleLogger, MultiLogger } from 'common/logging';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * @title LoggerFactory
 * @description Factory for creating logger instances based on configuration
 */
export class LoggerFactory {
    /**
     * Creates a combined logger.
     * @param prefix Optional prefix for log messages
     * @param logDir Directory for log files (only used by FileLogger)
     * @returns An ILogger implementation
     */
    static createLogger(prefix: string = '', logDir: string = 'logs'): ILogger {
        const loggers: ILogger[] = [];
        if (Config.logToConsole?.length)
            loggers.push(new ConsoleLogger(prefix));
        if (Config.logToFile?.length)
            loggers.push(new FileLogger(prefix, logDir));

        return new MultiLogger(loggers);
    }
}
