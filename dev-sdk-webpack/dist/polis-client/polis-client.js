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
exports.PolisClient = void 0;
const axios_1 = __importDefault(require("axios"));
const erros_1 = __importStar(require("../provider/erros"));
const ethers_1 = require("ethers");
const polisProvider_1 = require("../provider/polisProvider");
const PolisOauth2Client_1 = require("../provider/PolisOauth2Client");
const request_1 = __importDefault(require("../request"));
const metamask_1 = require("../metamask");
const log_1 = __importDefault(require("../provider/utils/log"));
const utils_1 = require("../provider/utils");
const NuvoWeb3Provider_1 = require("../provider/NuvoWeb3Provider");
class PolisClient {
    constructor(opts) {
        var _a;
        this._confirmUrL = '';
        this._apiHost = '';
        this._oauthHost = '';
        this._oauthLoginuRL = '';
        this._appId = '';
        this._chainId = -1;
        this._useNuvoProvider = true;
        if (opts.apiHost) {
            this._apiHost = opts.apiHost;
        }
        else {
            this._apiHost = 'https://api.nuvosphere.io/';
        }
        if (!!!opts.oauthHost) {
            this._oauthHost = this._apiHost.replace("//api.", "//oauth.");
        }
        else {
            this._oauthHost = opts.oauthHost;
        }
        console.log("aouth:", this._oauthHost);
        this._useNuvoProvider = opts.useNuvoProvider == undefined ? true : opts.useNuvoProvider;
        console.log("_nuvoProvider:", this._useNuvoProvider);
        this._appId = opts.appId;
        this.chainId = opts.chainId;
        if (!this._apiHost.endsWith('/')) {
            this._apiHost = this._apiHost + '/';
        }
        if (!!!this._ethProvider) {
            this.initProvider({
                apiHost: this.apiHost,
                oauthHost: this.authHost,
                chainId: this.chainId,
                token: this.token,
                debug: opts.debug,
                openLink: (_a = opts === null || opts === void 0 ? void 0 : opts.openLink) !== null && _a !== void 0 ? _a : null
            });
        }
        const self = this;
    }
    get apiHost() {
        return this._apiHost;
    }
    get authHost() {
        return this._oauthHost;
    }
    set apiHost(value) {
        this._apiHost = value;
    }
    get chainId() {
        return this._chainId;
    }
    set chainId(value) {
        this._chainId = value;
    }
    get token() {
        var _a;
        return (_a = this._authInfo) === null || _a === void 0 ? void 0 : _a.accessToken;
    }
    get appId() {
        return this._appId;
    }
    get confirmUrl() {
        return `${this.authHost}#/oauth2/confirm`;
    }
    get oauthLoginUrl() {
        return `${this.authHost}#/oauth2-login?`;
    }
    get oauthInfo() {
        return this._authInfo;
    }
    get web3Provider() {
        if (!!this._ethProvider) {
            return this._ethProvider;
        }
        throw erros_1.default.PROVIDER_IS_NOT_INIT;
    }
    startOauth2(opts) {
        if (!!!this.apiHost || this.apiHost.length <= 0) {
        }
        if (!!!opts.appId || opts.appId.length <= 0) {
        }
        if (!!!opts.returnUrl || opts.returnUrl.length <= 0) {
        }
        this._appId = opts.appId;
        const loginUrl = `${this.oauthLoginUrl}switch_account=${opts.switchAccount}&app_id=${this.appId}&return_url=${encodeURIComponent(opts.returnUrl)}`;
        window.location.replace(loginUrl);
        return null;
    }
    connect(auth, bridgeTx = true) {
        return __awaiter(this, void 0, void 0, function* () {
            let needWcSession = false;
            if (auth && auth.accessToken) {
                auth.expriesAt = new Date().getTime() + (auth.expiresIn - 5) * 1000;
                this._authInfo = auth;
                this._polisOauthClient = new PolisOauth2Client_1.PolisOauth2Client(this.apiHost, this.appId, auth);
                if (!bridgeTx) {
                    needWcSession = yield this.saveWCSession();
                }
                if (this._polisprovider) {
                    this._polisprovider.connect(auth.accessToken, bridgeTx, needWcSession);
                    yield this.initJsonRPCProvider(needWcSession);
                }
            }
            else if (typeof (auth) == "string") {
                if (this._authInfo) {
                    this._authInfo.accessToken = auth;
                }
                else {
                    this._authInfo = {
                        appId: this.appId,
                        accessToken: auth,
                        refreshToken: "",
                        expiresIn: 0,
                        expriesAt: 0,
                    };
                }
                if (this._polisprovider) {
                    if (!bridgeTx) {
                        needWcSession = yield this.saveWCSession();
                    }
                    this._polisprovider.connect(auth, bridgeTx, needWcSession);
                    yield this.initJsonRPCProvider(needWcSession);
                }
            }
            else {
                this.emit("error", 'auth info is empty');
                return Promise.reject({ code: 401, message: "auth info is empty" });
            }
        });
    }
    getContract(contractAddress, abi) {
        if (this._ethProvider != undefined) {
            if (this.token) {
                return new ethers_1.ethers.Contract(contractAddress, abi, this._ethProvider.getSigner());
            }
            else {
                return new ethers_1.ethers.Contract(contractAddress, abi, this._ethProvider);
            }
        }
        else {
            this.emit("error", "provider init error");
        }
    }
    disconnect() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!!!this.oauthInfo && !this.token) {
                return Promise.reject(erros_1.default.TOKEN_IS_EMPTY);
            }
            const logoutUrl = this.apiHost + `#/oauth2-logout`;
            const hostUrl = this.apiHost;
            const appId = this.appId;
            const self = this;
            const token = (_a = this._authInfo) === null || _a === void 0 ? void 0 : _a.accessToken;
            const refreshToken = (_b = this._authInfo) === null || _b === void 0 ? void 0 : _b.refreshToken;
            const res = yield axios_1.default.get(`${this.apiHost}api/v1/oauth2/logout?app_id=${this.appId}&token=${token}&refresh_token=${refreshToken}`);
            if (res.status === 200 && res.data && res.data.code === 200) {
                this._authInfo = undefined;
                return Promise.resolve(res.data.data);
            }
            else if (res.status === 200 && res.data.code != 200) {
                const errMsg = res.data.msg;
                this.emit('error', res.data.msg);
                return Promise.reject(errMsg);
            }
            else {
                this.emit('error', `request url  server error!`);
                return Promise.reject(res);
            }
        });
    }
    refreshToken(callback) {
        var _a, _b;
        if (!!!this.oauthInfo || this.oauthInfo.refreshToken == "") {
            (_a = this._polisprovider) === null || _a === void 0 ? void 0 : _a.emit('error', erros_1.default.REFRSHTOKEN_IS_EMPTY);
        }
        axios_1.default.get(this.apiHost + `/api/v1/oauth2/refresh_token?app_id=${this.appId}&refresh_token=${(_b = this._authInfo) === null || _b === void 0 ? void 0 : _b.refreshToken}`)
            .then((res) => {
            if (res.status === 200 && res.data && res.data.code === 200) {
                this.oauthInfo.accessToken = res.data.data.access_token;
                this.oauthInfo.expiresIn = res.data.data.expires_in;
                this.oauthInfo.refreshToken = res.data.data.refresh_token;
                this.oauthInfo.expriesAt = new Date().getTime() + (res.data.data.expires_in - 5) * 1000;
                if (callback) {
                    callback(this.oauthInfo);
                }
            }
            else if (res.status === 200 && res.data) {
                log_1.default.warn(res.data);
            }
        });
    }
    refreshTokenAsync() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!!!this.oauthInfo) {
                (_a = this._polisprovider) === null || _a === void 0 ? void 0 : _a.emit('error', erros_1.default.TOKEN_IS_EMPTY);
                return Promise.reject(erros_1.default.TOKEN_IS_EMPTY);
            }
            const res = yield axios_1.default.get(this.apiHost + `api/v1/oauth2/refresh_token?app_id=${this.appId}&refresh_token=${(_b = this._authInfo) === null || _b === void 0 ? void 0 : _b.refreshToken}`);
            if (res.status == 200 && res.data && res.data.code == 200) {
                this._authInfo.accessToken = res.data.data.access_token;
                this._authInfo.expiresIn = res.data.data.expires_in;
                this._authInfo.refreshToken = res.data.data.refresh_token;
                this._authInfo.expriesAt = new Date().getTime() + (res.data.data.expires_in - 5) * 1000;
                return Promise.resolve(this._authInfo);
            }
            else if (res.status === 200 && res.data) {
                log_1.default.error(res.data);
                return Promise.reject(res.data);
            }
        });
    }
    getUserInfoAsync() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.checkOauth()) {
                this.emit('error', erros_1.default.NO_PERMISSION);
                return Promise.reject(erros_1.default.NO_PERMISSION);
            }
            let url = this.apiHost + `api/v1/oauth2/userinfo`;
            const res = yield axios_1.default.get(`${url}?access_token=${(_a = this.oauthInfo) === null || _a === void 0 ? void 0 : _a.accessToken}`);
            if (res.status === 200 && res.data && res.data.code === 200) {
                return Promise.resolve(res.data.data);
            }
            else if (res.status === 200 && res.data) {
                const errMsg = res.data.msg;
                this.emit('error', res.data.msg);
                return Promise.reject(errMsg);
            }
            else {
                this.emit('error', `request url  server error!`);
                return Promise.reject(res);
            }
        });
    }
    changeChain(chainId) {
        var _a;
        (_a = this._polisprovider) === null || _a === void 0 ? void 0 : _a.emit('changeChain', { chainId });
        if (this._polisprovider)
            this._polisprovider.chainId = chainId;
    }
    on(event, callback) {
        var _a;
        (_a = this._polisprovider) === null || _a === void 0 ? void 0 : _a.on(event, callback);
    }
    once(event, callback) {
        var _a;
        (_a = this._polisprovider) === null || _a === void 0 ? void 0 : _a.once(event, callback);
    }
    off(event, callback) {
        var _a;
        (_a = this._polisprovider) === null || _a === void 0 ? void 0 : _a.off(event, callback);
    }
    estimateGasAsync(domain, chainId, fun, args, disableTooltip = false, extendParams = null) {
        return __awaiter(this, void 0, void 0, function* () {
            const r = new request_1.default(!disableTooltip);
            try {
                yield this.handleRefreshTokenAsync();
                const headers = {
                    'Content-Type': 'application/json',
                    'Access-Token': this.token,
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
                    return Promise.reject((0, erros_1.makeRequestError)(errMsg));
                }
                else {
                    return Promise.reject((0, erros_1.makeError)(erros_1.default.NETWORK_ERROR, res));
                }
            }
            catch (e) {
                return Promise.reject((0, erros_1.makeRequestError)(e.message));
            }
            return null;
        });
    }
    getDomain(name, chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post('domains', { name, chainId });
        });
    }
    createDomain(param, disableTooltip = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post('domains/create', param, 'post', true);
        });
    }
    saveDomainChains(param, disableTooltip = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (param.id) {
                return this.post(`domains/${param.id}/save_chains`, param, 'post', true);
            }
            if (param.domain) {
                return this.post(`domains/${param.domain}/save_chains`, param, 'post', true);
            }
            return Promise.reject('The parameter ID or domain can not be empty');
        });
    }
    delDomain(domain, disableTooltip = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post(`deldomain/${domain}`, null, 'get', true);
        });
    }
    createDapp(param) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post('create_applications?access_token=' + this.token, param, 'post', true);
        });
    }
    modifyDapp(param) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post('modify_applications?access_token=' + this.token, param, 'post', true);
        });
    }
    deleteDapps(param) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post('del_applications?access_token=' + this.token, param, 'post', true);
        });
    }
    getDappList(pageSize, pageIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            let method = 'get_applications?' + this.token + "&page_no=" + pageIndex + "&page_size=" + pageSize;
            return this.post(method, null, 'get');
        });
    }
    getDapp(dappId) {
        return __awaiter(this, void 0, void 0, function* () {
            let method = 'get_application?' + this.token + "&id=" + dappId;
            return this.post(method, null, 'get');
        });
    }
    applyToDeveloper() {
        return __awaiter(this, void 0, void 0, function* () {
            let method = 'dev_request?' + this.token;
            return this.post(method, null, 'get');
        });
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
                    if (chainObj) {
                        chainObj['chainId'] = chainNum;
                    }
                }
                catch (e) {
                    chainObj = null;
                }
            }
            return (0, metamask_1.addToken)(token, tokenAddress, tokenDecimals, tokenImage, chainObj);
        });
    }
    initProvider(opts) {
        this._polisprovider = new polisProvider_1.PolisProvider(opts, this._polisOauthClient);
        this._ethProvider = new ethers_1.ethers.providers.Web3Provider(this._polisprovider, 'any');
    }
    handleRefreshTokenAsync() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (((_a = this._authInfo) === null || _a === void 0 ? void 0 : _a.expriesAt) > 0 && new Date().getTime() >= ((_b = this._authInfo) === null || _b === void 0 ? void 0 : _b.expriesAt)) {
                return this.refreshTokenAsync();
            }
            return Promise.resolve(this._authInfo);
        });
    }
    post(method, data, httpMethod = 'post', returnObj = false) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.handleRefreshTokenAsync();
            const headers = {
                'Content-Type': 'application/json',
                'Access-Token': this.token,
            };
            let res;
            if (httpMethod === 'post') {
                res = yield axios_1.default.post(this.apiHost + `api/v1/oauth2/` + method, data, { headers });
            }
            else {
                res = yield axios_1.default.get(this.apiHost + `api/v1/oauth2/` + method, { headers });
            }
            if (res.status === 200 && res.data && res.data.code === 200) {
                const result = res.data.data;
                if (returnObj) {
                    return Promise.resolve(res.data);
                }
                return Promise.resolve(result);
            }
            if (res.status === 200 && res.data) {
                const errMsg = res.data.msg;
                this.emit("error", errMsg);
                return Promise.reject(errMsg);
            }
            return Promise.reject(res.data);
        });
    }
    request(url, data, httpMethod = 'post', returnObj = false) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.handleRefreshTokenAsync();
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': this.token,
                'Access-Token': this.token,
            };
            let res;
            if (httpMethod === 'post') {
                res = yield axios_1.default.post(this.apiHost + url, data, { headers });
            }
            else {
                res = yield axios_1.default.get(this.apiHost + url, { headers });
            }
            if (res.status === 200 && res.data && res.data.code === 200) {
                const result = res.data.data;
                if (returnObj) {
                    return Promise.resolve(res.data);
                }
                return Promise.resolve(result);
            }
            if (res.status === 200 && res.data) {
                this.emit("error", res.data);
                return Promise.reject(res.data);
            }
            return Promise.reject(res.data);
        });
    }
    checkOauth() {
        return !!this._authInfo;
    }
    saveWCSession() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.request("api/v1/oauth2/wc_session", null, 'get', true);
            if (res.code == 200) {
                log_1.default.debug("wc_session....res....", res);
                window.localStorage.setItem("walletconnect", res.data.wcSession);
                return res.data.walletType == utils_1.WALLET_TYPES.WC;
            }
            return false;
        });
    }
    emit(name, obj) {
        var _a;
        (_a = this._polisprovider) === null || _a === void 0 ? void 0 : _a.emit(name, obj);
    }
    initJsonRPCProvider(wcSession = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._useNuvoProvider) {
                if (wcSession) {
                }
                else {
                    this._ethProvider = new NuvoWeb3Provider_1.NuvoWeb3Provider(this._polisprovider, 'any');
                }
            }
            else {
                if (wcSession) {
                }
                else {
                    this._ethProvider = new ethers_1.ethers.providers.Web3Provider(this._polisprovider, 'any');
                }
            }
        });
    }
}
exports.PolisClient = PolisClient;
exports.default = PolisClient;
