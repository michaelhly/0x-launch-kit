import { BigNumber, ContractWrappers, Provider, SignedOrder } from '0x.js';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { FEE_RECIPIENT, FEE_RECIPIENT_PRIVATE_KEY, INFURA_API_KEY, NETWORK_ID, RPC_URL } from './config';

// tslint:disable no-var-requires
const HDWalletProvider = require('truffle-hdwallet-provider');
const provider = new HDWalletProvider(FEE_RECIPIENT_PRIVATE_KEY, `${RPC_URL}/${INFURA_API_KEY}`);

const Web3 = require('web3');
const web3 = new Web3(provider);
const currentProvider: Provider = web3.currentProvider;

const get_contractWrappers = (): ContractWrappers => {
    return new ContractWrappers(currentProvider, { networkId: NETWORK_ID });
};

const get_web3Wrapper = (contractWrapper: ContractWrappers): Web3Wrapper => {
    const web3Wrapper = new Web3Wrapper(currentProvider);
    web3Wrapper.abiDecoder.addABI(contractWrapper.exchange.abi);
    web3Wrapper.abiDecoder.addABI(contractWrapper.erc20Token.abi);
    return web3Wrapper;
};

export const batch_fill_or_kill = async (
    signedOrders: SignedOrder[],
    fillAmounts: BigNumber[],
): Promise<TransactionReceiptWithDecodedLogs | null> => {
    const contractWrappers: ContractWrappers = get_contractWrappers();
    let txHash: string | null = null;

    try {
        txHash = await contractWrappers.exchange.batchFillOrKillOrdersAsync(signedOrders, fillAmounts, FEE_RECIPIENT);
    } catch (err) {
        // tslint:disable no-console
        console.log(err);
    }

    if (txHash) {
        const web3Wrapper: Web3Wrapper = get_web3Wrapper(contractWrappers);
        const txReciept = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        return txReciept;
    }

    return null;
};
