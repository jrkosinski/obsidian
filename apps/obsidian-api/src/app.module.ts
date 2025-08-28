import { Module } from '@nestjs/common';
import { AppController } from './controllers/app.controller';
import { AuthController } from './controllers/auth.controller';
import { AppService } from './services/app.service';
import { HttpModule } from '@nestjs/axios';
import { EscrowController } from './controllers/escrow.controller';
import { EscrowService } from './services/escrow.service';
import { AuthService } from './services/auth.service';
import { RelayController } from './controllers/relay.controller';
import { RelayService } from './services/relay.service';

@Module({
    imports: [HttpModule],
    controllers: [
        AppController,
        EscrowController,
        AuthController,
        RelayController,
    ],
    providers: [AppService, EscrowService, AuthService, RelayService],
})
export class AppModule {}
