import { describe, it } from 'mocha';
import { expect } from 'chai';
import 'dotenv/config';
import { ethers } from 'ethers';
import { createPolisEthProvider } from "../lib/provider/createPolisEthProvider";
import { HttpClient,PolisClient } from "../lib";
import { getClient, getToken } from "./utils-test";
import createPolisConnectMiddleware from "../lib/provider/polisConnectMiddleware";
import { IOauth2Info, IPolisClientOpts, IPolisOauth2Opts, IPolisProviderOpts } from "../lib/provider/types";
import { toChecksumAddress } from "../lib/provider/utils";
import EventManager from "../lib/provider/utils/events";
import { PolisProvider } from '../lib/provider/polisProvider';
import SafeEventEmitter from '@metamask/safe-event-emitter'
import { NuvoWeb3Provider } from "../lib/provider/NuvoWeb3Provider";

let httpclient: HttpClient;
let oauthInfo: IOauth2Info;

describe('Check if ethers provider works', function () {
    let ethProvider: ethers.providers.Web3Provider;
    let nuvoProvider:NuvoWeb3Provider;
    let polisprovider: any;
    // const address = '0x507d2C5444Be42A5e7Bd599bc370977515B7353F'
    const address = '0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4';
    let client:PolisClient;
    const apiHost:string = 'http://localhost:1024/'
    const APP_ID = process.env.APP_ID;
    const CHAIN_ID =599;
    console.log("APP_ID:",APP_ID)
    this.timeout(0);
    before(async function () {
        console.log("before")
        oauthInfo = await getToken();
        const clientOps:IPolisClientOpts = {
            chainId: CHAIN_ID,
            appId:APP_ID,
            apiHost :apiHost
        }
        client = new PolisClient(clientOps);
        // client.connectPolis(oauthInfo,);
        httpclient = await getClient();
        const monitor = new SafeEventEmitter();
        const opts: IPolisProviderOpts = {
            apiHost: apiHost,
            token: oauthInfo.accessToken,
            chainId: CHAIN_ID,
        }
        monitor.on('response',
            function (data) {
                console.log('response data:', data)
            })

        // monitor.on('debug',
        //     function (data){
        //         console.log('data:',data)
        //     })
        //
        // console.log(createPolisEthProvider)
        // createPolisMiddleware(opts)
        polisprovider = new PolisProvider(opts)
        // polisprovider.on('debug:eth_sendTransaction', function (data: any) {
        polisprovider.on('debug', function (data: any) {
            console.log('debug data:', data)
        })
        polisprovider.on('tx-confirm', function (data: any) {
            console.log('debug data:', data)
        })
        // polisprovider = createPolisEthProvider(opts)
        ethProvider = new ethers.providers.Web3Provider(polisprovider);
        nuvoProvider = new NuvoWeb3Provider(polisprovider);
    })
    it('test polis-provider account', function (done) {
        ethProvider.getSigner(0).getAddress()
            .then(res => {
                console.log("get accounts(0):", res);
                done();
            })
            .catch(err => {
                done(err)
            });
    })
    it('test polis-provider sendTransaction', async function () {
        // console.log('defaultUrl:',ethProvider.defaultUrl())
        let tx: any = {
            to: address,
            value: ethers.utils.parseEther("0.01"),
            chainId: CHAIN_ID
        }
        // console.log(ethProvider.getSigner())
        const res = await ethProvider.getSigner().sendTransaction(tx);

        console.log("send tx:", res)
        // const r = await res.wait();
        // console.log("sendTransaction:", res);
    })
    it('test polis-client',  function (done) {
        // console.log('defaultUrl:',PolisProvider.defaultUrl())
        let tx: any = {
            to: address,
            value: ethers.utils.parseEther("0.01"),
            chainId: CHAIN_ID
        }
        // console.log("tx:",tx)
        // const provider:ethers.providers.Web3Provider = client.getProvider();
        client.on('debug',function (data){
            console.log("debug",data)
        })
        // client.on('error',function (data){
        //     console.log("error:",data)
        // })

        // client.web3Provider.getBalance(address).then(res=>{
        //     console.log("balance", res)
        // }).catch(err=>{
        //     done(err)
        // })
        // client.web3Provider.getBalance(address).then(res=>{
        //     console.log("getBalance", res)
        // }).catch(err=>{
        //     done(err)
        // })
        client.connect(oauthInfo);
        // console.log(oauthInfo)
        // client.web3Provider.getSigner(0).sendTransaction(tx).then(res=>{
        //     console.log("send tx:", res)
        //     done()
        // }).catch(err=>{
        //     console.log(err)
        //     done(JSON.stringify(err))
        // });
        client.web3Provider.getSigner().signMessage("aaa").then(res=>{
                console.log("signMessage", res)
            }).catch(err=>{
                done(err)
            })


        // const r = await res.wait();
        // console.log("sendTransaction:", res);
    })
    it('test polis-provider DAC',async function (){
        client.on('debug',function (data){
            console.log("debug",data)
        })
        // client.connect(oauthInfo);
        const daiAddress = "0xcCd905d9cE6Fcf9EFe98850FEF319E434AB01FF7";
        const daiAbi = [
           "function createDAC(address[] admins,uint256 threshold ,bytes data) nonpayable returns (address dac,address owner)"
        ]
        // const daiContract2 = new ethers.Contract(daiAddress, daiAbi, client.web3Provider.getSigner());
        const daiContract2 = client.getContract(daiAddress, daiAbi);
        const addresss=['0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4','0xA35f56ebF874Df1B6aC09E72528e1a86D4F1EF2B']

        const result = await daiContract2?.createDAC(addresss,1,0)
    })
    it('test polis-provider getBlockNumber', async function () {
        // try{
        const blockNum = await ethProvider.getBlockNumber();
        console.log('blobckNumber:', blockNum)
        // }
        // catch (e) {
        //     console.log('getBlockNumber err:',e)
        // }
    })
    it('test polis-provider get balance', async function () {
        const balance = await ethProvider.getBalance(address);
        console.log("balance:", balance.toString())
    })
    it('test polis-provider populateTransaction', function (done) {
        let tx: any = {
            to: address,
            value: 1,
            chainId: 4
        }
        ethProvider.getSigner().populateTransaction(tx).then((res: any) => {
            console.log("populateTransaction success", res);
            done()
            // return res;
        }).catch((err: any) => {
            // console.log("populateTransaction err", err);
            done(err)
        });
    })
    it('test polis-provider sign message', function (done) {
        ethProvider.getSigner().signMessage('polis').then(res => {
            done();
        }).catch(err => {
            // console.log("sign message err:", err)
            done(err)
        });
    })
    it.only("test nuvo-json-rpc-provider",async function (done){
        // console.log('defaultUrl:',PolisProvider.defaultUrl())
        let tx: any = {
            to: address,
            value: ethers.utils.parseEther("0.01"),
            chainId: CHAIN_ID
        }
        // console.log("a:",nuvoProvider.getSigner())
        // const res = await nuvoProvider.sendTransaction(tx);
        // console.log("send tx:", res)
        try{
            const signer =  nuvoProvider.getSigner();
            // console.log(signer)
            // console.log(typeof (signer))
            const res2=await signer.sendTransaction(tx);
            console.log("send tx:", res2)
        }catch (e) {
            console.log(e)
        }

        // const r = await res.wait();
        // console.log("sendTransaction:", res);
    })
})


describe('test polis client', function () {
    this.timeout(0)
    it('test', function () {

    })
})