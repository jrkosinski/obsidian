import { EventLog, EventType } from '../logging/events';
import { EventRecord, LogRecord } from '../models';

export interface ILogRepository {
    /**
     * Gets logs with optional filtering
     * @param level Optional log level filter (debug, info, warn, error)
     * @param dateFrom Optional start date filter (ISO string)
     * @param dateTo Optional end date filter (ISO string)
     * @param paymentAddress Optional payment address filter
     * @param sortField Optional field to sort by
     * @param sortOrder Optional sort order ('asc' or 'desc')
     * @param page Optional page number for pagination
     * @param pageSize Optional number of logs per page
     * @returns Filtered and paginated logs
     */
    getLogsWithFilters(
        level?: string[],
        dateFrom?: string,
        dateTo?: string,
        paymentAddress?: string,
        sortField?: string,
        sortOrder?: 'asc' | 'desc',
        page?: number,
        pageSize?: number
    ): Promise<{ logs: LogRecord[]; total: number }>;

    /**
     * Gets all logs associated with the given address, sorted by date.
     * @param address
     */
    getLogsForAddress(address: string): Promise<LogRecord[]>;

    /**
     * Writes a log entry to the data store.
     * @param level The log level (e.g., 'debug', 'info', 'warn', 'error').
     * @param message Text of the log message.
     * @param error Optional error object or message.
     * @param paymentAddress Optional payment address associated with the log.
     */
    writeLog(
        level: string,
        message: any,
        error?: any,
        paymentAddress?: string
    ): Promise<void>;

    /**
     * Gets events with optional filtering
     * @param eventTypes Optional event type filtering (see EventType enum)
     * @param dateFrom Optional start date filter (ISO string)
     * @param dateTo Optional end date filter (ISO string)
     * @param paymentAddress Optional payment address filter
     * @param sortField Optional field to sort by
     * @param sortOrder Optional sort order ('asc' or 'desc')
     * @param page Optional page number for pagination
     * @param pageSize Optional number of logs per page
     * @returns Filtered and paginated logs
     */
    getEventsWithFilters(
        eventTypes?: EventType[],
        dateFrom?: string,
        dateTo?: string,
        paymentAddress?: string,
        sortField?: string,
        sortOrder?: 'asc' | 'desc',
        page?: number,
        pageSize?: number
    ): Promise<{ events: EventRecord[]; total: number }>;

    /**
     * Gets all events associated with the given address, sorted by date.
     * @param address
     */
    getEventsForAddress(address: string): Promise<EventRecord[]>;

    /**
     * Logs a special event to the data store.
     * @param event
     */
    writeEvent(event: EventLog): Promise<void>;
}
