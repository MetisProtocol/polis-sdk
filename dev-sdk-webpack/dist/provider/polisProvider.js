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
exports.PolisProvider = void 0;
const json_rpc_engine_1 = require("json-rpc-engine");
const httpRequest_1 = __importDefault(require("./utils/httpRequest"));
const dialog_1 = __importDefault(require("./utils/dialog"));
const polisConnectMiddleware_1 = __importDefault(require("./polisConnectMiddleware"));
const utils_1 = require("./utils");
const metaMaskWallet_1 = __importDefault(require("./metaMaskWallet"));
const axios_1 = __importDefault(require("axios"));
const sweetalert2_1 = __importDefault(require("sweetalert2"));
const erros_1 = __importDefault(require("./erros"));
const log_1 = __importDefault(require("./utils/log"));
const erros_2 = __importDefault(require("./erros"));
const utils_2 = require("../provider/utils");
const browser_1 = require("./utils/browser");
let _nextId = 1;
class PolisProvider extends json_rpc_engine_1.JsonRpcEngine {
    constructor(opts, polisOauth2Client) {
        super();
        this._confirmUrl = '';
        this._apiHost = '';
        this._oauthHost = '';
        this.host = '';
        this._chainId = -1;
        this._wallet_type = '';
        this.swalPromise = null;
        this._bridgeTx = false;
        this.providerOpts = {
            apiHost: "",
            chainId: -1,
            maxAttempts: 5,
            token: "",
        };
        if (!opts.apiHost || opts.apiHost.length <= 0) {
            this._apiHost = "https://api.nuvosphere.io/";
        }
        else {
            if (!opts.apiHost.endsWith('/')) {
                this._apiHost = this._apiHost + '/';
            }
            this._apiHost = opts.apiHost;
        }
        if (!!!opts.oauthHost) {
            this._oauthHost = this._apiHost.replace("://api.", "://oauth.");
            if (!opts.apiHost.endsWith('/')) {
                this._apiHost = this._apiHost + '/';
            }
        }
        else {
            this._oauthHost = opts.oauthHost;
        }
        this.host = this._apiHost;
        this._chainId = opts.chainId;
        this._polisOauth2Client = polisOauth2Client;
        this.providerOpts = opts;
        this.initWallet();
    }
    get token() {
        return this.providerOpts.token;
    }
    get confirmUrl() {
        return `${this.authHost}#/oauth2/confirm`;
    }
    get bridgeUrl() {
        return `${this.authHost}#/oauth2/bridge`;
    }
    get rpcUrl() {
        return `${this.apiHost}api/rpc/v1`;
    }
    get chainId() {
        return this._chainId;
    }
    set chainId(value) {
        this._chainId = value;
    }
    get apiHost() {
        return this._apiHost;
    }
    get authHost() {
        return this._oauthHost;
    }
    get walletType() {
        return this._wallet_type;
    }
    static defaultUrl() {
        return "http:/\/localhost:8545";
    }
    request(request) {
        const req = {
            method: request.method,
            params: request.params,
            id: (_nextId++),
            jsonrpc: "2.0",
        };
        const self = this;
        return new Promise((resolve, reject) => {
            this.handle(req, function (err, response) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(response.result);
                }
            });
        });
    }
    connect(token, bridgeMetamask = true, needWcSession = false) {
        this._bridgeTx = bridgeMetamask;
        this.providerOpts.token = token;
        this.initWallet();
    }
    initWallet() {
        const self = this;
        this.push((req, res, next, end) => __awaiter(this, void 0, void 0, function* () {
            if (req.method === 'eth_chainId') {
                res.result = self.chainId;
                end();
            }
            if (req.method === 'personal_sign') {
                this.emit('debug', `signMessage: ${JSON.stringify(res)}`);
                if (this._wallet_type != utils_1.WALLET_TYPES.POLIS) {
                    res.result = yield this.signMessage(req, res, this._wallet_type);
                    end();
                }
            }
            next();
        }));
        if (this._polisOauth2Client) {
            this.push((req, res, next, end) => __awaiter(this, void 0, void 0, function* () {
                yield this.handleRefreshTokenAsync();
            }));
        }
        this.push(this.createPolisWallet());
        this.push((0, polisConnectMiddleware_1.default)(this.providerOpts, this));
        this.push((req, res, next, end) => __awaiter(this, void 0, void 0, function* () {
            if (req.method === 'eth_accounts') {
                this.emit('debug', `eth_accounts => ${JSON.stringify(res)}`);
                const result = res.result;
                if (result.length === 2) {
                    res.result = [result[0]];
                    this._wallet_type = result[1];
                    if (this._wallet_type === 'METAMASK') {
                        metaMaskWallet_1.default.addMetamaskEventCallback(utils_1.PolisEvents.CHAIN_CHANGED_EVENT, (chainId) => {
                            this.emit(utils_1.PolisEvents.CHAIN_CHANGED_EVENT, chainId);
                        });
                        metaMaskWallet_1.default.addMetamaskEventCallback(utils_1.PolisEvents.ACCOUNTS_CHANGED_EVENT, (address) => {
                            this.emit(utils_1.PolisEvents.ACCOUNTS_CHANGED_EVENT, address);
                        });
                    }
                    else {
                        metaMaskWallet_1.default.addMetamaskEventCallback(utils_1.PolisEvents.CHAIN_CHANGED_EVENT, null);
                        metaMaskWallet_1.default.addMetamaskEventCallback(utils_1.PolisEvents.ACCOUNTS_CHANGED_EVENT, null);
                    }
                }
            }
            if (req.method === 'personal_sign') {
                res.result = res.result.signMsg;
            }
            end();
        }));
    }
    createPolisWallet() {
        return (0, json_rpc_engine_1.createAsyncMiddleware)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (req.method == 'eth_sendTransaction') {
                yield this.confirmTrans(req, res);
                this.emit(utils_1.PolisEvents.TX_CONFIRM_EVENT, Object.assign({}, { action: 'after confirmTrans' }, res));
            }
            else {
                next();
            }
        }));
    }
    confirmTrans(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let walletType = "";
            try {
                const estimateTx = yield this.estimatePolisTrans(req);
                if (this._bridgeTx || this.walletType == utils_1.WALLET_TYPES.LOCAL || this.walletType == utils_1.WALLET_TYPES.POLIS) {
                    return this.confirmTransBridge(req, res, estimateTx);
                }
                walletType = estimateTx.walletType;
                this.emit(utils_1.PolisEvents.TX_CONFIRM_EVENT, Object.assign({}, { action: 'polis response estimate done' }, estimateTx));
                this.emit(utils_1.PolisEvents.TX_CONFIRM_DIALOG_EVENT, { walletType, action: 'open' });
                const sendTx = estimateTx;
                if (sendTx != undefined && sendTx.act && sendTx.act === 'SIGN') {
                    log_1.default.debug("_bridgeMetamask:", this._bridgeTx);
                    if (sendTx.walletType == 'METAMASK') {
                        let confirmData;
                        if (this._bridgeTx) {
                            const postData = Object.assign(sendTx, { txType: utils_2.TX_TYPE.SEND_TX });
                            confirmData = yield this.polisBridgePage(postData);
                            let savedTx;
                            log_1.default.debug("confirmData:", confirmData);
                            if (typeof (confirmData) == 'object') {
                                try {
                                    savedTx = yield this.saveTx(this.apiHost, this.token ? this.token : "", 'save_app_tx', confirmData, true);
                                    this.emit('debug', Object.assign({}, { action: 'save-tx' }, savedTx));
                                    if (savedTx == null) {
                                        savedTx = {
                                            tx: confirmData,
                                            status: 'SERVER_ERROR',
                                            chainId: estimateTx.chainId,
                                            domain: estimateTx.domain,
                                            data: 'ok',
                                            act: 'CREATE',
                                            value: estimateTx.value,
                                        };
                                        this.emit('warning', Object.assign({}, { action: 'save-tx error' }, confirmData));
                                    }
                                }
                                catch (e) {
                                    log_1.default.warn(e);
                                    this.emit('warning', Object.assign({}, { action: 'save-tx error' }, e));
                                }
                                this.emit('debug', Object.assign({}, { action: 'save-tx surccess' }, savedTx));
                            }
                            res.result = confirmData.trans.txhash;
                        }
                        else {
                            const metaTxHash = yield this.metaMaskSendTransaction(this.chainId, estimateTx);
                            res.result = metaTxHash;
                        }
                    }
                    else if (sendTx.walletType == 'WALLETCONNECT') {
                        const wcTxHash = yield this.walletConnectSendTransaction(this.chainId, estimateTx);
                        res.result = wcTxHash;
                    }
                    else {
                        res.result = '';
                        res.error = erros_2.default.UNKNOW_ERROR;
                    }
                }
                this.emit(utils_1.PolisEvents.TX_CONFIRM_DIALOG_EVENT, { walletType, action: 'close' });
            }
            catch (e) {
                this.emit(utils_1.PolisEvents.TX_CONFIRM_DIALOG_EVENT, { walletType, action: 'close' });
                res.error = e;
                this.emit(utils_1.PolisEvents.ERROR_EVENT, e);
            }
        });
    }
    confirmTransBridge(req, res, estimateTx) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const walletType = this.walletType;
                this.emit(utils_1.PolisEvents.TX_CONFIRM_DIALOG_EVENT, { walletType, action: 'open' });
                let confirmData;
                switch (this.walletType) {
                    case utils_1.WALLET_TYPES.POLIS:
                    case utils_1.WALLET_TYPES.LOCAL:
                        if (this.token) {
                            confirmData = yield this.polisConfirm(estimateTx, this.token, this.confirmUrl);
                        }
                        else {
                            res.error = erros_2.default.TOKEN_IS_EMPTY;
                        }
                        break;
                    case utils_1.WALLET_TYPES.WC:
                    case utils_1.WALLET_TYPES.MM:
                        confirmData = yield this.polisBridgePage(estimateTx);
                        break;
                    default:
                        break;
                }
                if (confirmData.code == 200 && (confirmData.data.act == 'CREATE' || confirmData.data.act == "SUCCESS")) {
                    res.result = confirmData.data.tx;
                }
                else {
                    res.error = confirmData.data.message;
                }
                this.emit(utils_1.PolisEvents.TX_CONFIRM_DIALOG_EVENT, { walletType, action: 'close' });
                if (this.walletType != utils_1.WALLET_TYPES.POLIS && typeof (confirmData) == 'object') {
                    try {
                        let savedTx;
                        savedTx = yield this.saveTx(this.apiHost, this.token ? this.token : "", 'save_app_tx', confirmData.data, true);
                        this.emit('debug', Object.assign({}, { action: 'save-tx' }, savedTx));
                        if (savedTx == null) {
                            this.emit('debug', Object.assign({}, { action: 'save-tx error' }, confirmData));
                        }
                    }
                    catch (e) {
                        log_1.default.warn(e);
                        this.emit('debug', Object.assign({}, { action: 'save-tx error' }, e));
                    }
                }
            }
            catch (e) {
                this.emit(utils_1.PolisEvents.TX_CONFIRM_DIALOG_EVENT, { walletType: this.walletType, action: 'close' });
                res.error = e;
                this.emit(utils_1.PolisEvents.ERROR_EVENT, e);
            }
        });
    }
    signMessage(req, res, walletType) {
        return __awaiter(this, void 0, void 0, function* () {
            let signMsg;
            if (this._bridgeTx || walletType == utils_1.WALLET_TYPES.LOCAL) {
                let postData = {
                    signContent: req.params[0],
                    txType: utils_2.TX_TYPE.SIGN,
                    accessToken: this.token ? this.token : "",
                    walletType: walletType,
                };
                signMsg = yield this.polisBridgePage(postData);
                return signMsg.data;
            }
            if (walletType == "METAMASK") {
                if (!metaMaskWallet_1.default.checkMetaMaskInstall()) {
                    this.emit("error", "metamask not install.");
                    return Promise.reject(erros_1.default.MM_NOT_INSTALL);
                }
                signMsg = yield metaMaskWallet_1.default.signMessage(req.params[0]);
                return signMsg;
            }
            else if (walletType == "WALLETCONNECT") {
            }
            return Promise.reject(erros_1.default.ACCOUNT_NOT_EXIST);
        });
    }
    getChainUrl(chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.post('chainurl', { chainId });
        });
    }
    estimatePolisTrans(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = {
                "Access-Token": this.token,
                "chainId": this.chainId,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            };
            this.emit('debug', Object.assign({}, { action: 'estimatePolisTrans request', 'rpcUrl': this.rpcUrl }, req));
            const response = yield httpRequest_1.default.instance.post(this.rpcUrl, req, { headers });
            this.emit('debug', Object.assign({}, { action: 'estimatePolisTrans response' }, response));
            if (response.status == 200 && response.data.result) {
                return Promise.resolve(response.data.result);
            }
            else {
                return Promise.reject(response.data.error);
            }
        });
    }
    initConfirmWindow(iframeId, transObj, confirmUrl) {
        let confirmWindow = null;
        const handleWindowLoad = function (event) {
            if (event.data && event.data.type && event.data.type === 'windowLoaded') {
                confirmWindow.postMessage(transObj, confirmUrl.split('/#')[0]);
                window.removeEventListener('message', handleWindowLoad, false);
            }
        };
        if (iframeId) {
            document.getElementById(iframeId).onload = function () {
                document.getElementById(iframeId).contentWindow.postMessage(transObj, confirmUrl.split('/#')[0]);
            };
            let swal2Contain = document.querySelector('.swal2-container.full-screen');
            if (swal2Contain) {
                swal2Contain.style.zIndex = '99999999';
                swal2Contain.style.padding = '0px';
                swal2Contain.querySelector('.swal2-html-container').style = "margin:0px;border-radius:5px;";
            }
        }
        else {
            document.getElementById(this._openWindowBtnId).onclick = function () {
                confirmWindow = window.open(confirmUrl);
                window.addEventListener('message', handleWindowLoad, false);
            };
        }
    }
    safariaOpenWindowDom() {
        const fontFamily = 'font-family:Poppins-Regular,Poppins,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen-Sans,Ubuntu,Cantarell,Helvetica Neue,Helvetica,Arial,sans-serif;';
        return `<div style="${fontFamily}padding-top:30px;padding-bottom:20px;">
                    <img
                        class="accept-logo"
                        src="../../assets/images/ic_dark_twirl.png"
                    />
                    <div class="" 
                    style="color:#FFF;font-size: 16px;font-weight: 400;line-height: 22px;">
                        Due to the restriction on iOS. we need <br>
                        your help to open the transaction <br>
                        confirmation screen manually.
                    </div>

                    <div id="${this._openWindowBtnId}" style="
                    width: 180px;
                    height: 48px;
                    background: linear-gradient(92.21deg, #670057 0.19%, #D9016E 107.44%);
                    border-radius: 8px;
                    display: flex; 
                    align-items: center;
                    justify-content: center;margin:auto;margin-top:32px;color:#FFF;cursor:pointer;">OPEN</div>

                    <div id="${this._openWindowBtnId}" style="
                    width: 180px;
                    height: 48px;
                    background: transparent;
                    border: 1px solid #670057;
                    border-radius: 8px;
                    display: flex; 
                    align-items: center;
                    justify-content: center;margin:auto;margin-top:32px;color:#670057;cursor:pointer;">DECLINE</div>
                </div>`;
    }
    checkNeedUserIframe(walletType) {
        return !((0, browser_1.isMobile)() && (0, browser_1.isIOS)() && (walletType === utils_1.WALLET_TYPES.LOCAL));
    }
    polisConfirm(tx, accessToken, confirmUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const useIframe = this.checkNeedUserIframe(tx.walletType);
            const transObj = {
                chainId: tx.chainId,
                from: tx.from,
                to: tx.to,
                value: tx.value,
                data: tx.data,
                gasLimit: tx.gasLimit,
                gasPrice: tx.gasPrice,
                fee: tx.fee,
                feeTxt: tx.feeTxt,
                walletType: tx.walletType,
                txType: tx.txType,
                accessToken: accessToken,
                symbol: tx.symbol,
                act: tx.act,
                blsWalletOpen: tx.blsWalletOpen,
            };
            let width = 700;
            let height = 680;
            if (this.providerOpts.openLink) {
                return this.providerOpts.openLink(confirmUrl, transObj, tx.walletType);
            }
            let dialogOptions = useIframe ? {
                title: '',
                html: `<iframe src="${confirmUrl}" style="width: 100%; height: ${height}px; overflow: scroll" frameborder="0" id="metisConfirmIframe"></iframe>`,
                width: `${width}px`,
            } : {
                html: `${this.safariaOpenWindowDom()}`,
            };
            dialog_1.default.fire(Object.assign(Object.assign({}, dialogOptions), { background: '#151515', showConfirmButton: false, didOpen: (dom) => {
                    this.initConfirmWindow(useIframe ? 'metisConfirmIframe' : '', transObj, confirmUrl);
                }, didClose: () => {
                    window.postMessage({ status: 'ERROR', code: 1000, message: 'CANCEL' }, window.location.origin);
                } }));
            const self = this;
            return new Promise((resolve, reject) => {
                function globalMessage(event) {
                    log_1.default.debug(`event confirm: ${JSON.stringify(event.data)}`);
                    if (event.origin + "/" != self.authHost && event.origin !== window.location.origin) {
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
    polisBridgePage(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const bridgeUrl = this.bridgeUrl;
            if (this.providerOpts.openLink) {
                return this.providerOpts.openLink(bridgeUrl, data, data.walletType);
            }
            const useIframe = this.checkNeedUserIframe(data.walletType);
            let dialogOptions = useIframe ? {
                html: `<iframe src="${bridgeUrl}" style="width: 100vw; height: 100vh;" frameborder="0" id="polisBridgeIframe"></iframe>`,
                padding: '0px',
                width: '100vw',
                background: 'transparent',
                customClass: {
                    container: 'full-screen'
                }
            } : {
                html: `${this.safariaOpenWindowDom()}`,
                background: '#151515',
            };
            dialog_1.default.fire(Object.assign(Object.assign({ title: '' }, dialogOptions), { showConfirmButton: false, didOpen: (dom) => {
                    this.initConfirmWindow(useIframe ? 'polisBridgeIframe' : '', data, bridgeUrl);
                }, didClose: () => {
                    window.postMessage({ status: 'ERROR', code: 1000, message: 'CANCEL' }, window.location.origin);
                } }));
            const self = this;
            return new Promise((resolve, reject) => {
                function globalMessage(event) {
                    if (event.origin !== 'http://localhost:1024' && event.origin + "/" != self.authHost && event.origin !== window.location.origin) {
                        return;
                    }
                    log_1.default.debug(`event confirm: ${JSON.stringify(event.data)}`);
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
    metaMaskSendTransaction(chainId, tx) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.token) {
                return null;
            }
            const chainObj = yield this.getChainUrl(chainId);
            if (!metaMaskWallet_1.default.checkMetaMaskInstall()) {
                this.emit("error", "metamask not install.");
                return Promise.reject(erros_1.default.MM_NOT_INSTALL);
            }
            const res = yield metaMaskWallet_1.default.sendMetaMaskTrans(tx, chainObj);
            let savedTx;
            if (res != null) {
                if (typeof (res) == 'object') {
                    try {
                        savedTx = yield this.saveTx(this.apiHost, this.token, 'save_app_tx', res, true);
                        this.emit('debug', Object.assign({}, { action: 'save-tx' }, savedTx));
                        if (savedTx == null) {
                            savedTx = {
                                tx: res,
                                status: 'SERVER_ERROR',
                                chainId: tx.chainId,
                                domain: tx.domain,
                                data: 'ok',
                                act: 'CREATE',
                                value: tx.value,
                            };
                            this.emit('warning', Object.assign({}, { action: 'save-tx error' }, res));
                            return new Promise((resolve, reject) => {
                                resolve(res.trans.txhash);
                            });
                        }
                    }
                    catch (e) {
                        log_1.default.warn(e);
                        this.emit('warning', Object.assign({}, { action: 'save-tx error' }, e));
                        return Promise.resolve(res.trans.txhash);
                    }
                    this.emit('debug', Object.assign({}, { action: 'save-tx surccess' }, savedTx));
                    return Promise.resolve(res.trans.txhash);
                }
                return new Promise((resolve, reject) => {
                    resolve(res);
                });
            }
            else {
                return Promise.reject(erros_1.default.MM_ERROR);
            }
        });
    }
    walletConnectSendTransaction(chainId, tx) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.token) {
                return Promise.reject(erros_1.default.TOKEN_IS_EMPTY);
            }
            return Promise.reject("unkown error");
        });
    }
    queryPolisTxAsync(chainId, tx, disableTooltip) {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = {
                'Content-Type': 'application/json',
                'Access-Token': this.token,
            };
            yield this.handleRefreshTokenAsync();
            const res = yield httpRequest_1.default.instance.post(this.apiHost + `/api/v1/oauth2/query_tx`, {
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
            }
            return null;
        });
    }
    saveTx(apiHost, accessToken, method, data, disableDialog) {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = {
                'Content-Type': 'application/json',
                'Access-Token': accessToken,
            };
            try {
                const res = yield httpRequest_1.default.instance.post(`${apiHost}api/v1/oauth2/` + method, data, { headers });
                if (res.status === 200 && res.data && res.data.code === 200) {
                    const trans = res.data.data;
                    return Promise.resolve(trans);
                }
                return Promise.reject(res.data);
            }
            catch (e) {
                const result = yield sweetalert2_1.default.fire({
                    html: '<div style=\'text-align: left;\'>The transaction was submitted successfully, but the application is having trouble with tracking the transaction status.</div>',
                    showCancelButton: true,
                    width: 600,
                    confirmButtonText: 'Check again',
                });
                if (result.isConfirmed) {
                    return yield this.saveTx(apiHost, accessToken, method, data, disableDialog);
                }
                return Promise.reject(e);
            }
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
            }
            return Promise.reject(res.data);
        });
    }
    handleRefreshTokenAsync() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this._polisOauth2Client) {
                this.emit("debug", "refresh token");
                const oauthInfo = yield ((_a = this._polisOauth2Client) === null || _a === void 0 ? void 0 : _a.handleRefreshTokenAsync());
                this.providerOpts.token = oauthInfo.accessToken;
            }
        });
    }
    emit(type, ...args) {
        const events = this._events;
        if (type == "error" && events && !events[type]) {
            this.on(type, function (args) {
                log_1.default.error(args);
            });
        }
        return super.emit(type, ...args);
    }
}
exports.PolisProvider = PolisProvider;
