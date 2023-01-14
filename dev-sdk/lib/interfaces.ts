/**
 * <p>
 * define interfaces of sdk,
 * 
 * 1. constructor with accessToken <br/>
 * 2. connect
 * 3. emit('block_chain_' + accessToken) [private]
 * </p>
 *
 * @author Jeff Xiao
 * @since 2021-05-27
 */
export interface IWebsocketClient {

    accessToken: string;

    oAuth2Client: IOauth2Client;

    /**
     * connect to websocket
     */
    connect: (onEmitChain:Function, onMessage?:Function, onJson?:Function, onConnect?:Function, onDisconnect?:Function) => Boolean;

    /**
     * send a TX
     */
    sendTx: (domain: string, chainid: number, fun: string, args?: any[]) => void;

    /**
     * confirm a TX
     */
    // confirmTx: (domain: string, chainid: number, fun: string, args?:any[]) => void;

    queryTx: (chainid: number, tx: string) => void;


    /**
     * disconnect from exist websocket
     */
    disconnect: ()=>void;

    closeConfirmDialog: () => void;
}

export interface IOauth2Client {
    oauth2User?: IOauth2User;

    startOauth2: (appId: string, returnUrl: string) => Window | null;

    setUser: (oauth2User: IOauth2User) => void;

    refreshToken: (appId: string, refreshToken: string, callback?: Function) => void;

    refreshTokenAsync: (appId: string, refreshToken: string) => Promise<any>;

    getUserInfoAsync: (accessToken?: string) => Promise<any>;

}

export interface IHttpClient {

    sendTx: (domain: string, chainid: number, func: string, args?:any[], succCallback?: Function, errCallback?: Function, extendParams?:any, disableTooltip?: boolean) => any;

    // confirmTx: (domain: string, chainid: number, func: string, args?:any[]) => any;

    queryTx: (chainid: number, tx: string, succCallback?: Function, errCallback?: Function) => any;
    sendTxAsync: (domain: string, chainid: number, func: string, args?:any[], disableTooltip?: boolean, extendParams?: any) => Promise<any>;
    queryTxAsync: (chainid: number, tx: string, disableTooltip?: boolean) => Promise<any>;
    saveDomainChains: (param:any, disableTooltip?:boolean) => Promise<any>;
    createDomain:(param:any, disableTooltip?:boolean) => Promise<any>;
    delDomain:(domain:string, disableTooltip?:boolean) => Promise<any>;
    closeConfirmDialog: () => void;
}

export interface IOauth2User {
    accessToken: string;
    appId?: string;
    appName?: string;
    refreshToken?: string;
    expiresIn?: number;
    username?: string;
    expriesAt?: number;
}


export interface IUserProfile {
    name?: string;
    email?: string;
}


export interface IMiddlewareClient {
    getProfile: (accessToken: string) => IUserProfile;
}
