import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Post,
    Query,
} from '@nestjs/common';
import { EscrowService } from '../services/escrow.service';
import { ControllerBase } from 'common/classes';
import { LoggerFactory } from '../classes/logging/factory';
import { Escrow, EscrowApiInput, EscrowOutput } from 'common/models';
import { EscrowRecord } from 'data-access/entity';

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
    @Get(':id')
    @HttpCode(200)
    async getEscrow(
        @Param('id') id: string,
        @Query('full') full: string
    ): Promise<EscrowOutput | EscrowRecord[]> {
        const endpoint: string = `GET /escrow: ${id}`;
        const getOnChain: boolean = full === 'true';

        return await this.executeRequest(endpoint, async () => {
            const result = id?.length
                ? await this.escrowService.getEscrow(id, getOnChain)
                : await this.escrowService.getEscrows();

            this.handleOutputErrors<EscrowOutput | EscrowRecord[]>(
                endpoint,
                result
            );

            return result.data;
        });
    }

    /**
     * Gets a list of escrows
     * @param id
     */
    @Get('')
    @HttpCode(200)
    async getEscrows(): Promise<EscrowRecord[]> {
        const endpoint: string = `GET /escrow`;

        return await this.executeRequest(endpoint, async () => {
            const result = await this.escrowService.getEscrows();

            this.handleOutputErrors<EscrowRecord[]>(endpoint, result);

            return result.data;
        });
    }

    /**
     * Creates a new escrow with the given characteristics.
     * @param id
     */
    @Post('')
    @HttpCode(201)
    async createEscrow(@Body() input: EscrowApiInput): Promise<EscrowOutput> {
        const endpoint: string = `POST /escrow: ${JSON.stringify(input)}`;

        return await this.executeRequest(endpoint, async () => {
            const result = await this.escrowService.createEscrow(input);

            this.handleOutputErrors(endpoint, result);

            if (result.data) {
                console.log(result.data);
            }

            return result.data;
        });
    }

    /**
     * Deploys an escrow with the given id, provided that it exists.
     * @param id
     */
    @Post('/:id/deployment/')
    @HttpCode(201)
    async deployEscrow(@Param('id') id: string): Promise<EscrowOutput> {
        const endpoint: string = `POST /escrow/${id}/deployment`;

        return await this.executeRequest(endpoint, async () => {
            const force: boolean = false;

            // Fund the wallet
            const result = await this.escrowService.deployEscrow(id, force);

            this.handleOutputErrors(endpoint, result);

            return result.data;
        });
    }
}
