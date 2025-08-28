import { Body, Controller, Get, HttpCode, Post, Put } from '@nestjs/common';
import { EscrowService } from '../services/escrow.service';
import { ControllerBase } from 'common/classes';
import { LoggerFactory } from '../classes/logging/factory';
import { RelayService } from '../services/relay.service';

@Controller('/api/v1/relay/')
export class RelayController extends ControllerBase {
    constructor(
        protected readonly escrowService: EscrowService,
        protected readonly relayService: RelayService
    ) {
        super('RelayController', LoggerFactory.createLogger('RelayController'));
    }

    @Get('')
    @HttpCode(200)
    async getRelayNodeBalance(
        @Body()
        input: {
            chainId: string;
            currencyAddress: string;
            relayNodeAddress: string;
        }
    ): Promise<string> {
        const endpoint: string = `GET /relay: ${JSON.stringify(input)}`;

        return await this.executeRequest(endpoint, async () => {
            const result = await this.relayService.getRelayNodeBalance(
                input.chainId,
                input.currencyAddress,
                input.relayNodeAddress
            );

            this.handleOutputErrors(endpoint, result);

            return result.data;
        });
    }

    @Post('')
    @HttpCode(201)
    async createRelayNode(
        @Body()
        input: {
            chainId: string;
            escrowAddress: string;
            escrowId: string;
        }
    ): Promise<boolean> {
        const endpoint: string = `POST /relay: ${JSON.stringify(input)}`;

        return await this.executeRequest(endpoint, async () => {
            const result = await this.relayService.deployRelayNode(
                input.chainId,
                input.escrowAddress,
                input.escrowId
            );

            this.handleOutputErrors(endpoint, result);

            return result.data;
        });
    }

    @Put('')
    @HttpCode(201)
    async pumpRelayNode(
        @Body()
        input: {
            chainId: string;
            relayNodeAddress: string;
        }
    ): Promise<boolean> {
        const endpoint: string = `PUT /relay: ${JSON.stringify(input)}`;

        return await this.executeRequest(endpoint, async () => {
            const result = await this.relayService.pumpRelayNode(
                input.chainId,
                input.relayNodeAddress
            );

            this.handleOutputErrors(endpoint, result);

            return result.data;
        });
    }
}
