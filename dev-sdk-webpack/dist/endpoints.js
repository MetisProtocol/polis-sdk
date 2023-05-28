"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Endpoints {
    constructor(host = "https://polis.metis.io/") {
        this.wsServer = 'wss://polis.metis.io/wss/mts-l2';
        this.confirmUrl = '#/oauth2/confirm';
        this.apiHost = 'https://polis.metis.io/';
        this.oauthRedirectUrl = '#/oauth2-login?';
        if (!host.endsWith('/')) {
            host = host + '/';
        }
        this.apiHost = host;
    }
    getWsServer() {
        return this.apiHost.replace("https", "wss").replace("http", "wss") + this.wsServer;
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
exports.default = Endpoints;
