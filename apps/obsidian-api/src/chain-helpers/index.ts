import { ChainType } from 'common/models';
import {
    EvmChainHelper,
    BitcoinChainHelper,
    IChainHelper,
} from 'common/chain-helpers';
import { LoggerFactory } from '../classes/logging/factory';

export const ChainHelpers: { [key: string]: IChainHelper } = {
    [ChainType.EVM.toString()]: new EvmChainHelper(
        LoggerFactory.createLogger('EvmChainHelper')
    ),
    [ChainType.BITCOIN.toString()]: new BitcoinChainHelper(
        LoggerFactory.createLogger('BitcoinChainHelper')
    ),
    //[ChainType.SOLANA.toString()]: new SolanaChainHelper(
    //     LoggerFactory.createLogger('SolanaChainHelper')
    //),
};
