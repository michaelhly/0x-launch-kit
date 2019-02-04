export enum OrderSide {
    Buy,
    Sell,
}

export enum OrderBookSide {
    Asks,
    Bids,
}

export interface TokenAssetBundle {
    VETH: string;
    LONG: string;
    SHORT: string;
}
