import { Injectable } from '@nestjs/common';
import { ServiceBase } from 'common/classes';
import { ServiceMethodOutput } from 'common/models';
import { Config } from 'common/config';
import { ethers, JsonRpcProvider, keccak256 } from 'ethers';
import { RelayNode } from 'src/classes/relay-node';
import { PolyEscrow } from 'src/classes/poly-escrow';

@Injectable()
export class RelayService extends ServiceBase {
    constructor() {
        super('RelayService');
    }

    public async deployRelayNode(
        chainId: string,
        escrowAddress: string,
        escrowId: string
    ): Promise<ServiceMethodOutput<string>> {
        try {
            //validate input
            if (!chainId?.length) chainId = Config.defaultChainId;

            //validate escrow address
            const escrowAddressOutput = this.validateEthAddress<string>(
                escrowAddress,
                'Escrow address'
            );
            if (escrowAddressOutput) return escrowAddressOutput;

            //validate escrow id
            const escrowIdOutput = this.validateEscrowId<string>(escrowId);
            if (escrowIdOutput) return escrowIdOutput;

            //this is the actual id on the chain
            const onChainId = ethers.keccak256(ethers.toUtf8Bytes(escrowId));

            //get provider to use
            const provider = new ethers.JsonRpcProvider(
                Config.getHttpsRpcUrl(chainId)
            );

            //get the escrow on the chain - make sure it exists
            const polyEscrow = new PolyEscrow(chainId, escrowAddress);
            const escrow = await polyEscrow.getEscrow(escrowId);

            //make sure it exists
            //TODO: (LOW) replace with hasEscrow on next deployment
            if (escrow.id != onChainId) {
                return {
                    message: 'The escrow does not exist on chain',
                    code: 404,
                };
            }

            //create wallet
            const wallet = new ethers.Wallet(
                Config.homeWalletPrivateKey,
                new ethers.JsonRpcProvider(Config.getHttpsRpcUrl(chainId))
            );

            //TODO: change this to deploy by calling polyEscrow.deployRelayNode instead
            const relayAddress = await polyEscrow.deployRelayNode(escrowId);

            /*
            const abi = relayNode.abi;
            const bytecode = relayNode.bytecode;

            const factory = new ethers.ContractFactory(abi, bytecode, wallet);

            //Define constructor arguments
            const securityContext = Config.getSecurityContextAddress(chainId);

            console.log('Deploying RelayNode...');
            const contract = await factory.deploy(
                securityContext,
                escrowAddress,
                keccak256(ethers.toUtf8Bytes(escrowId))
            );

            console.log(
                `Transaction hash: ${contract.deploymentTransaction()?.hash}`
            );

            await contract.waitForDeployment();
            console.log(`Contract deployed to: ${contract.target}`);
            */

            return {
                data: relayAddress,
            };
        } catch (e: any) {
            return {
                message: e.message,
                code: 500,
            };
        }
    }

    public async pumpRelayNode(
        chainId: string,
        relayNodeAddress: string
    ): Promise<ServiceMethodOutput<boolean>> {
        try {
            if (!chainId?.length) chainId = Config.defaultChainId;

            //validate relay node address
            const relayNodeOutput = this.validateEthAddress<boolean>(
                relayNodeAddress,
                'Escrow address'
            );
            if (relayNodeOutput) return relayNodeOutput;

            //create wallet
            const wallet = new ethers.Wallet(
                Config.homeWalletPrivateKey,
                new ethers.JsonRpcProvider(Config.getHttpsRpcUrl(chainId))
            );

            //create relay node instance
            const relayNode: RelayNode = new RelayNode(
                chainId,
                relayNodeAddress,
                wallet
            );

            //pump it
            await relayNode.relay();

            return {
                data: true,
            };
        } catch (e: any) {
            return {
                message: e.message,
                code: 500,
            };
        }
    }

    public async getRelayNodeBalance(
        chainId: string,
        currencyAddress: string,
        relayNodeAddress: string
    ): Promise<ServiceMethodOutput<string>> {
        try {
            //validate input
            chainId = chainId ?? Config.defaultChainId;
            if (!currencyAddress?.length) {
                currencyAddress = ethers.ZeroAddress;
            }
            const currencyOutput = this.validateEthAddress<string>(
                currencyAddress,
                'Currency address'
            );
            if (currencyOutput) return currencyOutput;
            const relayNodeOutput = this.validateEthAddress<string>(
                relayNodeAddress,
                'Escrow address'
            );
            if (relayNodeOutput) return relayNodeOutput;

            //get a provider
            const provider = new JsonRpcProvider(
                Config.getHttpsRpcUrl(chainId)
            );

            let balance: string = '';
            if (currencyAddress === ethers.ZeroAddress) {
                //balance for native currency (e.g., ETH)
                balance = (
                    await provider.getBalance(relayNodeAddress)
                )?.toString();
            } else {
                //balance for ERC20 token
                const token = new ethers.Contract(
                    currencyAddress,
                    [
                        'function balanceOf(address owner) view returns (uint256)',
                    ],
                    provider
                );
                balance = (await token.balanceOf(relayNodeAddress))?.toString();
            }

            return {
                data: balance ?? '',
            };
        } catch (e: any) {
            return {
                message: e.message,
                code: 500,
            };
        }
    }
}
