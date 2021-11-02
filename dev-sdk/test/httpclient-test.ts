import { expect } from 'chai';
import { describe, it } from 'mocha';

import { HttpClient, IHttpClient } from '../lib/index';

describe('Check if httpclient works', () => {
    before(() => {
        let global;
        if (typeof window !== 'undefined') {
            console.log('window is defined');
            global = window;
        }

        function mockStorage() {
            const storage = {};
            return {
                setItem(key: string | number, value: string) {
                    // @ts-ignore
                    storage[key] = value || '';
                },
                getItem(key: any) {
                    // @ts-ignore
                    return storage[key];
                },
                removeItem(key: any) {
                    // @ts-ignore
                    delete storage[key];
                },
                get length() {
                    return Object.keys(storage).length;
                },
                key(i: number) {
                    const keys = Object.keys(storage);
                    return keys[i] || null;
                },
            };
        }

        Object.defineProperty(window, 'localStorage', {
            value: mockStorage,
        });

        Object.defineProperty(window, 'sessionStorage', {
            value: mockStorage,
        });
        // global['localStorage'] = mockStorage();
        // global['sessionStorage'] = mockStorage();
    });

    it('Httpclient should work', () => {
        const appId = '60d0700cb6a45c476e0d2080';
        const accessToken = '85e083449e7b46b4be938035f858e626';
        const refreshToken = '8e78546db5fc43eeaddda10ae29b0c1c';
        const httpclient: IHttpClient = new HttpClient(appId, accessToken, refreshToken, 7200);
        httpclient.sendTx('metis', 1337, 'add', [1, 2]);
        // httpclient.confirmTx('metis', 1337, 'add', [1, 2]);
        // httpclient.queryTx(1337, '0x3417ff3086882bc95e0efa246e21fee1d30bb5f18ed65925d5dc005dbb4e33cd');
    });
});
