import { DecodedError, ErrorDecoder } from 'ethers-decode-error';

export abstract class DecodesErrors {
    protected readonly errorDecoder: ErrorDecoder = ErrorDecoder.create();

    protected async wrapCallInDecodedErrorHandler<T>(
        title: string,
        action: () => T
    ): Promise<T> {
        try {
            return await action();
        } catch (e: any) {
            const decodedError: DecodedError =
                await this.errorDecoder.decode(e);
            throw new Error(
                `{'error': 'Ethers error in ${title}', 'reason': '${decodedError.reason}', 'errorType': '${decodedError.type}'`
            );
        }
    }

    protected parseErrorName(name: string): string {
        if (name?.length) {
            const lines = name.split('\n');
            return lines[0];
        }
        return '';
    }
}
