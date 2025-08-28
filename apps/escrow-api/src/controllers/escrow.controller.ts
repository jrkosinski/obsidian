import {
    Body,
    Controller,
    Get,
    HttpCode,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { EscrowService } from '../services/escrow.service';
import { ControllerBase } from 'common/classes';
import { LoggerFactory } from '../classes/logging/factory';
import { Escrow, EscrowApiInput, EscrowInput } from 'common/models';

@Controller('/api/v1/escrow/')
export class EscrowController extends ControllerBase {
    constructor(protected readonly escrowService: EscrowService) {
        super(
            'EscrowController',
            LoggerFactory.createLogger('EscrowController')
        );
    }

    /**
     * Gets the escrow denoted by ID.
     * @param id
     */
    @Get('')
    async getEscrow(
        @Query('chainId') chainId: string,
        @Query('escrowAddress') escrowAddress: string,
        @Query('escrowId') escrowId: string
    ): Promise<Escrow> {
        const endpoint: string = `GET /escrow: ${chainId}, ${escrowAddress}, ${escrowId}`;

        return await this.executeRequest(endpoint, async () => {
            const result = await this.escrowService.getEscrow(
                chainId,
                escrowAddress,
                escrowId
            );

            this.handleOutputErrors(endpoint, result);

            return result.data;
        });
    }

    /**
     * Creates a new escrow with the given characteristics.
     * @param id
     */
    @Post('')
    @HttpCode(201)
    async createEscrow(@Body() input: EscrowApiInput): Promise<Escrow> {
        const endpoint: string = `POST /escrow: ${JSON.stringify(input)}`;

        return await this.executeRequest(endpoint, async () => {
            const result = await this.escrowService.createEscrow(input);

            this.handleOutputErrors(endpoint, result);

            return result.data;
        });
    }
}
