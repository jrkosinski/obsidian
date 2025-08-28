import { Injectable } from '@nestjs/common';
import { ServiceBase } from 'common/classes';

@Injectable()
export class AppService extends ServiceBase {
    constructor() {
        super('AppService');
    }
}
