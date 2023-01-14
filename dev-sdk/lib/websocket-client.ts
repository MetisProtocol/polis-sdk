/**
 * <p>
 * middleware websocket client
 * </p>
 *
 * @author Jeff Xiao
 * @since 2021-06-02
 */

import { IWebsocketClient, IOauth2User } from './interfaces';
import Endpoints from './endpoints';
import { io, Socket } from 'socket.io-client';
import Swal from 'sweetalert2';
import { Oauth2Client } from './oauth2-client';
import metamask from "./metamask";

export class WebSocketClient implements IWebsocketClient {
    appId: string;
    accessToken: string;
    refreshToken: string;
    endpoints:Endpoints = new Endpoints();
    server: string = '';
    confirmUrl = this.endpoints.getConfirmUrl();
    socket?: Socket;
    onMessage?: Function;
    onJson?: Function;
    onConnect?: Function;
    onDisconnect?: Function;
    onEmitChain?: Function;
    confirmArray: Array<any> = [];
    oAuth2Client: Oauth2Client;
    swalPromise: any = null;

    constructor(appId: string, accessToken: string, refreshToken: string, expiresIn: number, server?: string, env:string = '') {
        this.endpoints = new Endpoints(env);
        this.server = this.endpoints.getWsServer();
        this.confirmUrl = this.endpoints.getConfirmUrl();
        this.appId = appId;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.oAuth2Client = new Oauth2Client();

        let oauthUser: IOauth2User = {
            appId: appId,
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiresIn: expiresIn,
            expriesAt: new Date().getTime() + (expiresIn - 5) * 1000
        };

        this.oAuth2Client.setUser(oauthUser);

        if (server) {
            this.server = server.indexOf('/wss/mts-l2') > 0 ? server : (server + '/wss/mts-l2');
        }
    }

    log(...obj: any[]): void {
        console.log(obj);
    }

    handleRefreshToken(callback?: Function): void {
        if(new Date().getTime() < this.oAuth2Client.oauth2User?.expriesAt!) {
            if (callback) {
                callback.apply(this);
            }
            return;
        }
        this.oAuth2Client.refreshToken(this.appId, this.oAuth2Client.oauth2User?.refreshToken!, (oauth2User: IOauth2User) => {
            this.accessToken = oauth2User.accessToken;
            this.refreshToken = oauth2User.refreshToken||'';

            if (callback) {
                callback.apply(this);
            }
        })
    }

