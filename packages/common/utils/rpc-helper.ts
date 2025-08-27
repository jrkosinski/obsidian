import { ILogger } from '../logging';
import { ITransactionOutput } from '../models';
import { retry } from './retry';

/**
 * Executes any asynchronous call with a timeout; throws an error on timeout.
 * @param promise An asynchronous call
 * @param timeoutMs Number of milliseconds to wait (timeout)
 * @returns
 */
export async function callWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
): Promise<T> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(
            () => reject(new Error('Timeout')),
            timeoutMs
        );
        promise
            .then((res) => {
                clearTimeout(timeout);
                resolve(res);
            })
            .catch((err) => {
                clearTimeout(timeout);
                reject(err);
            });
    });
}

/**
 * Safely calls a write method on a smart contract instance, with a timeout and a designated number of retries.
 * @param contract An ethers.Contract instance
 * @param methodName The name of the method to call on the smart contract instance
 * @param args Optional arguments to the contract method
 * @param overrides Here is where you put extra args such as { value: ethers.parseEth('1')} for example, gas limit, etc.
 * @param timeoutMs Number of milliseconds before timeout (default 15000)
 * @param retries Number of retries (default 2)
 * @param logger Optional logger will log events
 * @returns Information about the transaction initiated, including tx hash and receipt.
 */
export async function safeWriteCall(
    contract: any,
    methodName: string,
    args: any[] = [],
    overrides: any = {},
    timeoutMs = 15_000,
    retries = 2,
    logger?: ILogger
): Promise<ITransactionOutput> {
    return retry(
        async () => {
            try {
                const method = contract[methodName];
                if (typeof method !== 'function') {
                    throw new Error(
                        `Method ${methodName} does not exist on contract`
                    );
                }

                const txPromise = method(...args, overrides);
                const tx: any = await callWithTimeout(txPromise, timeoutMs);

                logger?.info(`Transaction sent: ${tx.hash}`);

                const receipt: any = await callWithTimeout(
                    tx.wait(),
                    timeoutMs
                );
                logger?.info(`Transaction confirmed: ${tx.hash}`);

                return {
                    transaction_id: tx.hash,
                    tx,
                    receipt,
                };
            } catch (err) {
                logger?.warn(`Payable contract call failed: ${err.message}`);
                throw err;
            }
        },
        {
            retries,
            onFailedAttempt: (err: any) => {
                logger?.warn(
                    `Attempt ${err.attemptNumber} failed. ${err.retriesLeft} retries left.`
                );
            },
        }
    );
}

/**
 * Safely calls a read-only method on a smart contract instance, with a timeout and a designated number of retries.
 * @param contract An ethers.Contract instance
 * @param methodName The name of the method to call on the smart contract instance
 * @param args Optional arguments to the contract method
 * @param timeoutMs Number of milliseconds before timeout (default 15000)
 * @param retries Number of retries (default 2)
 * @param logger Optional logger will log events
 * @returns The return value of the read-only method called.
 */
export async function safeCall(
    contract: any,
    methodName: string,
    args: any[] = [],
    timeoutMs = 15_000,
    retries = 2,
    logger?: ILogger
): Promise<any> {
    return retry(
        async () => {
            try {
                const method = contract[methodName];
                if (typeof method !== 'function') {
                    throw new Error(
                        `Method ${methodName} does not exist on contract`
                    );
                }

                const callPromise = method(...args);
                return await callWithTimeout(callPromise, timeoutMs);
            } catch (err) {
                logger?.warn(`Contract call failed: ${err.message}`);
                throw err; // pRetry will retry this
            }
        },
        {
            retries,
            onFailedAttempt: (err: any) => {
                logger?.warn(
                    `Attempt ${err.attemptNumber} failed. ${err.retriesLeft} retries left.`
                );
            },
        }
    );
}
