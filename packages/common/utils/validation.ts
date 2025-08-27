import { isAddress } from 'ethers';
import { ChainType } from '../models';
import { Config } from '../config';
import { validate as validateUuid } from 'uuid';

export function isValidEvmAddress(address: string): boolean {
    const normalized = address?.trim() ?? '';
    return isAddress(address);
}

export function isValidCurrencyAddress(address: string): boolean {
    return isZeroAddress(address) || isValidEvmAddress(address);
}

export function isZeroAddress(address: string): boolean {
    const normalized = address?.trim().toLowerCase() ?? '';
    return (
        normalized === '' ||
        normalized === '0' ||
        normalized === '0x' ||
        /^0x0*$/.test(normalized) // 0x followed by any number of 0s
    );
}

export function isNativeCurrency(address: string): boolean {
    const normalized = address?.trim().toLowerCase() ?? '';
    return (
        normalized === 'eth' ||
        normalized === 'matic' ||
        normalized === 'bnb' ||
        normalized === 'avax' ||
        !normalized?.length ||
        normalized === 'native' ||
        isZeroAddress(normalized)
    );
}

export function isValidChainId(chainType: ChainType, chainId: string): boolean {
    return Config.isValidChainId(chainId, chainType);
}

export function isNumeric(value: string | number | BigInt): boolean {
    if (typeof value === 'number') {
        return !isNaN(value);
    }
    const s = value.toString();

    for (let i = 0; i < s.length; i++) {
        if (isNaN(Number(s[i]))) {
            return false;
        }
    }

    return true;
}

export function isValidUuid(value: string): boolean {
    //const uuidRegex =
    //    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    //return uuidRegex.test(value);
    return validateUuid(value);
}
