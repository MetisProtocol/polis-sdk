"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.HttpClient = void 0;
const oauth2_client_1 = require("./oauth2-client");
const endpoints_1 = __importDefault(require("./endpoints"));
const metamask_1 = __importStar(require("./metamask"));
const request_1 = __importDefault(require("./request"));
const axios_1 = __importDefault(require("axios"));
const sweetalert2_1 = __importDefault(require("sweetalert2"));
const dialog_1 = __importDefault(require("./provider/utils/dialog"));
const log_1 = __importDefault(require("./provider/utils/log"));
const utils_1 = require("./provider/utils");
class HttpClient {
    constructor(appId, accessToken, refreshToken, expiresIn, apiHost, bridgeMetaMask = true) {
        this.endpoints = new endpoints_1.default();
        this.apiHost = this.endpoints.getApiHost();
        this.confirmUrl = this.endpoints.getConfirmUrl();
        this.bridgeUrl = this.endpoints.getBridgeUrl();
        this.swalPromise = null;
        this.env = '';
        this.txStatus = '';
        this.loadingDialog = sweetalert2_1.default.mixin({});
        this.bridgeMetaMask = true;
        this.bridgeMetaMask = bridgeMetaMask;
        this.endpoints = new endpoints_1.default(apiHost);
        if (apiHost) {
            this.apiHost = apiHost;
        }
        else {
            this.apiHost = this.endpoints.getApiHost();
        }
        this.confirmUrl = this.endpoints.getConfirmUrl();
        this.bridgeUrl = this.endpoints.getBridgeUrl();
        this.appId = appId;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.oAuth2Client = new oauth2_client_1.Oauth2Client(apiHost);
        const oauthUser = {
            appId,
            accessToken,
            refreshToken,
            expiresIn,
            expriesAt: new Date().getTime() + (expiresIn - 5) * 1000,
        };
        this.oAuth2Client.setUser(oauthUser);
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
    getBalance(chainId, address = '') {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = {
                'Content-Type': 'application/json',
                'Access-Token': this.accessToken,
            };
            let data = { chainId };
            if (address && address.length > 0) {
                data.address = address;
            }
            return this.post('balance', data);
        });
    }
    getLogsAsync(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post('get_logs', data);
        });
    }
    getTxLogsAsync(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post('get_tx_logs', data);
        });
    }
    post(method, data, disableTooltip = false, httpMethod = 'post', returnObj = false) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.handleRefreshTokenAsync();
            const headers = {
                'Content-Type': 'application/json',
                'Access-Token': this.accessToken,
            };
            let res;
            if (httpMethod === 'post') {
                res = yield axios_1.default.post(this.apiHost + `/api/v1/oauth2/` + method, data, { headers });
            }
            else {
                res = yield axios_1.default.get(this.apiHost + `/api/v1/oauth2/` + method, { headers });
            }
            if (res.status === 200 && res.data && res.data.code === 200) {
                const trans = res.data.data;
                if (returnObj) {
                    return Promise.resolve(res.data);
                }
                return Promise.resolve(trans);
            }
            if (res.status === 200 && res.data) {
                const errMsg = res.data.msg;
                if (!disableTooltip) {
                    error(errMsg);
                }
            }
            return Promise.reject(res.data);
        });
    }
    handleRefreshTokenAsync() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (new Date().getTime() < ((_a = this.oAuth2Client.oauth2User) === null || _a === void 0 ? void 0 : _a.expriesAt)) {
                return null;
            }
            const ret = yield this.oAuth2Client.refreshTokenAsync(this.appId, (_b = this.oAuth2Client.oauth2User) === null || _b === void 0 ? void 0 : _b.refreshToken);
            if (ret) {
                this.accessToken = ret.accessToken;
                this.refreshToken = ret.refreshToken || '';
            }
            return ret;
        });
    }
    sendTx(domain, chainId, fun, args, succCallback, errCallback, extendParams, disableTooltip = false) {
        const headers = {
            'Content-Type': 'application/json',
            'Access-Token': this.accessToken,
        };
        this.handleRefreshToken(() => {
            axios_1.default.post(this.apiHost + `/api/v1/oauth2/send_tx`, {
                chainId,
                domain,
                args,
                function: fun,
                extendArgs: extendParams,
            }, { headers })
                .then(res => {
                if (res.status === 200 && res.data && res.data.code === 200) {
                    if (succCallback) {
                        succCallback(res.data.data);
                    }
                    const trans = res.data.data;
                    if (trans.act && trans.act === 'SIGN') {
                        if (trans.wallet && trans.wallet === 'METAMASK') {
                            this.getChainUrl(trans.chainId).then(chainObj => {
                                metamask_1.default.sendMetaMaskContractTx(trans, chainObj).then(res => {
                                    let savedTx;
                                    if (res === null || res === void 0 ? void 0 : res.success) {
                                        saveTx(this.apiHost, this.accessToken, 'save_app_tx', res === null || res === void 0 ? void 0 : res.data, false)
                                            .then(savedTx => {
                                            if (savedTx == null) {
                                                savedTx = {
                                                    tx: res === null || res === void 0 ? void 0 : res.data.trans.txhash,
                                                    status: 'SERVER_ERROR',
                                                    chainId: trans.chainId,
                                                    domain: trans.domain,
                                                    data: 'ok',
                                                    act: 'CREATE',
                                                };
                                            }
                                        });
                                    }
                                });
                            });
                        }
                        else {
                            this.beforeConfirm(trans);
                        }
                    }
                    if (trans.act && trans.act === 'SUCCESS') {
                        const toast = sweetalert2_1.default.mixin({
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 3000,
                            timerProgressBar: true,
                            didOpen: (toast) => {
                                toast.addEventListener('mouseenter', sweetalert2_1.default.stopTimer);
                                toast.addEventListener('mouseleave', sweetalert2_1.default.resumeTimer);
                            },
                        });
                        toast.fire({
                            icon: 'success',
                            title: 'Smart contract submit successfully',
                        });
                    }
                }
                else if (res.status === 200 && res.data) {
                    const errMsg = res.data.msg;
                    if (!disableTooltip) {
                        error(errMsg);
                    }
                    if (errCallback) {
                        errCallback(errMsg);
                    }
                }
            })
                .catch(err => {
                if (errCallback) {
                    errCallback(err);
                }
            });
        });
    }
    estimateGasAsync(domain, chainId, fun, args, disableTooltip = false, extendParams = null) {
        return __awaiter(this, void 0, void 0, function* () {
            const r = new request_1.default(!disableTooltip);
            try {
                yield this.handleRefreshTokenAsync();
                const headers = {
                    'Content-Type': 'application/json',
                    'Access-Token': this.accessToken,
                };
                const res = yield r.instance.post(`${this.apiHost}/api/v1/oauth2/send_tx`, {
                    chainId,
                    domain,
                    args,
                    estimateGas: true,
                    function: fun,
                    extendParams: extendParams,
                }, { headers });
                if (res.status === 200 && res.data && res.data.code === 200) {
                    const trans = res.data.data;
                    return Promise.resolve(trans);
                }
                else if (res.status === 200 && res.data) {
                    const errMsg = res.data.msg;
                    error(errMsg);
                    return Promise.reject({ status: 'ERROR', message: errMsg });
                }
                else {
                    return Promise.reject({ status: 'ERROR', message: 'server error:' });
                }
            }
            catch (e) {
                return Promise.reject(e.message);
            }
            return null;
        });
    }
    sendTxAsync(domain, chainId, func, args, disableTooltip = false, extendParams = null) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!disableTooltip) {
                this.showLoading();
            }
            const r = new request_1.default(false);
            try {
                yield this.handleRefreshTokenAsync();
                const headers = {
                    'Content-Type': 'application/json',
                    'Access-Token': this.accessToken,
                };
                const res = yield r.instance.post(`${this.apiHost}/api/v1/oauth2/send_tx`, {
                    chainId,
                    domain,
                    args,
                    function: func,
                    extendParams: extendParams,
                }, { headers })
                    .then(function (res) {
                    return res;
                }, function (res) {
                    return { status: res.status };
                });
                if (res.status === 200 && res.data && res.data.code === 200) {
                    const trans = res.data.data;
                    if (trans.act && trans.act === 'SIGN') {
                        let res;
                        if (this.bridgeMetaMask && (trans.wallet == utils_1.WALLET_TYPES.MM || trans.wallet == utils_1.WALLET_TYPES.WC)) {
                            const postData = Object.assign(trans, { txType: utils_1.TX_TYPE.SEND_CON_TX });
                            res = yield this.polisBridgePage(postData);
                            return Promise.resolve(res.data);
                        }
                        if (trans.wallet === utils_1.WALLET_TYPES.MM) {
                            this.txStatus = '';
                            const chainObj = yield this.getChainUrl(trans.chainId);
                            res = yield metamask_1.default.sendMetaMaskContractTx(trans, chainObj, disableTooltip);
                            log_1.default.debug('metamak', res);
                            let savedTx;
                            if (res === null || res === void 0 ? void 0 : res.success) {
                                savedTx = yield saveTx(this.apiHost, this.accessToken, 'save_app_tx', res === null || res === void 0 ? void 0 : res.data, true);
                                if (savedTx == null) {
                                    savedTx = {
                                        tx: res === null || res === void 0 ? void 0 : res.data.trans.txhash,
                                        status: 'SERVER_ERROR',
                                        chainId: trans.chainId,
                                        domain: trans.domain,
                                        data: 'ok',
                                        act: 'CREATE',
                                        value: trans.value,
                                    };
                                    return new Promise((resolve, reject) => {
                                        reject(savedTx);
                                    });
                                }
                                while (this.txStatus !== 'SUCCEED' && this.txStatus !== 'FAILED') {
                                    yield (0, utils_1.sleep)(2000);
                                    savedTx = yield this.queryTxAsync(chainId, res === null || res === void 0 ? void 0 : res.data.trans.txhash, true);
                                    if (savedTx && savedTx.status && (savedTx.status === 'SUCCEED' || savedTx.status === 'FAILED')) {
                                        this.txStatus = savedTx.status;
                                        if (savedTx.status === 'FAILED') {
                                            if (!disableTooltip) {
                                                this.closeLoading();
                                            }
                                            return Promise.reject(savedTx);
                                        }
                                    }
                                }
                                if (!disableTooltip) {
                                    this.closeLoading();
                                }
                                return new Promise((resolve, reject) => {
                                    resolve(savedTx);
                                });
                            }
                            else {
                                error(res === null || res === void 0 ? void 0 : res.data);
                                return Promise.reject(res);
                            }
                            if (res != null && !disableTooltip) {
                                this.closeLoading();
                            }
                            return new Promise((resolve, reject) => reject(res));
                        }
                        else if (trans.wallet == utils_1.WALLET_TYPES.WC) {
                        }
                        else {
                            return this.beforeConfirm(trans);
                        }
                    }
                    if (trans.act && trans.act === 'SUCCESS' && !disableTooltip) {
                        const toast = sweetalert2_1.default.mixin({
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 3000,
                            timerProgressBar: true,
                            didOpen: (toast) => {
                                toast.addEventListener('mouseenter', sweetalert2_1.default.stopTimer);
                                toast.addEventListener('mouseleave', sweetalert2_1.default.resumeTimer);
                            },
                        });
                        toast.fire({
                            icon: 'success',
                            title: 'Smart contract submit successfully',
                        });
                    }
                    return trans;
                }
                if (res.status === 200 && res.data) {
                    const errMsg = res.data.msg;
                    if (!disableTooltip) {
                        error(errMsg);
                    }
                    return Promise.reject({ status: 'ERROR', message: errMsg });
                }
                else {
                    return Promise.reject({ status: 'ERROR', message: 'server error:' });
                }
            }
            catch (e) {
                return Promise.reject(e.message);
            }
            return null;
        });
    }
    polisBridgePage(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const bridgeUrl = this.bridgeUrl;
            const postData = {
                walletType: data.wallet,
                domain: data.domain,
                chainId: data.chainId,
                from: data.eth_address,
                function: data.function,
                funcAbi: data.func_abi_sign,
                args: data.args ? data.args : [],
                gas: data.gas,
                gasLimit: data.gasLimit,
                gasPrice: data.gas_price_num,
                fee: data.fee_num,
                feeTxt: data.fee,
                contractAddress: data.contract_address,
                accessToken: this.accessToken,
                value: data.value,
                symbol: data.symbol,
                to: data.to,
                data: data.data ? data.data : '0x',
                act: data.act,
                isMetamask: false,
                isThirdwallet: false,
                nonce: data.nonce,
                chainUrl: '',
                txType: utils_1.TX_TYPE.SEND_CON_TX,
                sdkVer: 1
            };
            log_1.default.debug("sdk v1 postdata:", postData);
            const confirmWin = dialog_1.default.fire({
                title: '',
                html: `<iframe src="${bridgeUrl}" style="width: 100%; height: 0px;" frameborder="0" id="polisBridgeIframe"></iframe>`,
                width: `0px`,
                showConfirmButton: false,
                background: '#3A1319',
                didOpen: (dom) => {
                    document.getElementById('polisBridgeIframe').onload = function () {
                        document.getElementById('polisBridgeIframe').contentWindow.postMessage(postData, bridgeUrl.split('/#')[0]);
                    };
                },
                didClose: () => {
                    window.postMessage({ status: 'ERROR', code: 1000, message: 'CANCEL' }, window.location.origin);
                },
            });
            const self = this;
            return new Promise((resolve, reject) => {
                function globalMessage(event) {
                    log_1.default.debug(`event confirm: ${JSON.stringify(event.data)}`);
                    if (event.origin !== 'https://polis.metis.io'
                        && event.origin !== 'https://polis-test.metis.io'
                        && event.origin !== 'https://test-polis.metis.io'
                        && event.origin !== 'http://localhost:1024' && event.origin + "/" != self.apiHost && event.origin !== window.location.origin) {
                        return;
                    }
                    if (event.data && event.data.status) {
                        if (event.data.status === 'ERROR' || event.data.status === 'DECLINE' || event.data.status === 'FAILED') {
                            reject(event.data);
                        }
                        else {
                            resolve(event.data);
                        }
                        window.removeEventListener('message', globalMessage, false);
                        dialog_1.default.close(self.swalPromise);
                    }
                }
                window.addEventListener('message', globalMessage, false);
            });
        });
    }
    beforeConfirm(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const postData = {
                walletType: data.wallet,
                domain: data.domain,
                chainId: data.chainId,
                from: data.eth_address,
                function: data.function,
                funcAbi: data.func_abi_sign,
                args: data.args ? data.args : [],
                gas: data.gas,
                gasLimit: data.gasLimit,
                gasPrice: data.gas_price_num,
                fee: data.fee_num,
                feeTxt: data.fee,
                contractAddress: data.contract_address,
                accessToken: this.accessToken,
                value: data.value,
                symbol: data.symbol,
                to: data.to ? data.to : data.contract_address,
                data: data.data,
                act: data.act,
                isMetamask: false,
                isThirdwallet: false,
                nonce: data.nonce,
                chainUrl: '',
                txType: utils_1.TX_TYPE.SEND_CON_TX,
                sdkVer: 1
            };
            log_1.default.debug("sdk v1 postdata:", postData);
            const confirmUrl = this.confirmUrl;
            sweetalert2_1.default.fire({
                title: '<span style="font-size: 24px;font-weight: bold;color: #FFFFFF;font-family: Helvetica-Bold, Helvetica">Request Confirmation</span>',
                html: `<iframe src="${this.confirmUrl}" style="width: 100%; height: 480px;" frameborder="0" id="metisConfirmIframe"></iframe>`,
                width: '720px',
                showConfirmButton: false,
                background: '#3A1319',
                didOpen: (dom) => {
                    document.getElementById('metisConfirmIframe').onload = function () {
                        document.getElementById('metisConfirmIframe').contentWindow.postMessage(postData, confirmUrl.split('/#')[0]);
                    };
                },
                didClose: () => {
                    window.postMessage({ status: 'ERROR', code: 1000, message: 'CANCEL' }, window.location.origin);
                },
            });
            return new Promise((resolve, reject) => {
                const self = this;
                function globalMessage(event) {
                    if (event.origin !== 'https://polis.metis.io'
                        && event.origin !== 'https://polis-test.metis.io'
                        && event.origin !== 'https://test-polis.metis.io'
                        && event.origin !== 'http://localhost:1024'
                        && event.origin !== self.apiHost
                        && event.origin !== window.location.origin) {
                        return;
                    }
                    if (event.data && event.data.status) {
                        if (event.data.status === 'ERROR' || event.data.status === 'DECLINE' || event.data.status === 'FAILED') {
                            reject(event.data);
                        }
                        else {
                            resolve(event.data);
                        }
                        window.removeEventListener('message', globalMessage, false);
                        sweetalert2_1.default.close(self.swalPromise);
                    }
                }
                window.addEventListener('message', globalMessage, false);
            });
        });
    }
    queryTx(chainId, tx, succCallback, errCallback, extendParams = null, disableTooltip = false) {
        const headers = {
            'Content-Type': 'application/json',
            'Access-Token': this.accessToken,
        };
        this.handleRefreshToken(() => {
            axios_1.default.post(this.apiHost + `/api/v1/oauth2/query_tx`, {
                chainId,
                tx,
                extendParams: extendParams
            }, { headers }).then(res => {
                if (res.status === 200 && res.data && res.data.code == 200) {
                    if (succCallback) {
                        succCallback(res.data.data);
                    }
                    const trans = res.data.data;
                    if (trans.tx && trans.act && trans.act == 'SUCCESS') {
                        const Toast = sweetalert2_1.default.mixin({
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 3000,
                            timerProgressBar: true,
                            didOpen: (toast) => {
                                toast.addEventListener('mouseenter', sweetalert2_1.default.stopTimer);
                                toast.addEventListener('mouseleave', sweetalert2_1.default.resumeTimer);
                            },
                        });
                        if (trans.status && trans.status == 'SUCCEED') {
                            Toast.fire({
                                icon: 'success',
                                title: 'Smart contract submit successfully',
                            });
                        }
                        else if (trans.status && trans.status == 'FAILED') {
                            Toast.fire({
                                icon: 'warning',
                                title: 'Smart contract submit failed',
                            });
                        }
                    }
                }
                else if (res.status === 200 && res.data) {
                    const errMsg = res.data.msg;
                    if (!disableTooltip) {
                        error(errMsg);
                    }
                    if (errCallback) {
                        errCallback(errMsg);
                    }
                }
            });
        });
    }
    queryTxAsync(chainId, tx, disableTooltip) {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = {
                'Content-Type': 'application/json',
                'Access-Token': this.accessToken,
            };
            yield this.handleRefreshToken();
            const r = new request_1.default(!disableTooltip);
            const res = yield r.instance.post(this.apiHost + `/api/v1/oauth2/query_tx`, {
                chainId,
                tx,
            }, { headers });
            if (res.status === 200 && res.data && res.data.code === 200) {
                const trans = res.data.data;
                if (trans.tx && trans.act && trans.act === 'SUCCESS' && !disableTooltip) {
                    const toast = sweetalert2_1.default.mixin({
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                        didOpen: (toast) => {
                            toast.addEventListener('mouseenter', sweetalert2_1.default.stopTimer);
                            toast.addEventListener('mouseleave', sweetalert2_1.default.resumeTimer);
                        },
                    });
                    if (trans.status && trans.status === 'SUCCEED') {
                        toast.fire({
                            icon: 'success',
                            title: 'Smart contract submit successfully',
                        });
                    }
                    else if (trans.status && trans.status === 'FAILED') {
                        toast.fire({
                            icon: 'warning',
                            title: 'Smart contract submit failed',
                        });
                    }
                }
                return trans;
            }
            if (res.status === 200 && res.data) {
                const errMsg = res.data.msg;
                if (!disableTooltip) {
                    error(errMsg);
                }
            }
            return null;
        });
    }
    closeConfirmDialog() {
        sweetalert2_1.default.close(this.swalPromise);
    }
    getChainUrl(chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.post('chainurl', { chainId });
        });
    }
    addTokenToMM(token, tokenAddress = '', tokenDecimals = 18, tokenImage = '', chainId = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            let chainObj = null;
            let chainNum = chainId;
            if (typeof token === 'object' && !!token['chainId']) {
                chainNum = token['chainId'];
            }
            if (chainNum > 0) {
                try {
                    chainObj = yield this.getChainUrl(`${chainNum}`);
                    chainObj['chainId'] = chainNum;
                }
                catch (e) {
                    chainObj = null;
                }
            }
            return (0, metamask_1.addToken)(token, tokenAddress, tokenDecimals, tokenImage, chainObj);
        });
    }
    getDomain(name, chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post('domains', { name, chainId });
        });
    }
    createDomain(param, disableTooltip = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post('domains/create', param, disableTooltip, 'post', true);
        });
    }
    saveDomainChains(param, disableTooltip = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (param.id) {
                return this.post(`domains/${param.id}/save_chains`, param, disableTooltip, 'post', true);
            }
            if (param.domain) {
                return this.post(`domains/${param.domain}/save_chains`, param, disableTooltip, 'post', true);
            }
            return Promise.reject('The parameter ID or domain can not be empty');
        });
    }
    delDomain(domain, disableTooltip = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post(`domains/deldomain/${domain}`, null, disableTooltip, 'get', true);
        });
    }
    providerCall(param) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.post('eth_call', param);
        });
    }
    createDapp(param, disableTooltip = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post('create_applications?access_token=' + this.accessToken, param, disableTooltip, 'post', true);
        });
    }
    modifyDapp(param, disableTooltip = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post('modify_applications?access_token=' + this.accessToken, param, disableTooltip, 'post', true);
        });
    }
    deleteDapps(param, disableTooltip = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post('del_applications?access_token=' + this.accessToken, param, disableTooltip, 'post', true);
        });
    }
    getDappList(pageSize, pageIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            let method = 'get_applications?' + this.accessToken + "&page_no=" + pageIndex + "&page_size=" + pageSize;
            return this.post(method, null, false, 'get');
        });
    }
    getDapp(dappId) {
        return __awaiter(this, void 0, void 0, function* () {
            let method = 'get_application?' + this.accessToken + "&id=" + dappId;
            return this.post(method, null, false, 'get');
        });
    }
    applyToDeveloper() {
        return __awaiter(this, void 0, void 0, function* () {
            let method = 'dev_request?' + this.accessToken;
            return this.post(method, null, false, 'get');
        });
    }
    showLoading() {
        this.loadingDialog.fire({
            html: 'Processing...',
            didOpen: () => {
                sweetalert2_1.default.showLoading();
            },
            allowOutsideClick: false,
        });
    }
    closeLoading() {
        this.loadingDialog.close();
    }
}
exports.HttpClient = HttpClient;
function error(msg) {
    log_1.default.debug(`msg`, msg);
    let errMsg = msg;
    if (typeof (msg) === 'object' && msg.message) {
        errMsg = msg.message;
    }
    const toast = sweetalert2_1.default.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', sweetalert2_1.default.stopTimer);
            toast.addEventListener('mouseleave', sweetalert2_1.default.resumeTimer);
        },
    });
    toast.fire({
        icon: 'error',
        title: errMsg || 'Some errors occured',
    });
}
function saveTx(apiHost, accessToken, method, data, disableDialog) {
    return __awaiter(this, void 0, void 0, function* () {
        const headers = {
            'Content-Type': 'application/json',
            'Access-Token': accessToken,
        };
        try {
            const res = yield new request_1.default(!disableDialog).instance.post(`${apiHost}/api/v1/oauth2/` + method, data, { headers });
            if (res.status === 200 && res.data && res.data.code === 200) {
                const trans = res.data.data;
                return trans;
            }
            if (res.status === 200 && res.data) {
                const result = yield sweetalert2_1.default.fire({
                    html: '<div style=\'text-align: left;\'>The transaction was submitted successfully, but the application is having trouble with tracking the transaction status.</div>',
                    showCancelButton: true,
                    width: 600,
                    confirmButtonText: 'Check again',
                });
                if (result.isConfirmed) {
                    return yield saveTx(apiHost, accessToken, method, data, disableDialog);
                }
                else {
                    error(res.data.msg);
                }
            }
        }
        catch (e) {
            const result = yield sweetalert2_1.default.fire({
                html: '<div style=\'text-align: left;\'>The transaction was submitted successfully, but the application is having trouble with tracking the transaction status.</div>',
                showCancelButton: true,
                width: 600,
                confirmButtonText: 'Check again',
            });
            if (result.isConfirmed) {
                return yield saveTx(apiHost, accessToken, method, data, disableDialog);
            }
            return null;
        }
        return null;
    });
}
