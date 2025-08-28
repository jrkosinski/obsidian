import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { AppService } from '../services/app.service';
import { ControllerBase } from 'common/classes';
import { LoggerFactory } from '../classes/logging/factory';

@Controller('/api/v1/')
export class AppController extends ControllerBase {
    constructor(protected readonly appService: AppService) {
        super('AppController', LoggerFactory.createLogger('AppController'));
    }

    @Get()
    @HttpCode(200)
    status() {
        return 'hi!';
    }

    /**
     * Validates if a wallet exists and returns its information.
     *
     * @param input: address
     * @returns Status and validation result
     */
    @Get('test')
    @HttpCode(200)
    async test(@Query('address') address: string): Promise<void> {
        try {
        } catch (e: any) {
            console.log(e);
        }
    }
}
