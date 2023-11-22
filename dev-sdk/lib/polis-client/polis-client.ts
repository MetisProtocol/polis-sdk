import {  IOauth2Info, IPolisOauth2Opts, IPolisProviderOpts, IPolisClientOpts } from "../provider/types";
import axios from "axios";
import errors, { makeError, makeRequestError, PolisSdkError } from "../provider/erros";
import { ethers } from "ethers";
import { PolisProvider } from "../provider/polisProvider";
import { PolisOauth2Client } from "../provider/PolisOauth2Client";
import request from "../request";
import { addToken } from "../metamask";
// import wallectConnector from "../provider/wallectConnector";
import log from "../provider/utils/log";
import { WALLET_TYPES } from "../provider/utils";
import { NuvoWeb3Provider } from "../provider/NuvoWeb3Provider";

export class PolisClient {

    private _confirmUrL: string = '';
    private _apiHost: string = '';
    private _oauthHost: string = '';
    private _oauthLoginuRL:   string = ''
    private _appId: string = ''
    private _authInfo?: IOauth2Info;
    private _ethProvider?:ethers.providers.Web3Provider;
    // private _eventManager: EventManager = new EventManager();
    private _chainId:number = -1;
    private _polisprovider?:PolisProvider;
    private _polisOauthClient?:PolisOauth2Client;
    private _useNuvoProvider:boolean = true;

    constructor(opts:IPolisClientOpts) {
        // super();
        if(opts.apiHost){
            this._apiHost = opts.apiHost;
        }
        else{
            this._apiHost ='https://api.nuvosphere.io/'
        }
        if(!!!opts.oauthHost){
            this._oauthHost = this._apiHost.replace("//api.","//oauth.")
        }else{
            this._oauthHost = opts.oauthHost
        }

        console.log("aouth:",this._oauthHost)
        this._useNuvoProvider = opts.useNuvoProvider == undefined?true:opts.useNuvoProvider;
        console.log("_nuvoProvider:",this._useNuvoProvider);
        /**
         * for oauth login
         */
        this._appId = opts.appId;
        this.chainId = opts.chainId
        if (!this._apiHost.endsWith('/')) {
            this._apiHost = this._apiHost + '/'
        }
        if (!!!this._ethProvider){
            this.initProvider({
                apiHost: this.apiHost,
                oauthHost: this.authHost,
                chainId: this.chainId,
                token: this.token,
                debug: opts.debug,
                openLink: opts?.openLink ?? null
                // showLoading:opts.showLoading
            })
        }
        const self = this;
        // this._ethProvider?.getSigner().getAddress().then(function(address){
        //     if(self._polisprovider){
        //         self._polisprovider?.emit('changeAccounts',address)
        //     }
        // })
    }

    // region properties
    get apiHost() {
        return this._apiHost;
    }
    get authHost() {
       return this._oauthHost;
    }

    set apiHost(value) {
        this._apiHost = value;
    }
    get chainId(){
        return this._chainId;
    }
    set chainId(value){
         this._chainId = value;
    }
    get token() {
        return this._authInfo?.accessToken;
    }

    get appId() {
        return this._appId
    }

    get confirmUrl() {
        // return this._confirmUrL;
        return `${this.authHost}#/oauth2/confirm`;
    }

    get oauthLoginUrl() {
        return `${this.authHost}#/oauth2-login?`;
    }

    get oauthInfo() {
        return this._authInfo;
    }

    get web3Provider(){
        if(!!this._ethProvider){
            return this._ethProvider;
        }
        throw errors.PROVIDER_IS_NOT_INIT;
    }

    //endregion

    /**
     * open oauth url,
     * @param opts
     */
    public startOauth2(opts:IPolisOauth2Opts): Window | null {

        if (!!!this.apiHost || this.apiHost.length <= 0) {
            //TODO notice error
        }
        if (!!!opts.appId || opts.appId.length <= 0) {
            //TODO notice error
        }
        if (!!!opts.returnUrl || opts.returnUrl.length <= 0) {
            //TODO notice error
        }
        this._appId = opts.appId;
        
        const loginUrl = `${this.oauthLoginUrl}switch_account=${opts.switchAccount}&app_id=${this.appId}&return_url=${encodeURIComponent(opts.returnUrl)}`;

        window.location.replace(loginUrl);
        
        return null;
    }

