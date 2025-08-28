import { Config } from 'common/config';
import { ethers } from 'ethers';

export class ContractBase {
    protected readonly contract: ethers.Contract;

    constructor(
        chainId: string,
        address: string,
        abi: any,
        wallet?: ethers.Wallet
    ) {
        this.contract = new ethers.Contract(
            address,
            abi,
            wallet
                ? wallet
                : new ethers.JsonRpcProvider(Config.getHttpsRpcUrl(chainId))
        );
    }
}
