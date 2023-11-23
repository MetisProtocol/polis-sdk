"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Endpoints {
    constructor(host = "https://api.nuvosphere.io/") {
        this.wsServer = 'wss://polis.metis.io/wss/mts-l2';
        this.confirmUrl = '#/oauth2/confirm';
        this.apiHost = 'https://api.nuvosphere.io/';
        this.authHost = this.apiHost.replace("//api.", "//auth.");
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
exports.default = Endpoints;
