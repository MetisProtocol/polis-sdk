"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketClient = void 0;
const endpoints_1 = __importDefault(require("./endpoints"));
const socket_io_client_1 = require("socket.io-client");
const sweetalert2_1 = __importDefault(require("sweetalert2"));
const oauth2_client_1 = require("./oauth2-client");
class WebSocketClient {
    constructor(appId, accessToken, refreshToken, expiresIn, server, env = '') {
        this.endpoints = new endpoints_1.default();
        this.server = '';
        this.confirmUrl = this.endpoints.getConfirmUrl();
        this.confirmArray = [];
        this.swalPromise = null;
        this.endpoints = new endpoints_1.default(env);
        this.server = this.endpoints.getWsServer();
        this.confirmUrl = this.endpoints.getConfirmUrl();
        this.appId = appId;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.oAuth2Client = new oauth2_client_1.Oauth2Client();
        let oauthUser = {
            appId: appId,
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiresIn: expiresIn,
            expriesAt: new Date().getTime() + (expiresIn - 5) * 1000
        };
        this.oAuth2Client.setUser(oauthUser);
        if (server) {
            this.server = server.indexOf('/wss/mts-l2') > 0 ? server : (server + '/wss/mts-l2');
        }
    }
    log(...obj) {
        console.log(obj);
    }
    handleRefreshToken(callback) {
        var _a, _b;
        if (new Date().getTime() < ((_a = this.oAuth2Client.oauth2User) === null || _a === void 0 ? void 0 : _a.expriesAt)) {
            if (callback) {
                callback.apply(this);
            }
            return;
        }
        this.oAuth2Client.refreshToken(this.appId, (_b = this.oAuth2Client.oauth2User) === null || _b === void 0 ? void 0 : _b.refreshToken, (oauth2User) => {
            this.accessToken = oauth2User.accessToken;
            this.refreshToken = oauth2User.refreshToken || '';
            if (callback) {
                callback.apply(this);
            }
        });
    }
    connect(onEmitChain, onMessage, onJson, onConnect, onDisconnect) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if (!this.server || !this.accessToken) {
            return false;
        }
        this.onEmitChain = onEmitChain;
        this.onMessage = onMessage;
        this.onJson = onJson;
        this.onConnect = onConnect;
        this.onDisconnect = onDisconnect;
        if (this.socket && ((_a = this.socket) === null || _a === void 0 ? void 0 : _a.connected)) {
            if (((_c = (_b = this.socket) === null || _b === void 0 ? void 0 : _b.io.opts.extraHeaders) === null || _c === void 0 ? void 0 : _c.accessToken) === this.accessToken) {
                return true;
            }
        }
        this.socket = (0, socket_io_client_1.io)(this.server, {
            forceNew: true,
            reconnectionAttempts: 3,
            timeout: 2000,
            extraHeaders: {
                "Access-Token": this.accessToken
            }
        });
        this.socket.on("connect", (...args) => {
            if (this.onConnect) {
                this.onConnect(args);
            }
        });
        (_d = this.socket) === null || _d === void 0 ? void 0 : _d.on('connect_failed', () => {
            this.log('socket client connection failed!');
        });
        (_e = this.socket) === null || _e === void 0 ? void 0 : _e.on('runtime_error', (err) => {
            this.log('socket client runtime error!', err.msg);
            const Toast = sweetalert2_1.default.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', sweetalert2_1.default.stopTimer);
                    toast.addEventListener('mouseleave', sweetalert2_1.default.resumeTimer);
                }
            });
            Toast.fire({
                icon: 'error',
                title: err.msg || 'Some errors occured'
            });
        });
        (_f = this.socket) === null || _f === void 0 ? void 0 : _f.on('disconnect', (reason) => {
            if (this.onDisconnect) {
                this.onDisconnect(reason);
            }
        });
        (_g = this.socket) === null || _g === void 0 ? void 0 : _g.on('message', (...args) => {
            if (this.onMessage) {
                this.onMessage(args);
            }
        });
        (_h = this.socket) === null || _h === void 0 ? void 0 : _h.on('json', (...args) => {
            if (this.onJson) {
                this.onJson(args);
            }
        });
        (_j = this.socket) === null || _j === void 0 ? void 0 : _j.on('block_chain_' + this.accessToken, (...args) => {
            if (args.length > 0) {
                let trans = args[0];
                const Toast = sweetalert2_1.default.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.addEventListener('mouseenter', sweetalert2_1.default.stopTimer);
                        toast.addEventListener('mouseleave', sweetalert2_1.default.resumeTimer);
                    }
                });
                if (trans.tx && trans.act && trans.act == 'SUCCESS') {
                    this.closeMonitor(trans.tx);
                    if (trans.status && trans.status == 'SUCCEED') {
                        this.log('1');
                        Toast.fire({
                            icon: 'success',
                            title: 'Smart contract submit successfully'
                        });
                    }
                    else if (trans.status && trans.status == 'FAILED') {
                        this.log('0');
                        Toast.fire({
                            icon: 'warning',
                            title: 'Smart contract submit failed'
                        });
                    }
                }
                if (trans.tx && trans.act && trans.act == 'CREATE') {
                    if (trans.tx == '0x00') {
                        this.closeMonitor(trans.tx);
                        Toast.fire({
                            icon: 'success',
                            title: 'Smart contract submit successfully'
                        });
                    }
                    else {
                        setTimeout(() => {
                            this.monitorTx(trans.domain, trans.chainid, trans.tx, 15);
                        }, 3000);
                    }
                }
                if (trans.act && trans.act == 'SIGN') {
                    if (trans.wallet && trans.wallet == 'METAMASK') {
                    }
                    else {
                        this.beforeConfirm(trans.domain, trans.chainid, trans.contract_address, trans.function, trans.args, trans.gas, trans.gas_price, trans.fee).then((trans) => {
                            if (this.onEmitChain) {
                                this.onEmitChain(trans);
                            }
                        });
                    }
                }
            }
            if (this.onEmitChain) {
                this.onEmitChain(args);
            }
        });
        return true;
    }
    sendTx(domain, chainid, fun, args) {
        var _a, _b;
        if (!this.socket || !((_a = this.socket) === null || _a === void 0 ? void 0 : _a.connected)) {
            this.log('connection lost!');
            return;
        }
        (_b = this.socket) === null || _b === void 0 ? void 0 : _b.emit('tx_send', {
            domain: domain,
            chainid: chainid,
            function: fun,
            args: args
        });
    }
    monitorTx(domain, chainid, tx, seconds) {
        var _a;
        (_a = this.socket) === null || _a === void 0 ? void 0 : _a.emit('tx_query', {
            domain: domain,
            chainid: chainid,
            tx: tx
        });
        if (seconds > 0) {
            setTimeout(() => {
                this.monitorTx(domain, chainid, tx, seconds - 3);
            }, 3000);
        }
        else {
            this.closeMonitor(tx);
        }
    }
    queryTx(chainid, tx) {
        var _a;
        (_a = this.socket) === null || _a === void 0 ? void 0 : _a.emit('tx_query', {
            chainid: chainid,
            tx: tx
        });
    }
    beforeConfirm(domain, chainid, address, fun, args, gas, gasPrice, fee) {
        return __awaiter(this, void 0, void 0, function* () {
            const transObj = { domain, chainid, address, fun, args, gas, gasPrice, fee, accessToken: this.accessToken };
            setTimeout(() => {
                document.getElementById('metisConfirmIframe').contentWindow.postMessage(transObj, this.confirmUrl.split('/#')[0]);
            }, 1000);
            sweetalert2_1.default.fire({
                title: 'Confirm your submit',
                html: `<iframe src="${this.confirmUrl}" style="width: 100%; height: 480px;" frameborder="0" id="metisConfirmIframe"></iframe>`,
                width: '720px',
                showConfirmButton: false
            });
            return new Promise((resolve) => {
                const self = this;
                function globalMessage(event) {
                    if (event.origin !== "https://rocket.metis.io" && event.origin !== "https://polis.metis.io" && event.origin !== "http://localhost:1024")
                        return;
                    if (event.data && event.data.tx) {
                        sweetalert2_1.default.close(self.swalPromise);
                        resolve(event.data);
                        window.removeEventListener("message", globalMessage, false);
                    }
                }
                window.addEventListener("message", globalMessage, false);
            });
        });
    }
    closeMonitor(tx) {
        this.removeConfirmMap(tx);
        this.disconnect();
        this.log('stop monitor for tx ' + tx);
    }
    removeConfirmMap(tx) {
        let ix = this.confirmArray.indexOf(tx);
        if (ix >= 0) {
            try {
                this.confirmArray.splice(ix, 1);
            }
            catch (x) {
                this.log(x.message);
            }
        }
    }
    disconnect() {
        var _a;
        (_a = this.socket) === null || _a === void 0 ? void 0 : _a.disconnect();
    }
    closeConfirmDialog() {
        sweetalert2_1.default.close(this.swalPromise);
    }
}
exports.WebSocketClient = WebSocketClient;
