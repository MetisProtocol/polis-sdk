export declare function getCurChainId(): Promise<any>;
export declare function changeChain(chainid: number, chain: any): Promise<any>;
export declare function addMetamaskEventCallback(eventName: string, callback: any): void;
export declare function getMetaAccounts(): Promise<string>;
export declare function sendMetaMaskContractTx(trans: any, chain: any): Promise<{
    chainid: any;
    domain: any;
    from: any;
    to: any;
    function: any;
    args: any;
    txType: string;
    trans: {
        gasLimit: any;
        gasPrice: any;
        txhash: any;
        nonce: any;
    };
} | {
    success: boolean;
    code: import("./erros").PolisSdkError;
    data: string;
}>;
declare function sendMetaMaskTrans(tx: {
    to: any;
    from: any;
    value: any;
    chainId: number;
    gas: number;
    gasPrice: number;
    data: string;
    nonce: number;
}, chain: any): Promise<any>;
export declare function isConnectedMeta(): Promise<boolean>;
export declare function getMetaMaskAddress(): string;
export declare function setEnv(_env: string): void;
export declare function addToken(token: any, tokenAddress: string, tokenDecimals: number, tokenImage: string, chainObj?: any): Promise<any>;
export declare function checkMetaMaskInstall(): boolean;
export declare function signMessage(msg: string): Promise<any>;
declare const _default: {
    getMetaMaskAddress: typeof getMetaMaskAddress;
    isConnectedMeta: typeof isConnectedMeta;
    getMetaAccounts: typeof getMetaAccounts;
    getCurChainId: typeof getCurChainId;
    sendMetaMaskContractTx: typeof sendMetaMaskContractTx;
    sendMetaMaskTrans: typeof sendMetaMaskTrans;
    changeChain: typeof changeChain;
    setEnv: typeof setEnv;
    addToken: typeof addToken;
    checkMetaMaskInstall: typeof checkMetaMaskInstall;
    signMessage: typeof signMessage;
    addMetamaskEventCallback: typeof addMetamaskEventCallback;
};
export default _default;
