import dotenv from 'dotenv';

class Endpoints {
    wsServer: string = 'wss://polis.metis.io/wss/mts-l2';
    // confirmUrl: string =  '#/oauth2/confirm-tx';
    confirmUrl: string =  '#/oauth2/confirm';
    apiHost = 'https://polis.metis.io/';
    oauthRedirectUrl: string = '#/oauth2-login?';
    // testWsServer: string = 'ws://test-polis.metis.io:5000/wss/mts-l2';
    // testConfirmUrl: string = 'https://test-polis.metis.io/#/oauth2/confirm-tx';
    // testApiHost = 'https://test-polis.metis.io';
    // testOauthRedirectUrl: string = 'https://test-polis.metis.io/#/oauth2-login?';

    constructor(host:string="https://polis.metis.io/") {
        if (!host.endsWith('/')) {
            host = host + '/'
        }
        this.apiHost =host;
    }

    getWsServer() {

        return this.apiHost.replace("https","wss").replace("http","wss") + this.wsServer;
    }

    getConfirmUrl() {

        return this.apiHost + this.confirmUrl;
    }

    getBridgeUrl() {

        return this.apiHost + "#/oauth2/bridge";
    }

    getApiHost() {
        return this.apiHost;
    }

    getOauthRedirectUrl() {
        return this.apiHost + this.oauthRedirectUrl;
    }
}

export default  Endpoints;
