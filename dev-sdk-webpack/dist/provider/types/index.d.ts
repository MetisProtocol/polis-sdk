import SafeEventEmitter from "@metamask/safe-event-emitter";
import { JsonRpcRequest, PendingJsonRpcResponse } from "json-rpc-engine";
import EventManager from "../utils/events";
import { PolisSdkError } from "../erros";
export interface IPolisEndPoints {
    wsServer?: string;
    apiHost: string;
    oauthHost?: string;
}
export declare type TOpenLink = (link: string, postData: object, wallet_type: string) => void;
export interface IPolisClientOpts {
    appId: string;
    chainId: number;
    apiHost?: string;
    oauthHost?: string;
    showLoading?: boolean;
    debug?: boolean;
    useNuvoProvider?: boolean;
    openLink?: TOpenLink;
}
export interface IPolisOauth2Opts {
    appId: string;
    returnUrl: string;
    switchAccount: boolean;
}
export interface IOauth2Info {
    appId: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    expriesAt?: number;
    session?: string;
}
export interface IPolisProviderOpts extends IPolisEndPoints {
    token?: string;
    chainId: number;
    maxAttempts?: number;
    headers?: object;
    debug?: boolean;
    openLink?: TOpenLink;
}
export interface IPolisInternalProviderOpts extends IPolisEndPoints {
    event: EventManager;
}
export interface IEventEmitter {
    event: string;
    callback: (error: PolisSdkError | null, data: any | null) => void;
}
export interface IInternalEvent {
    event: string;
    params: any;
}
export interface TransactionInfo {
    chainId: string;
    symbol: string;
    walletType: string;
    from: string;
    to: string;
    value: string;
    gas?: string;
    gasLimit: string;
    gasPrice: string;
    data: string;
    act: string;
    fee?: string;
    feeTxt?: string;
    chainUrl?: string;
    nonce?: number;
    txType?: string;
    sdkVer?: number;
    isMetamask?: boolean;
    isThirdwallet?: boolean;
}
export interface BridgeTransactionInfo extends TransactionInfo {
    accessToken: string;
    blsWalletOpen?: boolean;
}
export interface DomainTransactionInfo extends TransactionInfo {
    domain?: string;
    function?: string;
    funcAbi?: string;
    contractAddress: string;
    args: [];
    blsWalletOpen?: boolean;
}
export interface BridgeDomainTransactionInfo extends DomainTransactionInfo {
    accessToken: string;
    txType: string;
}
export declare type SendAsyncCallBack = (err: PolisSdkError, providerRes: PendingJsonRpcResponse<any>) => void;
export declare type SendCallBack = (err: any, providerRes: any) => void;
export interface SafeEventEmitterProvider extends SafeEventEmitter {
    sendAsync: (req: JsonRpcRequest<string[]>, callback: SendAsyncCallBack) => void;
    send: (req: JsonRpcRequest<string[]>, callback: SendCallBack) => void;
}
