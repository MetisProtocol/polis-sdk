import dotenv from 'dotenv';

class Endpoints {
    wsServer: string = 'wss://polis.metis.io/wss/mts-l2';
    // confirmUrl: string =  '#/oauth2/confirm-tx';
    confirmUrl: string =  '#/oauth2/confirm';
    apiHost = 'https://api.nuvosphere.io/';
    authHost = this.apiHost.replace("//api.","//auth.")
    oauthRedirectUrl: string = '#/oauth2-login?';
    // testWsServer: string = 'ws://test-polis.metis.io:5000/wss/mts-l2';
    // testConfirmUrl: string = 'https://test-polis.metis.io/#/oauth2/confirm-tx';
    // testApiHost = 'https://test-polis.metis.io';
    // testOauthRedirectUrl: string = 'https://test-polis.metis.io/#/oauth2-login?';

    constructor(host:string="https://api.nuvosphere.io/") {
        if (!host.endsWith('/')) {
            host = host + '/'
        }
        this.apiHost =host;
    }

    getWsServer() {

        return this.apiHost.replace("https","wss").replace("http","wss") + this.wsServer;
    }

    getConfirmUrl() {

        return this.authHost + this.confirmUrl;
    }

    getBridgeUrl() {

        return this.authHost + "#/oauth2/bridge";
    }

    getApiHost() {
        return this.apiHost;
    }

    getOauthRedirectUrl() {

        return this.authHost + this.oauthRedirectUrl;
    }
}

export default  Endpoints;
