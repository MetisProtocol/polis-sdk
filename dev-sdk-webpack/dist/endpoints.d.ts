declare class Endpoints {
    wsServer: string;
    confirmUrl: string;
    apiHost: string;
    authHost: string;
    oauthRedirectUrl: string;
    constructor(host?: string);
    getWsServer(): string;
    getConfirmUrl(): string;
    getBridgeUrl(): string;
    getApiHost(): string;
    getOauthRedirectUrl(): string;
}
export default Endpoints;
