import WalletConnectProvider from "@walletconnect/web3-provider";
import WalletConnect from "@walletconnect/client";
declare function getWalletConnector(): WalletConnect;
declare function getWalletConnectProvider(): Promise<WalletConnectProvider>;
declare function signMessage(connector: WalletConnect, msg: string): Promise<any>;
export declare function sendTrans(connector: WalletConnect, tx: {
    to: any;
    from: any;
    value: any;
    chainId: number;
    gas: number;
    gasPrice: number;
    data: string;
    nonce: number;
}): Promise<any>;
declare const _default: {
    getWalletConnector: typeof getWalletConnector;
    getWalletConnectProvider: typeof getWalletConnectProvider;
    signMessage: typeof signMessage;
    sendTrans: typeof sendTrans;
};
export default _default;
