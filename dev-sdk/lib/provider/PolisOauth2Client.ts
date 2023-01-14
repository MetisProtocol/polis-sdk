import axios from "axios";
import { IOauth2Info } from "./types";
import log from "./utils/log"

export class PolisOauth2Client {

    _apiHost:string = '';
    private _authInfo?: IOauth2Info;
    _appId:string = '';
    _refreshToken = ''

    constructor(apiHost:string,appId:string,oauthInfo:IOauth2Info) {
        if (!apiHost.endsWith('/')) {
            this._apiHost = this._apiHost + '/'
        }
        this._appId = appId;
        this._apiHost = apiHost;
        this._authInfo = oauthInfo;
    }

    get apiHost(){
        return this._apiHost;
    }

    get appId(){
        return this._appId;
    }

    get oauthInfo() {
        return this._authInfo;
    }

    public refreshToken(callback?: Function): void {
        axios.get(this.apiHost + `/api/v1/oauth2/refresh_token?app_id=${this.appId}&refresh_token=${this._authInfo?.refreshToken}`)
            .then((res: any) => {
                if (res.status === 200 && res.data && res.data.code === 200) {
                    this.oauthInfo!.accessToken = res.data.data.access_token;
                    this.oauthInfo!.expiresIn = res.data.data.expires_in;
                    this.oauthInfo!.refreshToken = res.data.data.refresh_token;
                    this.oauthInfo!.expriesAt = new Date().getTime() + (res.data.data.expires_in - 5) * 1000;

                    if (callback) {
                        callback(this.oauthInfo);
                    }
                } else if (res.status === 200 && res.data) {
                    const errMsg = res.data.msg;
                    log.debug(errMsg);
                }
            });
    }

    public async refreshTokenAsync(): Promise<any> {
        if(this._authInfo && this._authInfo.refreshToken) {
            const res = await axios.get(this.apiHost + `api/v1/oauth2/refresh_token?app_id=${this.appId}&refresh_token=${this._authInfo?.refreshToken}`);

            if (res.status == 200 && res.data && res.data.code == 200) {
                this._authInfo!.accessToken = res.data.data.access_token;
                this._authInfo!.expiresIn = res.data.data.expires_in;
                this._authInfo!.refreshToken = res.data.data.refresh_token;
                this._authInfo!.expriesAt = new Date().getTime() + (res.data.data.expires_in - 5) * 1000;
                return Promise.resolve(this._authInfo);
            } else if (res.status === 200 && res.data) {
                log.error(res.data);
                return Promise.reject(res.data)
            }
        }else{
            return Promise.reject("refreshToken is empty")
        }

    }

    public async handleRefreshTokenAsync() :Promise<any>{
        // this.log(new Date().getTime(), this.oAuth2Client.oauth2User?.expriesAt!);
        if (new Date().getTime() >= this._authInfo?.expriesAt!) {
            return  this.refreshTokenAsync();
        }
        return Promise.resolve(this._authInfo);
    }



}