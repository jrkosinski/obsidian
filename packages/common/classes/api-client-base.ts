import axios from 'axios';
import { ILogger } from '../logging';

/**
 * @title ApiClientBase
 * @description
 */
export class ApiClientBase {
    constructor(
        name: string,
        private readonly baseUrl: string,
        private readonly logger?: ILogger
    ) {
        this.baseUrl = this.baseUrl?.trim() ?? '';
    }

    protected async get<T>(route: string, params: any): Promise<T> {
        const url = this.concatUrl(route);
        this.logger?.info(`Sending GET ${url}`);
        const response = await axios.get(url, params);
        this.logger?.info(
            `GET ${url} returned ${response?.status} ${response?.statusText}`
        );
        return response?.data;
    }

    protected async post<T>(route: string, data: any): Promise<T> {
        const url = this.concatUrl(route);
        this.logger?.info(`Sending POST ${url}`);
        const response = await axios.post(url, data);
        this.logger?.info(
            `POST ${url} returned ${response?.status} ${response?.statusText}`
        );
        return response?.data;
    }

    protected async put<T>(route: string, data: any): Promise<T> {
        const url = this.concatUrl(route);
        this.logger?.info(`Sending PUT ${url}`);
        const response = await axios.put(url, data);
        this.logger?.info(
            `PUT ${url} returned ${response?.status} ${response?.statusText}`
        );
        return response?.data;
    }

    protected concatUrl(url: string): string {
        url = (url ?? '').trim();
        return `${
            this.baseUrl.endsWith('/')
                ? this.baseUrl.substring(0, this.baseUrl.length - 1)
                : this.baseUrl
        }/${url.startsWith('/') ? url.substring(1) : url}`;
    }
}
