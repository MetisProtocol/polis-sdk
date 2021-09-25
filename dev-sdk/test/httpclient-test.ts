import { expect } from 'chai';
import { describe, it } from 'mocha';

import { HttpClient, IHttpClient } from '../lib/index';

describe('Check if httpclient works', () => {
    before(()=>{

    })

    it('Httpclient should work', () => {
        const appId = '60d0700cb6a45c476e0d2080';
        const accessToken = '85e083449e7b46b4be938035f858e626';
        const refreshToken = '8e78546db5fc43eeaddda10ae29b0c1c';
        let httpclient: IHttpClient = new HttpClient(appId, accessToken, refreshToken, 7200);
        httpclient.sendTx('metis', 1337, 'add', [1, 2]);
        // httpclient.confirmTx('metis', 1337, 'add', [1, 2]);
        // httpclient.queryTx(1337, '0x3417ff3086882bc95e0efa246e21fee1d30bb5f18ed65925d5dc005dbb4e33cd');
    });
  });