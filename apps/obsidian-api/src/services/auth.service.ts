import { Injectable } from '@nestjs/common';
import { ServiceBase } from 'common/classes';

@Injectable()
export class AuthService extends ServiceBase {
    constructor() {
        super('AuthService');
    }
}
