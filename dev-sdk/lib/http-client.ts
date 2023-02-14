/**
 * <p>
 * middleware http client
 * </p>
 */

import { IHttpClient, IOauth2User } from './interfaces';
import { Oauth2Client } from './oauth2-client';
import endpoints from './endpoints';
import metamask, { addToken, getMetaAccounts } from './metamask';
import request from './request';

import axios from 'axios';
import Swal from 'sweetalert2';
import dialog from "./provider/utils/dialog";
import log from "./provider/utils/log"
import { BridgeDomainTransactionInfo, DomainTransactionInfo } from "./provider/types";
import { TX_TYPE, sleep, WALLET_TYPES } from "./provider/utils";

export class HttpClient implements IHttpClient {
    appId: string;
    accessToken: string;
    refreshToken: string;
    endpoints: endpoints = new endpoints();
    apiHost = this.endpoints.getApiHost();
    confirmUrl = this.endpoints.getConfirmUrl();
    bridgeUrl = this.endpoints.getBridgeUrl();
    oAuth2Client: Oauth2Client;
    swalPromise: any = null;
    env = '';
    txStatus = '';
    loadingDialog = Swal.mixin({});
    bridgeMetaMask:boolean = true;

    constructor(appId: string, accessToken: string, refreshToken: string, expiresIn: number, apiHost?: string,bridgeMetaMask:boolean=true) {
        this.bridgeMetaMask=bridgeMetaMask;
        this.endpoints = new endpoints(apiHost);
        if (apiHost) {
            this.apiHost = apiHost;
        } else {
            this.apiHost = this.endpoints.getApiHost();
        }
        this.confirmUrl = this.endpoints.getConfirmUrl();
        this.bridgeUrl = this.endpoints.getBridgeUrl();
        this.appId = appId;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.oAuth2Client = new Oauth2Client(apiHost);

        const oauthUser: IOauth2User = {
            appId,
            accessToken,
            refreshToken,
            expiresIn,
            expriesAt: new Date().getTime() + (expiresIn - 5) * 1000,
        };
        this.oAuth2Client.setUser(oauthUser);
    }

    handleRefreshToken(callback?: Function): void {
        // log.debug(new Date().getTime(), this.oAuth2Client.oauth2User?.expriesAt!);

        if (new Date().getTime() < this.oAuth2Client.oauth2User?.expriesAt!) {
            if (callback) {
                callback.apply(this);
            }
            return;
        }
        this.oAuth2Client.refreshToken(this.appId, this.oAuth2Client.oauth2User?.refreshToken!, (oauth2User: IOauth2User) => {
            this.accessToken = oauth2User.accessToken;
            this.refreshToken = oauth2User.refreshToken || '';

            if (callback) {
                callback.apply(this);
            }
        });
    }

    async getBalance(chainId: number, address: string = ''): Promise<any> {
        const headers = {
            'Content-Type': 'application/json',
            'Access-Token': this.accessToken,
        };
        let data: any = {chainId};
        if (address && address.length > 0) {
            data.address = address;
        }
        return this.post('balance', data);
    }

    /*
      {
       fromBlock:0
       toBlock:0
       address:"",
       blockHash:"",
       chainId:0
      }
     */
    async getLogsAsync(data: any): Promise<any> {
        return this.post('get_logs', data);
    }

    async getTxLogsAsync(data: any): Promise<any> {
        return this.post('get_tx_logs', data);
    }

