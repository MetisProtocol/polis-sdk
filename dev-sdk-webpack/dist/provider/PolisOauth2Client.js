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
exports.PolisOauth2Client = void 0;
const axios_1 = __importDefault(require("axios"));
const log_1 = __importDefault(require("./utils/log"));
class PolisOauth2Client {
    constructor(apiHost, appId, oauthInfo) {
        this._apiHost = '';
        this._appId = '';
        this._refreshToken = '';
        if (!apiHost.endsWith('/')) {
            this._apiHost = this._apiHost + '/';
        }
        this._appId = appId;
        this._apiHost = apiHost;
        this._authInfo = oauthInfo;
    }
    get apiHost() {
        return this._apiHost;
    }
    get appId() {
        return this._appId;
    }
    get oauthInfo() {
        return this._authInfo;
    }
    refreshToken(callback) {
        var _a;
        axios_1.default.get(this.apiHost + `/api/v1/oauth2/refresh_token?app_id=${this.appId}&refresh_token=${(_a = this._authInfo) === null || _a === void 0 ? void 0 : _a.refreshToken}`)
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
                const errMsg = res.data.msg;
                log_1.default.debug(errMsg);
            }
        });
    }
    refreshTokenAsync() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this._authInfo && this._authInfo.refreshToken) {
                const res = yield axios_1.default.get(this.apiHost + `api/v1/oauth2/refresh_token?app_id=${this.appId}&refresh_token=${(_a = this._authInfo) === null || _a === void 0 ? void 0 : _a.refreshToken}`);
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
            }
            else {
                return Promise.reject("refreshToken is empty");
            }
        });
    }
    handleRefreshTokenAsync() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (new Date().getTime() >= ((_a = this._authInfo) === null || _a === void 0 ? void 0 : _a.expriesAt)) {
                return this.refreshTokenAsync();
            }
            return Promise.resolve(this._authInfo);
        });
    }
}
exports.PolisOauth2Client = PolisOauth2Client;
