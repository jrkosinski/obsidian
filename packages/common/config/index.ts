import { ChainType } from '../models';

function getPrefix(chainType: ChainType): string {
    return chainType == ChainType.EVM
        ? 'ETHERS'
        : chainType.trim().toUpperCase();
}

/**
 * @title Config
 * @description Encapsulates and exposes config settings, mainly from .env.
 */
export class Config {
    public static getWssRpcUrl(
        chainId: string,
        chainType: ChainType = ChainType.EVM
    ) {
        const output =
            process.env[
                `${getPrefix(chainType)}_WSS_RPC_URL_${chainId.toUpperCase()}`
            ] ?? '';
        if (!output?.length)
            throw new Error(
                `WSS RPC not supported for chain ${chainId.toUpperCase()}`
            );
        return output;
    }

    public static getHttpsRpcUrl(
        chainId: string,
        chainType: ChainType = ChainType.EVM
    ) {
        const output =
            process.env[
                `${getPrefix(chainType)}_HTTPS_RPC_URL_${chainId.toUpperCase()}`
            ] ?? '';
        if (!output?.length)
            throw new Error(
                `HTTPS RPC not supported for chain ${chainId.toUpperCase()}`
            );
        return output;
    }

    public static getSecurityContextAddress(chainId: string): string {
        return (
            process.env[`SECURITY_CONTEXT_ADDRESS_${chainId.toUpperCase()}`] ??
            '0x0'
        );
    }

    public static getDefaultArbitrationModuleAddress(chainId: string): string {
        return (
            process.env[
                `DEFAULT_ARBITRATION_MODULE_ADDRESS_${chainId.toUpperCase()}`
            ] ?? '0x0'
        );
    }

    public static getDefaultEscrowAddress(chainId: string): string {
        return (
            process.env[`DEFAULT_ESCROW_ADDRESS_${chainId.toUpperCase()}`] ??
            '0x0'
        );
    }

    public static isValidChainId(
        chainId: string,
        chainType: ChainType = ChainType.EVM
    ): boolean {
        try {
            switch (chainType) {
                case ChainType.EVM:
                    // For EVM chains, check if RPC URL exists in environment
                    const rpcUrl =
                        process.env[
                            `${getPrefix(chainType)}_HTTPS_RPC_URL_${chainId.toUpperCase()}`
                        ] ?? '';
                    return rpcUrl.length > 0;

                case ChainType.BITCOIN:
                    // Bitcoin only supports mainnet and testnet
                    const validBitcoinChains = ['mainnet', 'testnet'];
                    return validBitcoinChains.includes(chainId.toLowerCase());

                case ChainType.SOLANA:
                    // Solana supports mainnet-beta, testnet, and devnet
                    const validSolanaChains = [
                        'mainnet-beta',
                        'testnet',
                        'devnet',
                    ];
                    return validSolanaChains.includes(chainId.toLowerCase());

                default:
                    // Unknown chain type
                    return false;
            }
        } catch (error) {
            return false;
        }
    }

    public static get defaultChainId(): string {
        return process.env.DEFAULT_CHAIN_ID || '11155111';
    }

    public static get homeWalletPrivateKey(): string {
        return process.env.HOME_WALLET_PRIVATE_KEY || '';
    }

    public static get transferInitialGasMultiplier(): number {
        return Config._getNumberSetting('TRANSFER_INITIAL_GAS_MULTIPLIER', 1.2);
    }

    public static get transferGasIncrementPercent(): number {
        return Config._getNumberSetting('TRANSFER_GAS_INCREMENT_PERCENT', 20);
    }

    public static get transferMaxAttempts(): number {
        return Config._getNumberSetting('TRANSFER_MAX_ATTEMPTS', 5);
    }

    public static get logToConsole(): string[] {
        const logToConsole =
            process.env.LOG_TO_CONSOLE || 'debug,info,warn,error';
        return logToConsole
            .split(',')
            .map((level) => level.trim().toLowerCase());
    }

    public static get logLevel(): string {
        return process.env.LOG_LEVEL ?? 'info';
    }

    public static get logToDatabase(): string[] {
        const logToDatabase = process.env.LOG_TO_DATABASE || 'warn,error';
        return logToDatabase
            .split(',')
            .map((level) => level.trim().toLowerCase());
    }

    public static get logToFile(): string[] {
        const logToFile = process.env.LOG_TO_FILE || 'info,warn,error';
        return logToFile.split(',').map((level) => level.trim().toLowerCase());
    }

    public static get runningUnitTests(): boolean {
        return process.env.RUNNING_UNIT_TESTS === 'true';
    }

    public static get etherscanApiKey(): string {
        return process.env.ETHERSCAN_API_KEY || '';
    }

    private static _getArraySetting(key: string): string[] {
        return [];
    }

    private static _getNumberSetting(key: string, defaultVal: number): number {
        try {
            return parseInt(process.env[key] ?? defaultVal.toString());
        } catch (e) {
            return defaultVal;
        }
    }

    private static _getBooleanSetting(key: string): boolean {
        try {
            return (
                process.env[key]?.trim()?.toLowerCase() === 'true' ||
                process.env[key]?.trim()?.toLowerCase() === '1'
            );
        } catch (e) {
            return false;
        }
    }
}

export * from './currency.config';