    async post(method: string, data: any, disableTooltip: boolean= false, httpMethod: string = 'post', returnObj:boolean = false): Promise<any> {
        await this.handleRefreshTokenAsync();
        const headers = {
            'Content-Type': 'application/json',
            'Access-Token': this.accessToken,
        };
        let res;
        if (httpMethod === 'post') {
             res = await axios.post(this.apiHost + `/api/v1/oauth2/` + method, data, { headers });
        }else {
            res = await axios.get(this.apiHost + `/api/v1/oauth2/` + method, { headers });
        }
        if (res.status === 200 && res.data && res.data.code === 200) {
            // return res.data.data
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
    }

    async handleRefreshTokenAsync(): Promise<any> {
        if (new Date().getTime() < this.oAuth2Client.oauth2User?.expriesAt!) {
            return null;
        }
        const ret = await this.oAuth2Client.refreshTokenAsync(this.appId, this.oAuth2Client.oauth2User?.refreshToken!);
        if (ret) {
            this.accessToken = ret.accessToken;
            this.refreshToken = ret.refreshToken || '';
        }
        return ret;
    }

    sendTx(domain: string, chainId: number, fun: string, args?: any[], succCallback?: Function, errCallback?: Function, extendParams?:any , disableTooltip:boolean = false): any {
        const headers = {
            'Content-Type': 'application/json',
            'Access-Token': this.accessToken,
        };
        this.handleRefreshToken(() => {
            axios.post(this.apiHost + `/api/v1/oauth2/send_tx`, {
                chainId,
                domain,
                args,
                function: fun,
                extendArgs:extendParams,
            }, {headers})
                .then(res => {
                    if (res.status === 200 && res.data && res.data.code === 200) {
                        if (succCallback) {
                            succCallback(res.data.data);
                        }
                        //   return res.data.data
                        const trans = res.data.data;
                        if (trans.act && trans.act === 'SIGN') {
                            // neet to auth from METIS or METAMASK
                            if (trans.wallet && trans.wallet === 'METAMASK') {
                                this.getChainUrl(trans.chainId).then(chainObj => {
                                    metamask.sendMetaMaskContractTx(trans, chainObj).then(res => {
                                        let savedTx: any;
                                        if (res?.success) {
                                            saveTx(this.apiHost, this.accessToken, 'save_app_tx', res?.data, false)
                                                .then(savedTx => {
                                                    if (savedTx == null) {
                                                        // server save tx error ,also return but status = IN_PROGRESSING because tx had success
                                                        savedTx = {
                                                            tx: res?.data.trans.txhash,
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
                            } else {
                                // METIS
                                this.beforeConfirm(trans);
                            }
                        }

                        if (trans.act && trans.act === 'SUCCESS') {
                            const toast = Swal.mixin({
                                toast: true,
                                position: 'top-end',
                                showConfirmButton: false,
                                timer: 3000,
                                timerProgressBar: true,
                                didOpen: (toast) => {
                                    toast.addEventListener('mouseenter', Swal.stopTimer);
                                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                                },
                            });

                            // trans.result
                            toast.fire({
                                icon: 'success',
                                title: 'Smart contract submit successfully',
                            });
                        }
                    } else if (res.status === 200 && res.data) {
                        const errMsg = res.data.msg;
                        if (!disableTooltip) {
                            error(errMsg);
                        }
                        if (errCallback) {
                            errCallback(errMsg);
                        }
                        // alert(errMsg);
                    }
                })
                // tslint:disable-next-line:ter-arrow-parens
                .catch(err => {
                    if (errCallback) {
                        errCallback(err);
                    }
                });
        });
    }

    async estimateGasAsync(domain: string, chainId: number, fun: string, args?: any[], disableTooltip:boolean = false, extendParams: any = null): Promise<any> {
        const r = new request(!disableTooltip);
        try {
            await this.handleRefreshTokenAsync();
            const headers = {
                'Content-Type': 'application/json',
                'Access-Token': this.accessToken,
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
                error(errMsg);
                return Promise.reject({status: 'ERROR', message: errMsg});
            } else {
                return Promise.reject({status: 'ERROR', message: 'server error:'});
            }
        } catch (e: any) {
            return Promise.reject(e.message);
        }
        return null;
    }

    // @ts-ignore
    async sendTxAsync(domain: string, chainId: number, func: string, args?: any[], disableTooltip:boolean = false, extendParams: any = null): Promise<any> {
        if (!disableTooltip) {
            this.showLoading();
        }
        const r = new request(false);

        try {
            await this.handleRefreshTokenAsync();
            const headers = {
                'Content-Type': 'application/json',
                'Access-Token': this.accessToken,
            };
            const res = await r.instance.post(`${this.apiHost}/api/v1/oauth2/send_tx`, {
                chainId,
                domain,
                args,
                function: func,
                extendParams: extendParams,
            }, {headers})
                .then(function (res: any) {
                    return res;
                }, function (res: any) {
                    return {status: res.status};
                });
            if (res.status === 200 && res.data && res.data.code === 200) {
                //   return res.data.data
                const trans = res.data.data;
                if (trans.act && trans.act === 'SIGN') {
                    // neet to auth from METIS or METAMASK
                    let res: any;
                    //region bridge to polis trans
                    if (this.bridgeMetaMask &&( trans.wallet == WALLET_TYPES.MM || trans.wallet == WALLET_TYPES.WC) ) {
                        const postData = Object.assign(trans, {txType: TX_TYPE.SEND_CON_TX})
                        res = await this.polisBridgePage(postData);
                        return Promise.resolve(res.data);
                    }
                    //endregion
                    
                    if (trans.wallet ===  WALLET_TYPES.MM) {
                        this.txStatus = '';
                        const chainObj = await this.getChainUrl(trans.chainId);
                        res = await metamask.sendMetaMaskContractTx(trans, chainObj, disableTooltip);
                        log.debug('metamak', res);
                        let savedTx: any;
                        if (res?.success) {
                            //region save tx to polis
                            savedTx = await saveTx(this.apiHost, this.accessToken, 'save_app_tx', res?.data, true);
                            if (savedTx == null) {
                                // server save tx error ,also return but status = IN_PROGRESSING because tx had success
                                savedTx = {
                                    tx: res?.data.trans.txhash,
                                    status: 'SERVER_ERROR',
                                    chainId: trans.chainId,
                                    domain: trans.domain,
                                    data: 'ok',
                                    act: 'CREATE',
                                    value: trans.value,
                                };
                                return new Promise<any>((resolve, reject) => {
                                    reject(savedTx);
                                });
                            }
                            //endregion save to to polis
                            
                            //region query tx status
                            while (this.txStatus !== 'SUCCEED' && this.txStatus !== 'FAILED') {
                                await sleep(2000)
                                savedTx = await this.queryTxAsync(chainId, res?.data.trans.txhash, true);
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
                            return new Promise<any>((resolve, reject) => {
                                resolve(savedTx);
                            });
                            //endregion query tx
                        } else {
                            error(res?.data);
                            return Promise.reject(res);
                        }
                        if (res != null && !disableTooltip) {
                            this.closeLoading();
                        }
                        return new Promise<any>((resolve, reject) => reject(res));
                    }
                    else if (trans.wallet == WALLET_TYPES.WC) {
        
                    } else {
                        // METIS
                        return this.beforeConfirm(trans);
                    }
                }
                if (trans.act && trans.act === 'SUCCESS' && !disableTooltip) {
                    const toast = Swal.mixin({
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                        didOpen: (toast: any) => {
                            toast.addEventListener('mouseenter', Swal.stopTimer);
                            toast.addEventListener('mouseleave', Swal.resumeTimer);
                        },
                    });
                    // trans.result
                    toast.fire({
                        icon: 'success',
                        title: 'Smart contract submit successfully',
                    });
                }
                return trans;
            }
            if (res.status === 200 && res.data) {
                const errMsg = res.data.msg;
                if(!disableTooltip){
                    error(errMsg);
                }
                return Promise.reject({status: 'ERROR', message: errMsg});
            } else {
                return Promise.reject({status: 'ERROR', message: 'server error:'});
            }
        } catch (e: any) {
            return Promise.reject(e.message);
        }
        return null;
    }

    private async polisBridgePage(data:any): Promise<any> {
        const bridgeUrl = this.bridgeUrl;
        const postData:BridgeDomainTransactionInfo = {
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
            contractAddress:data.contract_address,
            accessToken:this.accessToken,
            value: data.value,
            symbol: data.symbol,
            to: data.to,
            data: data.data?data.data:'0x',
            act: data.act,
            isMetamask: false,
            isThirdwallet:false,
            nonce: data.nonce,
            chainUrl:'',
            txType: TX_TYPE.SEND_CON_TX,
            sdkVer:1
        };
        log.debug("sdk v1 postdata:",postData);
        const confirmWin =dialog.fire({
            title: '',
            html: `<iframe src="${bridgeUrl}" style="width: 100%; height: 0px;" frameborder="0" id="polisBridgeIframe"></iframe>`,
            width: `0px`,
            showConfirmButton: false,
            background: '#3A1319',
            didOpen: (dom) => {
                document.getElementById('polisBridgeIframe')!.onload = function () {

                    (document.getElementById('polisBridgeIframe') as HTMLIFrameElement).contentWindow!.postMessage(postData, bridgeUrl.split('/#')[0]);
                };
            },
            didClose: () => {
                window.postMessage({status: 'ERROR', code: 1000, message: 'CANCEL'}, window.location.origin);
            },
        });
        const self = this;
        return new Promise((resolve, reject) => {
            function globalMessage(event: any) {
                log.debug(`event confirm: ${JSON.stringify(event.data)}`);
                if (event.origin !== 'https://polis.metis.io'
                    && event.origin !== 'https://polis-test.metis.io'
                    && event.origin !== 'https://test-polis.metis.io'
                    && event.origin !== 'http://localhost:1024'　&& event.origin +"/" != self.apiHost && event.origin !== window.location.origin) {
                    return;
                }
                if (event.data && event.data.status) {
                    if (event.data.status === 'ERROR' || event.data.status === 'DECLINE' || event.data.status === 'FAILED') {
                        reject(event.data);
                    } else {
                        resolve(event.data);
                    }
                    window.removeEventListener('message', globalMessage, false);
                    dialog.close(self.swalPromise);
                }
            }

            window.addEventListener('message', globalMessage, false);
        });
    }

    async beforeConfirm(data:any): Promise<any> {
        // open a dialog
        //region del
        // const transObj = {
        //     domain,
        //     chainId,
        //     from,
        //     address,
        //     func,
        //     args,
        //     gas,
        //     gasPrice,
        //     fee,
        //     wallet,
        //     funcAbiSign,
        //     accessToken: this.accessToken,
        //     value,
        // };
        //endregion
        const postData:BridgeDomainTransactionInfo = {
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
            contractAddress:data.contract_address,
            accessToken:this.accessToken,
            value: data.value,
            symbol: data.symbol,
            to: data.to?data.to:data.contract_address,
            data: data.data,
            act: data.act,
            isMetamask: false,
            isThirdwallet:false,
            nonce: data.nonce,
            chainUrl:'',
            txType: TX_TYPE.SEND_CON_TX,
            sdkVer:1
        };
        log.debug("sdk v1 postdata:",postData);
    
        const confirmUrl = this.confirmUrl;
        Swal.fire({
            title: '<span style="font-size: 24px;font-weight: bold;color: #FFFFFF;font-family: Helvetica-Bold, Helvetica">Request Confirmation</span>',
            html: `<iframe src="${this.confirmUrl}" style="width: 100%; height: 480px;" frameborder="0" id="metisConfirmIframe"></iframe>`,
            width: '720px',
            showConfirmButton: false,
            background: '#3A1319',
            didOpen: (dom) => {
                document.getElementById('metisConfirmIframe')!.onload = function () {
                    (document.getElementById('metisConfirmIframe') as HTMLIFrameElement).contentWindow!.postMessage(postData, confirmUrl.split('/#')[0]);
                };
            },
            didClose: () => {
                window.postMessage({status: 'ERROR', code: 1000, message: 'CANCEL'}, window.location.origin);
            },
        });

        return new Promise((resolve, reject) => {
            const self = this;

            function globalMessage(event: any) {
                if (event.origin !== 'https://polis.metis.io'
                    && event.origin !== 'https://polis-test.metis.io'
                    && event.origin !== 'https://test-polis.metis.io'
                    && event.origin !== 'http://localhost:1024'
                    && event.origin  !== self.apiHost
                    && event.origin !== window.location.origin) {
                    return;
                }
                if (event.data && event.data.status) {
                    if (event.data.status === 'ERROR' || event.data.status === 'DECLINE' || event.data.status === 'FAILED') {
                        reject(event.data);
                    } else {
                        resolve(event.data);
                    }
                    window.removeEventListener('message', globalMessage, false);
                    Swal.close(self.swalPromise);
                }
            }

            window.addEventListener('message', globalMessage, false);
        });
    }

    queryTx(chainId: number, tx: string, succCallback?: Function, errCallback?: Function,extendParams: any = null, disableTooltip: boolean= false): void {
        const headers = {
            'Content-Type': 'application/json',
            'Access-Token': this.accessToken,
        };
        this.handleRefreshToken(() => {
            axios.post(this.apiHost + `/api/v1/oauth2/query_tx`, {
                chainId,
                tx,
                extendParams: extendParams
            }, {headers}).then(res => {
                if (res.status === 200 && res.data && res.data.code == 200) {
                    if (succCallback) {
                        succCallback(res.data.data);
                    }
                    // return res.data.data
                    const trans = res.data.data;
                    if (trans.tx && trans.act && trans.act == 'SUCCESS') {
                        const Toast = Swal.mixin({
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 3000,
                            timerProgressBar: true,
                            didOpen: (toast) => {
                                toast.addEventListener('mouseenter', Swal.stopTimer);
                                toast.addEventListener('mouseleave', Swal.resumeTimer);
                            },
                        });

                        // this.disconnect();
                        if (trans.status && trans.status == 'SUCCEED') {
                            // success result
                            Toast.fire({
                                icon: 'success',
                                title: 'Smart contract submit successfully',
                            });
                        } else if (trans.status && trans.status == 'FAILED') {
                            // failed result
                            Toast.fire({
                                icon: 'warning',
                                title: 'Smart contract submit failed',
                            });
                        }
                    }
                } else if (res.status === 200 && res.data) {
                    const errMsg = res.data.msg;
                    if(!disableTooltip){
                        error(errMsg);
                    }
                    if (errCallback) {
                        errCallback(errMsg);
                    }
                    // alert(errMsg);
                }
            });
        });
    }

    async queryTxAsync(chainId: number, tx: string, disableTooltip?: boolean): Promise<any> {
        const headers = {
            'Content-Type': 'application/json',
            'Access-Token': this.accessToken,
        };
        await this.handleRefreshToken();
        const r = new request(!disableTooltip);
        const res = await r.instance.post(this.apiHost + `/api/v1/oauth2/query_tx`, {
            chainId,
            tx,
        }, {headers});
        if (res.status === 200 && res.data && res.data.code === 200) {
            // return res.data.data
            const trans = res.data.data;
            if (trans.tx && trans.act && trans.act === 'SUCCESS' && !disableTooltip) {
                const toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.addEventListener('mouseenter', Swal.stopTimer);
                        toast.addEventListener('mouseleave', Swal.resumeTimer);
                    },
                });

                // this.disconnect();
                if (trans.status && trans.status === 'SUCCEED') {
                    // success result
                    toast.fire({
                        icon: 'success',
                        title: 'Smart contract submit successfully',
                    });
                } else if (trans.status && trans.status === 'FAILED') {
                    // failed result
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
            if(!disableTooltip){
                error(errMsg);
            }
        }
        return null;

    }

    closeConfirmDialog(): void {
        Swal.close(this.swalPromise);
    }

    async getChainUrl(chainId: string): Promise<any> {
        return await this.post('chainurl', {chainId});
    }

    async addTokenToMM(token:any, tokenAddress:string = '', tokenDecimals:number = 18, tokenImage:string = '' , chainId:number = 0):Promise<any> {
        let chainObj = null;
        let chainNum = chainId;
        if (typeof token === 'object' && !!token['chainId']) {
            chainNum = token['chainId'];
        }
        if (chainNum > 0) {
            try {
                chainObj = await this.getChainUrl(`${chainNum}`);
                chainObj['chainId'] = chainNum;
            }catch (e) {
                chainObj = null;
            }

        }
        return  addToken(token, tokenAddress, tokenDecimals, tokenImage, chainObj);
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
     *        chainId: "1",
     *        contract_address:""
     *     },{
     *        chainId: "2",
     *        contract_address:""
     *     }
     *   ],
     *   abi: "ABI json string"
     * }
     */
    async createDomain(param:any, disableTooltip:boolean= true): Promise<any> {
        return  this.post('domains/create', param, disableTooltip, 'post', true);
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
             return  this.post(`domains/${param.id}/save_chains`, param, disableTooltip, 'post', true);
         }
         if (param.domain) {
             return  this.post(`domains/${param.domain}/save_chains`, param, disableTooltip, 'post', true);
         }
         return Promise.reject('The parameter ID or domain can not be empty');
    }


    /**
     *
     * @param doamin name
     */
    async delDomain(domain:string, disableTooltip:boolean= true):Promise<any> {
        return this.post(`domains/deldomain/${domain}`, null, disableTooltip, 'get', true);
    }

    /**
     *
     * @param param
     * {
     *     method: "",
     *     args: {}
     *     chainId: 4,
     * }
     */
    async providerCall(param:any): Promise<any> {
        return await this.post('eth_call', param);
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
    async createDapp(param:any, disableTooltip:boolean= true): Promise<any> {
        return  this.post('create_applications?access_token='+this.accessToken, param, disableTooltip, 'post', true);
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
    async modifyDapp(param:any, disableTooltip:boolean= true): Promise<any> {
        return  this.post('modify_applications?access_token='+this.accessToken, param, disableTooltip, 'post', true);
    }

    /**
    *
    * @param param
    * {
    *   "ids":[ "612266a85c721ccf35246781","62c2de57f212516098bf814b"] //List of DAPP ids to delete
    * }
    */
    async deleteDapps(param:any, disableTooltip:boolean= true): Promise<any> {
        return  this.post('del_applications?access_token='+this.accessToken, param, disableTooltip, 'post', true);
    }

    /**
     * 
     * @param pageSize
     * @param pageIndex 
     * @returns 
     */
    async getDappList(pageSize: number, pageIndex: number): Promise<any> {
        let method = 'get_applications?'+this.accessToken+"&page_no="+pageIndex+"&page_size="+pageSize;
        return  this.post(method,null,false,'get');
    }

    /**
     * 
     * @param dappId
     * @returns 
     */
    async getDapp(dappId: string): Promise<any> {
        let method = 'get_application?'+this.accessToken+"&id="+dappId;
        return  this.post(method,null,false,'get');
    }

    async applyToDeveloper(): Promise<any> {
        let method = 'dev_request?'+this.accessToken;
        return  this.post(method,null,false,'get');
    }

    showLoading() {
        this.loadingDialog.fire({
            html: 'Processing...',
            didOpen: () => {
                Swal.showLoading();
            },
            allowOutsideClick:false,
        });
    }

    closeLoading() {
        this.loadingDialog.close();
    }
}

function error(msg: any): void {
    log.debug(`msg`,msg);
    let errMsg = msg;
    if (typeof (msg) === 'object' && msg.message) {
        errMsg = msg.message;
    }

    const toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        },
    });

    toast.fire({
        icon: 'error',
        title: errMsg || 'Some errors occured',
    });
}

async function saveTx(apiHost: string, accessToken: string, method: string, data: any, disableDialog: boolean): Promise<any> {

    const headers = {
        'Content-Type': 'application/json',
        'Access-Token': accessToken,
    };
    try {
        const res = await new request(!disableDialog).instance.post(`${apiHost}/api/v1/oauth2/` + method, data, { headers });
        if (res.status === 200 && res.data && res.data.code === 200) {
            // return res.data.data
            const trans = res.data.data;
            return trans;
        }
        if (res.status === 200 && res.data) {
            const result = await Swal.fire({
                html: '<div style=\'text-align: left;\'>The transaction was submitted successfully, but the application is having trouble with tracking the transaction status.</div>',
                showCancelButton: true,
                width: 600,
                confirmButtonText: 'Check again',
            });
            if (result.isConfirmed) {
                return await saveTx(apiHost, accessToken, method, data, disableDialog);
            } else {
                 error(res.data.msg);
            }
        }
    } catch (e) {
        const result = await Swal.fire({
            html: '<div style=\'text-align: left;\'>The transaction was submitted successfully, but the application is having trouble with tracking the transaction status.</div>',
            showCancelButton: true,
            width: 600,
            confirmButtonText: 'Check again',
        });
        if (result.isConfirmed) {
            return await saveTx(apiHost, accessToken, method, data, disableDialog);
        }
        return null;
    }
    return null;
}
