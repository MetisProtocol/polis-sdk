export declare function getCurChainId(): Promise<any>;
export declare function changeChain(chainid: number, chain: any): Promise<boolean>;
export declare function getMetaAccounts(): Promise<string>;
export declare function sendMetaMaskContractTx(trans: any, chain: any, disableTooltip?: boolean): Promise<{
    success: boolean;
    data: {
        chainid: any;
        domain: any;
        from: any;
        to: any;
        function: any;
        args: any;
        trans: {
            gasLimit: any;
            gasPrice: any;
            txhash: any;
            nonce: any;
        };
    };
    code?: undefined;
} | {
    success: boolean;
    code: any;
    data: any;
} | {
    success: boolean;
    data: string;
    code?: undefined;
}>;
export declare function isConnectedMeta(): Promise<boolean>;
export declare function getMetaMaskAddress(): string;
export declare function setEnv(_env: string): void;
export declare function addToken(token: any, tokenAddress: string, tokenDecimals: number, tokenImage: string, chainObj?: any): Promise<any>;
declare const _default: {
    getMetaMaskAddress: typeof getMetaMaskAddress;
    isConnectedMeta: typeof isConnectedMeta;
    getMetaAccounts: typeof getMetaAccounts;
    getCurChainId: typeof getCurChainId;
    sendMetaMaskContractTx: typeof sendMetaMaskContractTx;
    changeChain: typeof changeChain;
    setEnv: typeof setEnv;
    addToken: typeof addToken;
};
export default _default;