    /**
     * connect polis wallet
     * @param IOauth2Info
     */
    async connect(auth?: IOauth2Info|string|any,bridgeTx:boolean=true) {
        let needWcSession = false;
       
        if(auth && auth.accessToken){
            auth.expriesAt = new Date().getTime() + (auth.expiresIn - 5) * 1000;
            this._authInfo = auth
            this._polisOauthClient = new PolisOauth2Client(this.apiHost,this.appId,auth);
            if(!bridgeTx){
                needWcSession =  await this.saveWCSession()
            }
            
            if(this._polisprovider){
               this._polisprovider.connect(auth.accessToken,bridgeTx, needWcSession)
                //if(auth.session){
                await this.initJsonRPCProvider(needWcSession);
            }

        }else if(typeof(auth)=="string"){
            if(this._authInfo){
                this._authInfo.accessToken = auth;
            }else{
                this._authInfo = {
                    appId: this.appId,
                    accessToken: auth,
                    refreshToken: "",
                    expiresIn: 0,
                    expriesAt:0,
                }
            }

            if(this._polisprovider){
                // const needWcSession = false;
                if(!bridgeTx){
                    needWcSession =  await this.saveWCSession()
                }
                this._polisprovider.connect(auth,bridgeTx, needWcSession);
                await this.initJsonRPCProvider(needWcSession);
            }
        }
        else{
            this.emit("error",'auth info is empty');
            return Promise.reject({code:401,message:"auth info is empty"})
        }
    }

    public getContract(contractAddress:string,abi:any){
        if(this._ethProvider!=undefined){
            if(this.token){
                return  new ethers.Contract(contractAddress,abi,this._ethProvider.getSigner())
            }
            else{
                return  new ethers.Contract(contractAddress,abi,this._ethProvider)
            }
        }else{
            this.emit("error","provider init error")
        }
    }

    public async disconnect(): Promise<any> {
        if (!!!this.oauthInfo && !this.token) {
            //TODO logout error notice
            return Promise.reject(errors.TOKEN_IS_EMPTY)
        }
        const logoutUrl = this.apiHost + `#/oauth2-logout`;
        const hostUrl = this.apiHost;
        const appId = this.appId;
        const self = this;
        const token = this._authInfo?.accessToken;
        const refreshToken = this._authInfo?.refreshToken;
        const res = await axios.get(`${this.apiHost}api/v1/oauth2/logout?app_id=${this.appId}&token=${token}&refresh_token=${refreshToken}`)
        if (res.status === 200 && res.data && res.data.code === 200) {
            this._authInfo = undefined;
            return Promise.resolve(res.data.data);
        } else if (res.status === 200 && res.data.code != 200) {
            const errMsg = res.data.msg;
            this.emit('error',res.data.msg)
            return  Promise.reject(errMsg)
        }else{
            this.emit('error',`request url  server error!`)
            return  Promise.reject(res)
        }
        // const logoutWin = dialog.fire({
        //     title: '<span style="font-size: 24px;font-weight: bold;color: #FFFFFF;font-family: Helvetica-Bold, Helvetica"></span>',
        //     html: `<iframe src="${logoutUrl}" style="width: 100%; height: 0px;" frameborder="0" id="metisLogoutIframe"></iframe>`,
        //     width: '0px',
        //     showConfirmButton: false,
        //     backdrop: false,
        //     background: 'transparent',
        //     allowOutsideClick: false,
        //     didOpen: (dom) => {
        //         document.getElementById('metisLogoutIframe')!.onload = function () {
        //             (document.getElementById('metisLogoutIframe') as HTMLIFrameElement).contentWindow!.postMessage(
        //                 {
        //                     op: "oauth2logout",
        //                     appId,
        //                     accessToken: token,
        //                     refreshToken: refreshToken
        //                 },
        //                 hostUrl);
        //         };
        //     },
        // });
        // return new Promise((resolve, reject) => {
        //     window.addEventListener('message', (event) => {
        //         if (event.origin !== 'https://polis.metis.io' &&
        //             event.origin !== 'http://localhost:1024' &&
        //             event.origin !== window.location.origin) {
        //             return;
        //         }
        //         if (event.data && event.data.op) {
        //             if (event.data.logout) {
        //                 dialog.close();
        //                 return resolve({status: 0, msg: event.data.msg});
        //             } else {
        //                 dialog.fire(event.data.msg);
        //                 return reject({status: errData.MM_ACCOUNT_LOGOUT_ERROR, msg: event.data.msg});
        //             }
        //         }
        //     }, false);
        // });
    }

