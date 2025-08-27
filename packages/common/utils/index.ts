export * from './currency';
export * from './encryption-utils';
export * from './is-network-error';
export * from './retry';
export * from './rpc-helper';
export * from './validation';

export async function pause(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

/**
 * Returns true only if the given string is non-null and consists only of digits after trimming.
 * Does not return true if the string contains a decimal point.
 * @param s
 * @returns
 */
export function stringIsNumeric(s: string): boolean {
    return s ? /^[0-9]+$/.test(s.trim()) : false;
}
