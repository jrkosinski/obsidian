import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { ControllerBase } from 'common/classes';
import { LoggerFactory } from '../classes/logging/factory';

@Controller('/api/v1/auth')
export class AuthController extends ControllerBase {
    constructor(protected readonly authService: AuthService) {
        super('AuthController', LoggerFactory.createLogger('AuthController'));
    }

    /**
     * Validates if a wallet exists and returns its information.
     *
     * @param input: address
     * @returns Status and validation result
     */
    @Get('nonce')
    @HttpCode(200)
    async getNonce(): Promise<{ nonce: string }> {
        return { nonce: 'abc' };
    }

    @Post()
    @HttpCode(201)
    async authenticate(
        @Body() input: { message: string; signature: string }
    ): Promise<{ token: string; isNewUser: boolean }> {
        return { token: 'aok', isNewUser: false };

        /*
        //verify the signature
        const siweMessage = new SiweMessage(message);
        let siweResponse = await siweMessage.verify({ signature });
        handler.logger.debug(
            'siwe response is ' + JSON.stringify(siweResponse)
        );
        if (!siweResponse.success) {
            throw new Error('Error in validating wallet address signature');
        }

        const wallet_address = siweResponse.data?.address
            ?.trim()
            ?.toLowerCase();

        //get the user record
        handler.logger.debug('finding user...');
        let storeUser = await UserRepository.findOne({
            where: { wallet_address },
        });
        handler.logger.debug('found user ' + storeUser?.id);
        let isNewUser = false;

        if (!storeUser) {
            handler.logger.info(
                'User not found, creating new seller user via wallet...'
            );
            storeUser = await userService.createSellerUserFromWallet({
                wallet_address,
            });
            isNewUser = true;
            handler.logger.debug('new user created with id ' + storeUser.id);
        }

        let defaultCurrency = null;
        if (storeUser.store_id) {
            const storeRepository = req.scope.resolve('storeRepository');
            const storeData = await storeRepository.findOne({
                where: { id: storeUser.store_id },
                select: ['default_currency_code'],
            });
            defaultCurrency = storeData?.default_currency_code || 'eth';
        }

        //once authorized, return a JWT token
        const token = jwt.sign(
            {
                store_id: storeUser.store_id ?? '',
                wallet_address,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '24h',
            }
        );

        return handler.returnStatus(200, {
            token,
            newUser: isNewUser,
            default_currency_code: defaultCurrency,
        });
        */
    }
}
