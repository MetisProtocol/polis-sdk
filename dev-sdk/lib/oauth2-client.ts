/**
 * <p>
 * middleware oauth2 client
 * </p>
 *
 * @author Jeff Xiao
 * @since 2021-06-26
 */

import { IOauth2Client, IOauth2User } from './interfaces';
import endpoints from './endpoints';
import axios from 'axios';
import Swal from 'sweetalert2';
import errData from "./error";

export class Oauth2Client implements IOauth2Client {
    endpoints = new endpoints();
    oauthRedirectUrl: string = this.endpoints.getOauthRedirectUrl();
    apiHost: string = this.endpoints.getApiHost();
    oauth2User?: IOauth2User;
    env = '';

    constructor(env:string = '') {
        this.endpoints = new endpoints(env);
        this.env = env;
        this.oauthRedirectUrl = this.endpoints.getOauthRedirectUrl();
        this.apiHost = this.endpoints.getApiHost();
    }

    startOauth2(appId: string, returnUrl: string, newWindow: boolean = false, switchAccount:boolean = false): Window | null {
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

    logout(appId:string, accessToken:string, refreshToken:string): Promise<any> {
       //  const headers = {
       //      'Content-Type': 'application/json',
       //      'Access-Token': accessToken,
       //  };
       // const res =  axios.get(this.apiHost + `/api/v1/oauth2/logout?app_id=${appId}&token=${accessToken}&refresh_token=${refreshToken}`,{headers});
       // if (res.code == 200) {
       // }
        const logoutUrl = this.apiHost + `/#/oauth2-logout`;
        const hostUrl = this.apiHost;
        const logoutWin = Swal.fire({
            title: '<span style="font-size: 24px;font-weight: bold;color: #FFFFFF;font-family: Helvetica-Bold, Helvetica"></span>',
            html: `<iframe src="${logoutUrl}" style="width: 100%; height: 0px;" frameborder="0" id="metisLogoutIframe"></iframe>`,
            width: '0px',
            showConfirmButton: false,
            backdrop:false,
            background: 'transparent',
            allowOutsideClick:false,
            didOpen: (dom) => {
                document.getElementById('metisLogoutIframe')!.onload = function () {
                    (document.getElementById('metisLogoutIframe') as HTMLIFrameElement).contentWindow!.postMessage({ op:"oauth2logout", appId,accessToken,refreshToken }, hostUrl);
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
                        Swal.close();
                        return resolve({status: 0, msg: event.data.msg});
                    } else {
                        Swal.fire(event.data.msg);
                        return reject({status: errData.MM_ACCOUNT_LOGOUT_ERROR, msg: event.data.msg});
                    }
                }
            }, false);
        });
    }

    setUser(oauth2User: IOauth2User): void {
        this.oauth2User = oauth2User;
    }

    refreshToken(appId: string, refreshToken: string, callback?: Function): void {
        axios.get(this.apiHost + `/api/v1/oauth2/refresh_token?app_id=${appId}&refresh_token=${refreshToken}`)
        .then(res => {
          if (res.status === 200 && res.data && res.data.code === 200) {
            this.oauth2User!.accessToken = res.data.data.access_token;
            this.oauth2User!.expiresIn = res.data.data.expires_in;
            this.oauth2User!.refreshToken = res.data.data.refresh_token;
            this.oauth2User!.expriesAt = new Date().getTime() + (res.data.data.expires_in - 5) * 1000;

            if (callback) {
                callback(this.oauth2User);
            }
          }
          else if (res.status === 200 && res.data) {
            const errMsg = res.data.msg;
            console.log(errMsg);
            // alert(errMsg);
        }});
    }

    async refreshTokenAsync(appId: string, refreshToken: string): Promise<any> {
        const res = await axios.get(this.apiHost + `/api/v1/oauth2/refresh_token?app_id=${appId}&refresh_token=${refreshToken}`);
        
        if (res.status == 200 && res.data && res.data.code == 200) {
            this.oauth2User!.accessToken = res.data.data.access_token;
            this.oauth2User!.expiresIn = res.data.data.expires_in;
            this.oauth2User!.refreshToken = res.data.data.refresh_token;
            this.oauth2User!.expriesAt = new Date().getTime() + (res.data.data.expires_in - 5) * 1000;
        }
        else if (res.status === 200 && res.data) {
            const errMsg = res.data.msg;
            console.log(errMsg);
        }
        if (res.status === 200 && res.data && res.data.code === 200) {
            this.oauth2User!.accessToken = res.data.data.access_token;
            this.oauth2User!.expiresIn = res.data.data.expires_in;
            this.oauth2User!.refreshToken = res.data.data.refresh_token;
            this.oauth2User!.expriesAt = new Date().getTime() + (res.data.data.expires_in - 5) * 1000;
            return this.oauth2User;
        }
        else {
            return  null;
        }
    }

    async getUserInfoAsync(accessToken?: string): Promise<any> {
        const res = await axios.get(this.apiHost + `/api/v1/oauth2/userinfo?access_token=${accessToken||this.oauth2User!.accessToken}`);
        
        if (res.status === 200 && res.data && res.data.code === 200) {
            return res.data.data;
        }
        else if (res.status === 200 && res.data) {
            const errMsg = res.data.msg;
            console.log(errMsg);
        }
        return null;
    }
}