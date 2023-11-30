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
exports.Oauth2Client = void 0;
const endpoints_1 = __importDefault(require("./endpoints"));
const axios_1 = __importDefault(require("axios"));
const sweetalert2_1 = __importDefault(require("sweetalert2"));
const error_1 = __importDefault(require("./error"));
const log_1 = __importDefault(require("./provider/utils/log"));
class Oauth2Client {
    constructor(apiHost = '') {
        this.endpoints = new endpoints_1.default();
        this.oauthRedirectUrl = this.endpoints.getOauthRedirectUrl();
        this.apiHost = this.endpoints.getApiHost();
        this.endpoints = new endpoints_1.default(apiHost);
        this.oauthRedirectUrl = this.endpoints.getOauthRedirectUrl();
        this.apiHost = this.endpoints.getApiHost();
    }
    startOauth2(appId, returnUrl, newWindow = false, switchAccount = false) {
        if (!appId) {
            alert('app id is lost');
            return null;
        }
        if (!returnUrl) {
            alert('return url is lost');
            return null;
        }
        if (newWindow) {
            return window.open(`${this.oauthRedirectUrl}switch_account=${switchAccount}&app_id=${appId}&return_url=${encodeURIComponent(returnUrl)}`);
        }
        window.location.replace(`${this.oauthRedirectUrl}switch_account=${switchAccount}&app_id=${appId}&return_url=${encodeURIComponent(returnUrl)}`);
        return null;
    }
    logout(appId, accessToken, refreshToken) {
        const logoutUrl = this.apiHost + `/#/oauth2-logout`;
        const hostUrl = this.apiHost;
        const logoutWin = sweetalert2_1.default.fire({
            title: '<span style="font-size: 24px;font-weight: bold;color: #FFFFFF;font-family: Helvetica-Bold, Helvetica"></span>',
            html: `<iframe src="${logoutUrl}" style="width: 100%; height: 0px;" frameborder="0" id="metisLogoutIframe"></iframe>`,
            width: '0px',
            showConfirmButton: false,
            backdrop: false,
            background: 'transparent',
            allowOutsideClick: false,
            didOpen: (dom) => {
                document.getElementById('metisLogoutIframe').onload = function () {
                    document.getElementById('metisLogoutIframe').contentWindow.postMessage({ op: "oauth2logout", appId, accessToken, refreshToken }, hostUrl);
                };
            },
        });
        return new Promise((resolve, reject) => {
            window.addEventListener('message', (event) => {
                if (event.origin !== 'https://polis.metis.io' && event.origin !== 'http://localhost:1024' && event.origin !== window.location.origin) {
                    return;
                }
                if (event.data && event.data.op) {
                    if (event.data.logout) {
                        sweetalert2_1.default.close();
                        return resolve({ status: 0, msg: event.data.msg });
                    }
                    else {
                        sweetalert2_1.default.fire(event.data.msg);
                        return reject({ status: error_1.default.MM_ACCOUNT_LOGOUT_ERROR, msg: event.data.msg });
                    }
                }
            }, false);
        });
    }
    setUser(oauth2User) {
        this.oauth2User = oauth2User;
    }
    refreshToken(appId, refreshToken, callback) {
        axios_1.default.get(this.apiHost + `api/v1/oauth2/refresh_token?app_id=${appId}&refresh_token=${refreshToken}`)
            .then(res => {
            if (res.status === 200 && res.data && res.data.code === 200) {
                this.oauth2User.accessToken = res.data.data.access_token;
                this.oauth2User.expiresIn = res.data.data.expires_in;
                this.oauth2User.refreshToken = res.data.data.refresh_token;
                this.oauth2User.expriesAt = new Date().getTime() + (res.data.data.expires_in - 5) * 1000;
                if (callback) {
                    callback(this.oauth2User);
                }
            }
            else if (res.status === 200 && res.data) {
                const errMsg = res.data.msg;
                log_1.default.debug(errMsg);
            }
        });
    }
    refreshTokenAsync(appId, refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield axios_1.default.get(this.apiHost + `api/v1/oauth2/refresh_token?app_id=${appId}&refresh_token=${refreshToken}`);
            if (res.status == 200 && res.data && res.data.code == 200) {
                this.oauth2User.accessToken = res.data.data.access_token;
                this.oauth2User.expiresIn = res.data.data.expires_in;
                this.oauth2User.refreshToken = res.data.data.refresh_token;
                this.oauth2User.expriesAt = new Date().getTime() + (res.data.data.expires_in - 5) * 1000;
            }
            else if (res.status === 200 && res.data) {
                const errMsg = res.data.msg;
                log_1.default.error(errMsg);
            }
            if (res.status === 200 && res.data && res.data.code === 200) {
                this.oauth2User.accessToken = res.data.data.access_token;
                this.oauth2User.expiresIn = res.data.data.expires_in;
                this.oauth2User.refreshToken = res.data.data.refresh_token;
                this.oauth2User.expriesAt = new Date().getTime() + (res.data.data.expires_in - 5) * 1000;
                return this.oauth2User;
            }
            else {
                return null;
            }
        });
    }
    getUserInfoAsync(accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield axios_1.default.get(this.apiHost + `api/v1/oauth2/userinfo?access_token=${accessToken || this.oauth2User.accessToken}`);
            if (res.status === 200 && res.data && res.data.code === 200) {
                return res.data.data;
            }
            else if (res.status === 200 && res.data) {
                const errMsg = res.data.msg;
                log_1.default.error(res.data);
            }
            return null;
        });
    }
}
exports.Oauth2Client = Oauth2Client;
