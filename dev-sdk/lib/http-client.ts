/**
 * <p>
 * middleware http client
 * </p>
 */

import { IHttpClient, IOauth2User } from './interfaces';
import { Oauth2Client } from './oauth2-client';
import endpoints from './endpoints';
import metamask, { getMetaAccounts } from './metamask';
import request from './request';

import axios from 'axios';
import Swal from 'sweetalert2';

export class HttpClient implements IHttpClient {
    appId: string;
    accessToken: string;
    refreshToken: string;
    endpoints: endpoints = new endpoints();
    apiHost = this.endpoints.getApiHost();
    confirmUrl = this.endpoints.getConfirmUrl();
    oAuth2Client: Oauth2Client;
    swalPromise: any = null;
    env = '';
    txStatus = '';
    loadingDialog = Swal.mixin({});

    constructor(appId: string, accessToken: string, refreshToken: string, expiresIn: number, apiHost?: string, env: string = '') {
        this.endpoints = new endpoints(env);
        if (apiHost) {
            this.apiHost = apiHost;
        } else {
            this.apiHost = this.endpoints.getApiHost();
        }
        this.confirmUrl = this.endpoints.getConfirmUrl();
        this.appId = appId;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.oAuth2Client = new Oauth2Client(env);

        const oauthUser: IOauth2User = {
            appId,
            accessToken,
            refreshToken,
            expiresIn,
            expriesAt: new Date().getTime() + (expiresIn - 5) * 1000,
        };
        this.oAuth2Client.setUser(oauthUser);
    }

    log(...obj: any[]): void {
        console.log(obj);
    }