    connect(onEmitChain: Function, onMessage?: Function, onJson?: Function, onConnect?: Function, onDisconnect?: Function): Boolean {
        if (!this.server || !this.accessToken) {
            return false;
        }
        this.onEmitChain = onEmitChain;
        this.onMessage = onMessage;
        this.onJson = onJson;
        this.onConnect = onConnect;
        this.onDisconnect = onDisconnect;

        if (this.socket && this.socket?.connected) {
            if (this.socket?.io.opts.extraHeaders?.accessToken === this.accessToken) {
                return true;
            }
        }
        this.socket = io(this.server, {
            // path: "",
            forceNew: true,
            reconnectionAttempts: 3,
            timeout: 2000,
            extraHeaders: {
                "Access-Token": this.accessToken
            }
        });

        // let newsocket = this.socket.connect();

        this.socket.on("connect", (...args: any[]) => {
            if (this.onConnect) {
                this.onConnect(args);
            }
        });

        this.socket?.on('connect_failed', () => {
            this.log('socket client connection failed!');
        });

        this.socket?.on('runtime_error', (err) => {            
            this.log('socket client runtime error!', err.msg);
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            })
            
            Toast.fire({
                icon: 'error',
                title: err.msg || 'Some errors occured'
            })
        });

        this.socket?.on('disconnect', (reason: Socket.DisconnectReason) => {
            if (this.onDisconnect) {
                this.onDisconnect(reason);
            }
        });

        this.socket?.on('message', (...args: any[]) => {
            if (this.onMessage) {
                this.onMessage(args);
            }
        });

        this.socket?.on('json', (...args: any[]) => {
            if (this.onJson) {
                this.onJson(args);
            }
        });

        this.socket?.on('block_chain_' + this.accessToken, (...args: any[]) => {
            if (args.length > 0) {
                let trans = args[0];

                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.addEventListener('mouseenter', Swal.stopTimer)
                        toast.addEventListener('mouseleave', Swal.resumeTimer)
                    }
                })

                // {tx: '', chainId: 439, domain: '', act: '', status: 0}
                if (trans.tx && trans.act && trans.act == 'SUCCESS') {
                    // this.disconnect();
                    this.closeMonitor(trans.tx);
                    if (trans.status && trans.status == 'SUCCEED') {
                        // success result
                        this.log('1')
                        
                        Toast.fire({
                            icon: 'success',
                            title: 'Smart contract submit successfully'
                        })
                    }
                    else if (trans.status && trans.status == 'FAILED') {
                        // failed result
                        this.log('0')

                        Toast.fire({
                            icon: 'warning',
                            title: 'Smart contract submit failed'
                        })
                    }
                }
                if (trans.tx && trans.act && trans.act == 'CREATE') {
                    if(trans.tx == '0x00') {
                        this.closeMonitor(trans.tx);

                        Toast.fire({
                            icon: 'success',
                            title: 'Smart contract submit successfully'
                        })
                    }
                    else {
                        // start a 15 seconds monitor
                        setTimeout(()=>{
                            this.monitorTx(trans.domain, trans.chainid, trans.tx, 15);
                        }, 3000);
                    }
                }

                if (trans.act && trans.act == 'SIGN') {
                    // neet to auth from METIS or METAMASK
                    if (trans.wallet && trans.wallet == 'METAMASK') {
                        // TODO
                    }
                    else {
                        // METIS
                        this.beforeConfirm(trans.domain, trans.chainid, trans.contract_address, trans.function, trans.args, trans.gas, trans.gas_price, trans.fee).then((trans) => {
                            if (this.onEmitChain) {
                                this.onEmitChain(trans);
                            }
                        });
                    }
                }
            }
            if (this.onEmitChain) {
                this.onEmitChain(args);
            }
        });

        return true;
    }

    sendTx(domain: string, chainid: number, fun: string, args?: any[]): void {
        if (!this.socket || !this.socket?.connected) {
            this.log('connection lost!');
            return;
        }
        
        this.socket?.emit('tx_send', {
            domain: domain,
            chainid: chainid,
            function: fun,
            args: args
        });        
    }

    monitorTx(domain: string, chainid: number, tx: string, seconds: number): void {
        //query tx
        this.socket?.emit('tx_query', {
            domain: domain,
            chainid: chainid,
            tx: tx
        });
        if (seconds > 0) {
            setTimeout(()=>{
                this.monitorTx(domain, chainid, tx, seconds - 3);
            }, 3000);
        }
        else {
            this.closeMonitor(tx);
        }
    }

    queryTx(chainid: number, tx: string): void {
        //query tx
        this.socket?.emit('tx_query', {
            chainid: chainid,
            tx: tx
        });
    }

    async beforeConfirm(domain: string, chainid: number, address: string, fun: string, args?: any[], gas?: string, gasPrice?: string, fee?: string): Promise<any> {
        
        const transObj = { domain, chainid, address, fun, args, gas, gasPrice, fee, accessToken: this.accessToken};

        setTimeout(() => {
            (document.getElementById('metisConfirmIframe') as HTMLIFrameElement).contentWindow!.postMessage(transObj, this.confirmUrl.split('/#')[0]);
        }, 1000);
        
        Swal.fire({
            title: 'Confirm your submit',
            html: `<iframe src="${this.confirmUrl}" style="width: 100%; height: 480px;" frameborder="0" id="metisConfirmIframe"></iframe>`,
            width: '720px',
            showConfirmButton: false
        });
        
        return new Promise((resolve) => {
            const self = this;

            function globalMessage(event: any) {
                if (event.origin !== "https://rocket.metis.io" && event.origin !== "https://polis.metis.io" && event.origin !== "http://localhost:1024")
                    return;
                if (event.data && event.data.tx) {
                    Swal.close(self.swalPromise);
                    resolve(event.data)
                    window.removeEventListener("message", globalMessage, false);
                }
            }
            
            window.addEventListener("message", globalMessage, false);
        });

        // open a dialog
        // Swal.fire({
        //     title: 'Are you sure?',
        //     html: `You will execute a smart contract<br/> Address: ${address}<br/> Function: ${fun}!`,
        //     icon: 'warning',
        //     showCancelButton: true,
        //     confirmButtonText: 'Yes',
        //     cancelButtonText: 'No'
        //   }).then((result) => {
        //     if (result.isConfirmed) {
        //         this.confirmTx(domain, chainid, fun, args);
        //     } else if (result.dismiss === Swal.DismissReason.cancel) {
        //         this.log('cancel confirm');
        //     }
        //   })
    }
    
    
    closeMonitor(tx: string): void {
        this.removeConfirmMap(tx);

        this.disconnect();

        this.log('stop monitor for tx ' + tx);
    }
    
    removeConfirmMap(tx: string): void {
        let ix = this.confirmArray.indexOf(tx);
        if (ix >= 0) {
            try{
                this.confirmArray.splice(ix, 1);
            }
            catch(x:any){
                this.log(x.message)
            }
        }
    }

    disconnect(): void {
        this.socket?.disconnect();
    }

    closeConfirmDialog() : void {
        Swal.close(this.swalPromise);
    }
}