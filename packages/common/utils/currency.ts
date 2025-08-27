import { getCurrencyAddress, getCurrencyPrecision } from '../config';
import { isValidCurrencyAddress } from './validation';
import { BigNumberish, ethers } from 'ethers';

export function convertCurrencyAmount(
    currency: string,
    amount: BigNumberish,
    fromChainId: number,
    toChainId: number
): BigInt {
    const precisionFrom = getCurrencyPrecision(currency, fromChainId);
    const precisionTo = getCurrencyPrecision(currency, toChainId);

    //account for cases in which the same token has a different precision on another chain
    if (precisionFrom != precisionTo) {
        const difference = precisionFrom - precisionTo;
        if (difference < 0) {
            //multiply by factor
            amount =
                BigInt(amount.toString()) *
                BigInt(Math.pow(10, difference * -1));
        } else if (difference > 0) {
            //remove difference zeros
            const asString = amount.toString();
            if (asString.length > difference) {
                amount = BigInt(
                    asString.substring(0, asString.length - difference)
                );
            } else {
                amount = BigInt(0);
            }
        }
    }

    return ethers.toBigInt(amount);
}

export function translateCurrencyAddress(
    currency: string,
    chainId: string | number
): string {
    if (isValidCurrencyAddress(currency)) return currency;

    return getCurrencyAddress(currency, chainId);
}
