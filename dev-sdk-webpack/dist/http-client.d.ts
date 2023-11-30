import { IHttpClient } from './interfaces';
import { Oauth2Client } from './oauth2-client';
import endpoints from './endpoints';
import Swal from 'sweetalert2';
export declare class HttpClient implements IHttpClient {
    appId: string;
    accessToken: string;
    refreshToken: string;
    endpoints: endpoints;
    apiHost: string;
    confirmUrl: string;
    bridgeUrl: string;
    oAuth2Client: Oauth2Client;
    swalPromise: any;
    env: string;
    txStatus: string;
    loadingDialog: typeof Swal;
    bridgeMetaMask: boolean;
    constructor(appId: string, accessToken: string, refreshToken: string, expiresIn: number, apiHost?: string, bridgeMetaMask?: boolean);
    handleRefreshToken(callback?: Function): void;
    getBalance(chainId: number, address?: string): Promise<any>;
    getLogsAsync(data: any): Promise<any>;
    getTxLogsAsync(data: any): Promise<any>;
    post(method: string, data: any, disableTooltip?: boolean, httpMethod?: string, returnObj?: boolean): Promise<any>;
    handleRefreshTokenAsync(): Promise<any>;
    sendTx(domain: string, chainId: number, fun: string, args?: any[], succCallback?: Function, errCallback?: Function, extendParams?: any, disableTooltip?: boolean): any;
    estimateGasAsync(domain: string, chainId: number, fun: string, args?: any[], disableTooltip?: boolean, extendParams?: any): Promise<any>;
    sendTxAsync(domain: string, chainId: number, func: string, args?: any[], disableTooltip?: boolean, extendParams?: any): Promise<any>;
    private polisBridgePage;
    beforeConfirm(data: any): Promise<any>;
    queryTx(chainId: number, tx: string, succCallback?: Function, errCallback?: Function, extendParams?: any, disableTooltip?: boolean): void;
    queryTxAsync(chainId: number, tx: string, disableTooltip?: boolean): Promise<any>;
    closeConfirmDialog(): void;
    getChainUrl(chainId: string): Promise<any>;
    addTokenToMM(token: any, tokenAddress?: string, tokenDecimals?: number, tokenImage?: string, chainId?: number): Promise<any>;
    getDomain(name: string, chainId: string): Promise<any>;
    createDomain(param: any, disableTooltip?: boolean): Promise<any>;
    saveDomainChains(param: any, disableTooltip?: boolean): Promise<any>;
    delDomain(domain: string, disableTooltip?: boolean): Promise<any>;
    providerCall(param: any): Promise<any>;
    createDapp(param: any, disableTooltip?: boolean): Promise<any>;
    modifyDapp(param: any, disableTooltip?: boolean): Promise<any>;
    deleteDapps(param: any, disableTooltip?: boolean): Promise<any>;
    getDappList(pageSize: number, pageIndex: number): Promise<any>;
    getDapp(dappId: string): Promise<any>;
    applyToDeveloper(): Promise<any>;
    showLoading(): void;
    closeLoading(): void;
}