    public refreshToken(callback?: Function): void {
        if (!!!this.oauthInfo || this.oauthInfo.refreshToken=="") {
            //TODO logout error notice
            this._polisprovider?.emit('error',errors.REFRSHTOKEN_IS_EMPTY)
        }
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
                    log.warn(res.data);
                    // alert(errMsg);
                }
            });
    }

    public async refreshTokenAsync(): Promise<any> {
        if (!!!this.oauthInfo) {
            this._polisprovider?.emit('error',errors.TOKEN_IS_EMPTY)
            return Promise.reject(errors.TOKEN_IS_EMPTY)
        }
        const res = await axios.get(this.apiHost + `api/v1/oauth2/refresh_token?app_id=${this.appId}&refresh_token=${this._authInfo?.refreshToken}`);

        if (res.status == 200 && res.data && res.data.code == 200) {
            this._authInfo!.accessToken = res.data.data.access_token;
            this._authInfo!.expiresIn = res.data.data.expires_in;
            this._authInfo!.refreshToken = res.data.data.refresh_token;
            this._authInfo!.expriesAt = new Date().getTime() + (res.data.data.expires_in - 5) * 1000;
            return Promise.resolve(this._authInfo);
        } else if (res.status === 200 && res.data) {
            //TODO request error notice
            log.error(res.data);
            return Promise.reject(res.data)
        }

    }

    /**
     * get user info
     */
    public async getUserInfoAsync(): Promise<any> {
        if (!this.checkOauth()) {
            //TODO no auth notic
            this.emit('error',errors.NO_PERMISSION)
            return Promise.reject(errors.NO_PERMISSION);
        }
        let url = this.apiHost + `api/v1/oauth2/userinfo`
        const res = await axios.get(`${url}?access_token=${this.oauthInfo?.accessToken}`);

        if (res.status === 200 && res.data && res.data.code === 200) {
            return Promise.resolve(res.data.data);
        } else if (res.status === 200 && res.data) {
            const errMsg = res.data.msg;
            this.emit('error',res.data.msg)
            return  Promise.reject(errMsg)
        }else{
            this.emit('error',`request url  server error!`)
            return  Promise.reject(res)
        }
    }

    public changeChain(chainId:number){
        this._polisprovider?.emit(
            'changeChain',
            {chainId}
        )
        if(this._polisprovider)
            this._polisprovider.chainId = chainId;
    }

    public on(event: string, callback: (error: PolisSdkError | null, data: any | null) => void): void {
        // const eventEmitter = {
        //     event,
        //     callback,
        // };
        // this._eventManager.subscribe(eventEmitter);
        this._polisprovider?.on(event,callback);
    }

    public once(event: string, callback: (error: PolisSdkError | null, data: any | null) => void): void {
        // const eventEmitter = {
        //     event,
        //     callback,
        // };
        // this._eventManager.subscribe(eventEmitter);
        this._polisprovider?.once(event,callback);
    }

    public off(event: string,callback:(err:any,data:any)=>void): void {
        // this._eventManager.unsubscribe(event);
        this._polisprovider?.off(event,callback)
    }

    async estimateGasAsync(domain: string, chainId: number, fun: string, args?: any[], disableTooltip:boolean = false, extendParams: any = null): Promise<any> {
        const r = new request(!disableTooltip);
        try {
            await this.handleRefreshTokenAsync();
            const headers = {
                'Content-Type': 'application/json',
                'Access-Token': this.token,
            };
            const res = await r.instance.post(`${this.apiHost}/api/v1/oauth2/send_tx`, {
                chainId,
                domain,
                args,
                estimateGas: true,
                function: fun,
                extendParams: extendParams,
            }, {headers})
            if (res.status === 200 && res.data && res.data.code === 200) {
                //   return res.data.data
                const trans = res.data.data;
                return Promise.resolve(trans);
            } else if (res.status === 200 && res.data) {
                const errMsg = res.data.msg;
                return Promise.reject(makeRequestError(errMsg));
            } else {
                return Promise.reject(makeError(errors.NETWORK_ERROR,res));
            }
        } catch (e: any) {
            return Promise.reject(makeRequestError(e.message));
        }
        return null;
    }

    async getDomain(name: string, chainId: string): Promise<any> {
        return  this.post('domains', { name, chainId });
    }

    /**
     *
     * @param param
     * {
     *   name: "",  // domain name
     *   chains: [
     *     {
     *        chainid: "1",
     *        contract_address:""
     *     },{
     *        chainid: "2",
     *        contract_address:""
     *     }
     *   ],
     *   abi: "ABI json string"
     * }
     */
    async createDomain(param:any, disableTooltip:boolean= true): Promise<any> {
        return  this.post('domains/create', param, 'post',true);
    }

    /**
     *
     * @param param
     * {
     *   id: "",  // domain id
     *   domain:"",
     *   chains: [
     *     {
     *        chainid: "1",
     *        contract_address:""
     *     },{
     *        chainid: "2",
     *        contract_address:""
     *     }
     *   ]
     * }
     */
    async saveDomainChains(param:any, disableTooltip:boolean= true): Promise<any> {
        if (param.id) {
            return  this.post(`domains/${param.id}/save_chains`, param, 'post', true);
        }
        if (param.domain) {
            return  this.post(`domains/${param.domain}/save_chains`, param, 'post', true);
        }
        return Promise.reject('The parameter ID or domain can not be empty');
    }

    /**
     *
     * @param doamin name
     */
    async delDomain(domain:string, disableTooltip:boolean= true):Promise<any> {
        return this.post(`deldomain/${domain}`, null, 'get', true);
    }

    /**
    *
    * @param param
    * {
    * 	"name": "Dapp name* ", 
    * 	"logo":"dapp logo url*", 
    * 	"support_email": "support email* ", 
    * 	"dev_email": "developer email*",
    * 	"dev_name": "developer name*", 
    * 	"home_page_link": "Home page link https://xxxxx", 
    * 	"privacy_policy_link": "Privacy policy link https://xxxxx", 
    * 	"tos_link": "Terms of service link https://xxxxx", 
    * 	"dapp_permission": "1",  // 0 - Read Only, 1-Full Permission
    * 	"domains":["domain1", "domain2"]
    * }
    */
     async createDapp(param:any): Promise<any> {
        return  this.post('create_applications?access_token='+this.token, param, 'post', true);
    }

    /**
    *
    * @param param
    * {
    *   "id":"612265585c721cbd817374a6", // dapp id
    * 	"name": "Dapp name* ", 
    * 	"logo":"dapp logo url*", 
    * 	"support_email": "support email* ", 
    * 	"dev_email": "developer email*",
    * 	"dev_name": "developer name*", 
    * 	"home_page_link": "Home page link https://xxxxx", 
    * 	"privacy_policy_link": "Privacy policy link https://xxxxx", 
    * 	"tos_link": "Terms of service link https://xxxxx", 
    * 	"dapp_permission": "1",  // 0 - Read Only, 1-Full Permission
    * 	"domains":["domain1", "domain2"]
    * }
    */
    async modifyDapp(param:any): Promise<any> {
        return  this.post('modify_applications?access_token='+this.token, param, 'post', true);
    }

    /**
    *
    * @param param
    * {
    *   "ids":[ "612266a85c721ccf35246781","62c2de57f212516098bf814b"] //List of DAPP ids to delete
    * }
    */
    async deleteDapps(param:any): Promise<any> {
        return  this.post('del_applications?access_token='+this.token, param, 'post', true);
    }

    /**
     * 
     * @param pageSize
     * @param pageIndex 
     * @returns 
     */
    async getDappList(pageSize: number, pageIndex: number): Promise<any> {
        let method = 'get_applications?'+this.token+"&page_no="+pageIndex+"&page_size="+pageSize;
        return  this.post(method,null,'get');
    }

    /**
     * 
     * @param dappId
     * @returns 
     */
    async getDapp(dappId: string): Promise<any> {
        let method = 'get_application?'+this.token+"&id="+dappId;
        return  this.post(method,null,'get');
    }

    async applyToDeveloper(): Promise<any> {
        let method = 'dev_request?'+this.token;
        return  this.post(method,null,'get');
    }

    async getChainUrl(chainId: string): Promise<any> {
        return await this.post('chainurl', {chainId});
    }

    async addTokenToMM(token:any, tokenAddress:string = '', tokenDecimals:number = 18, tokenImage:string = '' , chainId:number = 0):Promise<any> {
        let chainObj:any = null;
        let chainNum = chainId;
        if (typeof token === 'object' && !!token['chainId']) {
            chainNum = token['chainId'];
        }
        if (chainNum > 0) {
            try {
                chainObj = await this.getChainUrl(`${chainNum}`);
                if(chainObj){
                  chainObj['chainId'] = chainNum;
                }
            }catch (e) {
                chainObj = null;
            }

        }
        return  addToken(token, tokenAddress, tokenDecimals, tokenImage, chainObj);
    }

    private initProvider(opts: IPolisProviderOpts):void {
        this._polisprovider = new PolisProvider(opts,this._polisOauthClient);
        //　
        this._ethProvider = new ethers.providers.Web3Provider(this._polisprovider,'any');
    }

    private async handleRefreshTokenAsync() :Promise<any>{
        // this.log(new Date().getTime(), this.oAuth2Client.oauth2User?.expriesAt!);
        if (this._authInfo?.expriesAt!>0 && new Date().getTime() >= this._authInfo?.expriesAt! ) {
            return  this.refreshTokenAsync();
        }
        return Promise.resolve(this._authInfo);
    }

    private  async post(method: string, data: any, httpMethod: string = 'post', returnObj:boolean = false): Promise<any> {
        await this.handleRefreshTokenAsync();
        const headers = {
            'Content-Type': 'application/json',
            'Access-Token': this.token,
        };
        let res;
        if (httpMethod === 'post') {
            res = await axios.post(this.apiHost + `api/v1/oauth2/` + method, data, { headers });
        }else {
            res = await axios.get(this.apiHost + `api/v1/oauth2/` + method, { headers });
        }
        if (res.status === 200 && res.data && res.data.code === 200) {
            // return res.data.data
            const result = res.data.data;
            if (returnObj) {
                return Promise.resolve(res.data);
            }
            return Promise.resolve(result);
        }
        if (res.status === 200 && res.data) {
            //TODO error
            const errMsg = res.data.msg;
            this.emit("error",errMsg)
            return Promise.reject(errMsg);
        }
        return Promise.reject(res.data);
    }

    private async request(url:string,data: any, httpMethod: string = 'post',returnObj:boolean = false){
        await this.handleRefreshTokenAsync();
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': this.token,
            'Access-Token': this.token,
        };
        let res;
        if (httpMethod === 'post') {
            res = await axios.post(this.apiHost + url, data, { headers });
        }else {
            res = await axios.get(this.apiHost + url , { headers });
        }
        if (res.status === 200 && res.data && res.data.code === 200) {
            // return res.data.data
            const result = res.data.data;
            if (returnObj) {
                return Promise.resolve(res.data);
            }
            return Promise.resolve(result);
        }
        if (res.status === 200 && res.data) {
            this.emit("error",res.data)
            return Promise.reject(res.data);
        }
        return Promise.reject(res.data);
    }

    private checkOauth() {
        return !!this._authInfo;
    }

    private async saveWCSession(){
        const res = await this.request("api/v1/oauth2/wc_session",null,'get',true);
        if(res.code == 200){
            log.debug("wc_session....res....", res);
            window.localStorage.setItem("walletconnect",res.data.wcSession);
            return res.data.walletType == WALLET_TYPES.WC;
        }
        return false;
    }

    private emit(name:string,obj:any){
        this._polisprovider?.emit(name,obj)
    }

    private async initJsonRPCProvider(wcSession=false){
        if(this._useNuvoProvider){
            if(wcSession){
                // const wcProvider = await wallectConnector.getWalletConnectProvider();
                // this._ethProvider = new NuvoWeb3Provider(wcProvider,'any');
            }else{
                this._ethProvider = new NuvoWeb3Provider(this._polisprovider,'any');
            }
        }else{
            if(wcSession){
                // const wcProvider = await wallectConnector.getWalletConnectProvider();
                // this._ethProvider = new ethers.providers.Web3Provider(wcProvider,'any');
            }else{
                this._ethProvider = new ethers.providers.Web3Provider(this._polisprovider,'any');
            }
        }
    }
}

export default PolisClient