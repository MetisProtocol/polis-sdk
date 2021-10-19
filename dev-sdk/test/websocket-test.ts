import { expect } from 'chai';
import { describe, it } from 'mocha';

import { WebSocketClient, IWebsocketClient } from '../lib/index';

describe('Check if websocket works', () => {
    before(()=>{

    })

    it('Instance should be connected', () => {
        const appId = '60d0700cb6a45c476e0d2080';
        const accessToken = '85e083449e7b46b4be938035f858e626';
        const refreshToken = '8e78546db5fc43eeaddda10ae29b0c1c';
        let websocket: IWebsocketClient = new WebSocketClient(appId, accessToken, refreshToken);
        let isInit = websocket.connect((...args:any[])=>{
            // console.log('emit', args, args.length);
            let trans = args[0];

        }, (...args:any[]) => {
            //message
        }, (...args:any[]) => {
            //json
        }, (...args:any[])=>{
            //connect
            console.log('connected ~', args);
            // websocket.sendTx('metis', 1337);
            // websocket.confirmTx('metis', 1337, 'add', [1, 2]);
            // websocket.queryTx(1337, '0x3417ff3086882bc95e0efa246e21fee1d30bb5f18ed65925d5dc005dbb4e33cd');
            websocket.oAuth2Client.refreshToken(appId, refreshToken)

        }, ()=>{
            //disconnect
            console.log('disconnect !');
        });

        console.log('init result', isInit);
        expect(isInit).true;
    });
  });