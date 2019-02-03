import { assetDataUtils, BigNumber, generatePseudoRandomSalt, SignedOrder } from '0x.js';
import { schemas } from '@0x/json-schemas';
import { Web3Wrapper } from '@0x/web3-wrapper';

import { NULL_ADDRESS, ONE_SECOND_MS, TEN_MINUTES_MS, ZERO, ZRX_DECIMALS } from './constants';
import { orderBook } from './orderbook';
import { utils } from './utils';

// tslint:disable no-var-requires
const tokens = require('../tokens.json');
const { VeilEther, LONG, SHORT } = tokens;
const NUMBER_OF_ORDERS = 10;

const random = (max: number) => Math.floor(Math.random() * (max + 1));

const getRandomFutureDateInSeconds = (): BigNumber => {
    return new BigNumber(Date.now() + TEN_MINUTES_MS).div(ONE_SECOND_MS).ceil();
};

const create_fake_order = (makerAssetAddress: string, takerAssetAddress: string): SignedOrder => {
    // tslint:disable-next-line:custom-no-magic-numbers
    const makerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(random(10).toString()), ZRX_DECIMALS);
    // tslint:disable-next-line:custom-no-magic-numbers
    const takerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(random(10).toString()), ZRX_DECIMALS);
    return {
        exchangeAddress: '0xbce0b5f6eb618c565c3e5f5cd69652bbc279f44e',
        makerAddress: NULL_ADDRESS,
        takerAddress: NULL_ADDRESS,
        senderAddress: NULL_ADDRESS,
        feeRecipientAddress: NULL_ADDRESS,
        expirationTimeSeconds: getRandomFutureDateInSeconds(),
        salt: generatePseudoRandomSalt(),
        makerAssetAmount,
        takerAssetAmount,
        makerAssetData: assetDataUtils.encodeERC20AssetData(makerAssetAddress),
        takerAssetData: assetDataUtils.encodeERC20AssetData(takerAssetAddress),
        makerFee: ZERO,
        takerFee: ZERO,
        signature:
            '0x1cc6e03646be2e659877c564ca8db1cb8a8cd25a8f087d536943db2b59eed6b37b1524c2e2b1853ea54e9b3d8e54c08a27bae46c3672940d51ae06636d18c1ef5f03',
    };
};

const gen_fake_orders = (makerAssetAddress: string, takerAssetAddress: string): SignedOrder[] => {
    return [...(Array(NUMBER_OF_ORDERS) as SignedOrder[])].map(() => {
        return create_fake_order(makerAssetAddress, takerAssetAddress);
    });
};

const submit_orders_async = async (orders: SignedOrder[]) => {
    for (let i = 0; i < orders.length; i++) {
        try {
            utils.validateSchema(orders[i], schemas.signedOrderSchema);
            await orderBook.addOrderAsync(orders[i]);
        } catch (err) {
            // tslint:disable no-console
            console.log(err);
        }
    }
};

export const load_fakeOrders = async () => {
    const LONG_VETH = gen_fake_orders(LONG.address, VeilEther.address);
    const SHORT_VETH = gen_fake_orders(SHORT.address, VeilEther.address);
    const VETH_SHORT = gen_fake_orders(VeilEther.address, SHORT.address);
    const VETH_LONG = gen_fake_orders(VeilEther.address, LONG.address);

    await submit_orders_async(LONG_VETH);
    await submit_orders_async(SHORT_VETH);
    await submit_orders_async(VETH_SHORT);
    await submit_orders_async(VETH_LONG);
};