    handleRefreshToken(callback?: Function): void {
        this.log(new Date().getTime(), this.oAuth2Client.oauth2User?.expriesAt!);

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

    async getBalance(chainid: number, address: string = ''): Promise<any> {
        const headers = {
            'Content-Type': 'application/json',
            'Access-Token': this.accessToken,
        };
        let data: any = {chainid};
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
       chainid:0
      }
     */
    async getLogsAsync(data: any): Promise<any> {
        return this.post('get_logs', data);
    }

    async getTxLogsAsync(data: any): Promise<any> {
        return this.post('get_tx_logs', data);
    }

    async post(method: string, data: any): Promise<any> {
        await this.handleRefreshTokenAsync();
        const headers = {
            'Content-Type': 'application/json',
            'Access-Token': this.accessToken,
        };
        const res = await axios.post(this.apiHost + `/api/v1/oauth2/` + method, data, {headers});

        if (res.status === 200 && res.data && res.data.code === 200) {
            // return res.data.data
            const trans = res.data.data;
            return Promise.resolve(trans);
        }
        if (res.status === 200 && res.data) {
            const errMsg = res.data.msg;
            error(errMsg);
        }
        return Promise.reject(res.data);
    }

    async handleRefreshTokenAsync(): Promise<any> {
        // this.log(new Date().getTime(), this.oAuth2Client.oauth2User?.expriesAt!);

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

    sendTx(domain: string, chainid: number, fun: string, args?: any[], succCallback?: Function, errCallback?: Function, extendParams:any = null): any {
        const headers = {
            'Content-Type': 'application/json',
            'Access-Token': this.accessToken,
        };
        this.handleRefreshToken(() => {
            axios.post(this.apiHost + `/api/v1/oauth2/send_tx`, {
                chainid,
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
                                this.getChainUrl(trans.chainid).then(chainObj => {
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
                                                            chainid: trans.chainid,
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
                                this.beforeConfirm(trans.domain, trans.chainid, trans.eth_address, trans.contract_address, trans.function, trans.args, trans.gas, trans.gas_price, trans.fee, trans.wallet, trans.func_abi_sign, trans.value);
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
                        error(errMsg);
                        if (errCallback) {
                            errCallback(errMsg);
                        }
                        // alert(errMsg);
                    }
                });
        });
    }

    async estimateGasAsync(domain: string, chainid: number, fun: string, args?: any[], disableTooltip:boolean = false, extendParams: any = null): Promise<any> {
        const r = new request(!disableTooltip);
        try {
            await this.handleRefreshTokenAsync();
            const headers = {
                'Content-Type': 'application/json',
                'Access-Token': this.accessToken,
            };
            const res = await r.instance.post(`${this.apiHost}/api/v1/oauth2/send_tx`, {
                chainid,
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
    async sendTxAsync(domain: string, chainid: number, fun: string, args?: any[], disableTooltip:boolean = false, extendParams: any = null): Promise<any> {
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
                chainid,
                domain,
                args,
                function: fun,
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
                    if (trans.wallet === 'METAMASK') {
                        this.txStatus = '';
                        const chainObj = await this.getChainUrl(trans.chainid);

                        const res = await metamask.sendMetaMaskContractTx(trans, chainObj);
                        console.log('metamak', res);
                        let savedTx: any;
                        if (res?.success) {
                            savedTx = await saveTx(this.apiHost, this.accessToken, 'save_app_tx', res?.data, true);
                            if (savedTx == null) {
                                // server save tx error ,also return but status = IN_PROGRESSING because tx had success
                                savedTx = {
                                    tx: res?.data.trans.txhash,
                                    status: 'SERVER_ERROR',
                                    chainid: trans.chainid,
                                    domain: trans.domain,
                                    data: 'ok',
                                    act: 'CREATE',
                                    value: trans.value,
                                };
                                return new Promise<any>((resolve, reject) => {
                                    reject(savedTx);
                                });
                            }
                            while (this.txStatus !== 'SUCCEED' && this.txStatus !== 'FAILED') {
                                await new Promise(resolve => {
                                    setTimeout(resolve, 2000);
                                });
                                savedTx = await this.queryTxAsync(chainid, res?.data.trans.txhash, true);
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
                        }
                        else {
                            error(res?.data);
                            return Promise.reject(res);
                        }
                        if (res != null && !disableTooltip) {
                            this.closeLoading();
                        }
                        return new Promise<any>((resolve, reject) => reject(res));
                    }
                    // METIS
                    return this.beforeConfirm(trans.domain, trans.chainid, trans.eth_address, trans.contract_address, trans.function, trans.args, trans.gas, trans.gas_price, trans.fee, trans.wallet, trans.func_abi_sign, trans.value);
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

    async beforeConfirm(domain: string, chainid: number, from: string, address: string, fun: string, args?: any[], gas?: string, gasPrice?: string, fee?: string, wallet?: string, funcAbiSign?: string, value?: string): Promise<any> {
        // open a dialog
        const transObj = {
            domain,
            chainid,
            from,
            address,
            fun,
            args,
            gas,
            gasPrice,
            fee,
            wallet,
            funcAbiSign,
            accessToken: this.accessToken,
            // tslint:disable-next-line:object-shorthand-properties-first
            value,
        };
        const confirmUrl = this.confirmUrl;
        Swal.fire({
            title: '<span style="font-size: 24px;font-weight: bold;color: #FFFFFF;font-family: Helvetica-Bold, Helvetica">Confirming your Submission</span>',
            html: `<iframe src="${this.confirmUrl}" style="width: 100%; height: 480px;" frameborder="0" id="metisConfirmIframe"></iframe>`,
            width: '720px',
            showConfirmButton: false,
            background: '#00004D',
            didOpen: (dom) => {
                document.getElementById('metisConfirmIframe')!.onload = function () {
                    (document.getElementById('metisConfirmIframe') as HTMLIFrameElement).contentWindow!.postMessage(transObj, confirmUrl.split('/#')[0]);
                };
            },
            didClose: () => {
                window.postMessage({status: 'ERROR', code: 1000, message: 'CANCEL'}, window.location.origin);
            },
        });

        return new Promise((resolve, reject) => {
            const self = this;

            function globalMessage(event: any) {
                // console.log(`event confirm: ${JSON.stringify(event.data)}`);
                if (event.origin !== 'https://polis.metis.io' && event.origin !== 'http://localhost:1024' && event.origin !== window.location.origin) {
                    return;
                }
                if (event.data && event.data.status) {
                    if (event.data.status === 'ERROR' || event.data.status === 'DECLINE' || event.data.status === 'FAIED') {
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

    queryTx(chainid: number, tx: string, succCallback?: Function, errCallback?: Function,extendParams: any = null): void {
        const headers = {
            'Content-Type': 'application/json',
            'Access-Token': this.accessToken,
        };
        this.handleRefreshToken(() => {
            axios.post(this.apiHost + `/api/v1/oauth2/query_tx`, {
                chainid,
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
                            this.log('1');

                            Toast.fire({
                                icon: 'success',
                                title: 'Smart contract submit successfully',
                            });
                        } else if (trans.status && trans.status == 'FAIED') {
                            // failed result
                            this.log('0');

                            Toast.fire({
                                icon: 'warning',
                                title: 'Smart contract submit failed',
                            });
                        }
                    }
                } else if (res.status === 200 && res.data) {
                    const errMsg = res.data.msg;
                    error(errMsg);
                    if (errCallback) {
                        errCallback(errMsg);
                    }
                    // alert(errMsg);
                }
            });
        });
    }

    async queryTxAsync(chainid: number, tx: string, disableTooltip?: boolean): Promise<any> {
        const headers = {
            'Content-Type': 'application/json',
            'Access-Token': this.accessToken,
        };
        await this.handleRefreshToken();
        const r = new request(!disableTooltip);
        const res = await r.instance.post(this.apiHost + `/api/v1/oauth2/query_tx`, {
            chainid,
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
                } else if (trans.status && trans.status === 'FAIED') {
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
            error(errMsg);
        }
        return null;

    }

    closeConfirmDialog(): void {
        Swal.close(this.swalPromise);
    }

    async getChainUrl(chainid: string): Promise<any> {
        return await this.post('chainurl', {chainid});
    }

    async getDomain(name: string, chainid: string): Promise<any> {
        return await this.post('domains', {name, chainid});
    }

    /**
     *
     * @param param
     * {
     *     method: "",
     *     args: {}
     *     chainid: 4,
     * }
     */
    async providerCall(param:any): Promise<any> {
        return await this.post('eth_call', param);
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
    console.log(`msg:${msg}`);
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
        const res = await new request(!disableDialog).instance.post(`${apiHost}/api/v1/oauth2/` + method, data, {headers});
        if (res.status === 200 && res.data && res.data.code === 200) {
            // return res.data.data
            const trans = res.data.data;
            return trans;
        }
        if (res.status === 200 && res.data) {
            error(res.data.msg);
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
