import dotenv from 'dotenv';

class Endpoints {
    wsServer: string = 'wss://polis.metis.io/wss/mts-l2';
    confirmUrl: string =  'https://polis.metis.io/#/oauth2/confirm-tx';
    apiHost = 'https://polis.metis.io';
    oauthRedirectUrl: string = 'https://polis.metis.io/#/oauth2-login?';
    // testWsServer: string = 'ws://test-polis.metis.io:5000/wss/mts-l2';
    // testConfirmUrl: string = 'https://test-polis.metis.io/#/oauth2/confirm-tx';
    // testApiHost = 'https://test-polis.metis.io';
    // testOauthRedirectUrl: string = 'https://test-polis.metis.io/#/oauth2-login?';
    testWsServer: string = 'ws://localhost:5000/wss/mts-l2';
    testConfirmUrl: string = 'http://localhost:1024/#/oauth2/confirm-tx';
    testApiHost = 'http://localhost:1024';
    testOauthRedirectUrl: string = 'http://localhost:1024/#/oauth2-login?';
    env = 'prod';
    testEnv = 'test';

    constructor(_env:string = 'prod') {
        this.env = _env;
    }

    getWsServer() {
        if (this.env === this.testEnv) {
            return this.testWsServer;
        }
        return this.wsServer;
    }

    getConfirmUrl() {
        if (this.env === this.testEnv) {
            return this.testConfirmUrl;
        }
        return this.confirmUrl;
    }

    getApiHost() {
        console.log('API_HOST_ENV', process.env.API_HOST);
        if (this.env === this.testEnv) {
            return this.testApiHost;
        }
        return this.apiHost;
    }

    getOauthRedirectUrl() {
        if (this.env === this.testEnv) {
            return this.testOauthRedirectUrl;
        }
        return this.oauthRedirectUrl;
    }
}

export default  Endpoints;
