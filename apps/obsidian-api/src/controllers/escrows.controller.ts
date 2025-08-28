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

@Controller('/api/v1/escrows/')
export class EscrowsController extends ControllerBase {
    constructor(protected readonly escrowService: EscrowService) {
        super(
            'EscrowsController',
            LoggerFactory.createLogger('EscrowsController')
        );
    }

    /**
     * Gets a list of escrows
     * @param id
     */
    @Get('')
    @HttpCode(200)
    async getEscrows(@Query('filter') filter: string): Promise<EscrowRecord[]> {
        const endpoint: string = `GET /escrows`;

        return await this.executeRequest(endpoint, async () => {
            const result = await this.escrowService.getEscrows(filter);

            this.handleOutputErrors<EscrowRecord[]>(endpoint, result);

            return result.data;
        });
    }
}
