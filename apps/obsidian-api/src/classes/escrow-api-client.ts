import { ApiClientBase } from 'common/classes';
import { LoggerFactory } from './logging/factory';
import { Escrow, EscrowApiInput, EscrowInput } from 'common/models';

export class EscrowApiClient extends ApiClientBase {
    constructor() {
        super(
            'EscrowApiClient',
            'http://localhost:3090/api/v1/',
            LoggerFactory.createLogger('EscrowApiClient')
        );
    }

    async getEscrow(
        chainId: string,
        escrowAddress: string,
        escrowId: string
    ): Promise<Escrow> {
        const route = `escrow?chainId=${chainId}&escrowAddress=${escrowAddress}&escrowId=${escrowId}`;
        return await this.get<Escrow>(route, {});
    }

    async createEscrow(input: EscrowApiInput): Promise<Escrow> {
        const route = `escrow`;
        return await this.post<Escrow>(route, input);
    }

    async createRelayNode(
        chainId: string,
        escrowAddress: string,
        escrowId: string
    ): Promise<string> {
        const route = `relay`;
        return await this.post<string>(route, {
            chainId,
            escrowAddress,
            escrowId,
        });
    }

    async pumpRelayNode(
        chainId: string,
        relayNodeAddress: string
    ): Promise<string> {
        const route = `relay`;
        return await this.put<string>(route, { chainId, relayNodeAddress });
    }

    async getRelayNodeBalance(
        chainId: string,
        currencyAddress: string,
        relayNodeAddress: string
    ): Promise<string> {
        const route = `relay`;
        return await this.get<string>(route, {
            chainId,
            currencyAddress,
            relayNodeAddress,
        });
    }
}
