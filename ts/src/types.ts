export enum OrderSide {
    Buy,
    Sell,
}

export enum OrderbookSide {
    Asks,
    Bids,
}

export interface TokenAddressBundle {
    VETH: string;
    LONG: string;
    SHORT: string;
}
