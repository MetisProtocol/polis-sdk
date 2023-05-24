import { expect } from 'chai';
import { describe, it } from 'mocha';
import 'dotenv/config';
import { getClient } from "./utils-test";
import { HttpClient } from "../lib";
let httpclient:HttpClient;

describe('Check if httpclient works', async () => {
    before(async () => {
        httpclient = await getClient();
        let global;
        if (typeof window !== 'undefined') {
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
    it('Httpclient should work', async () => {

        httpclient.sendTx('metis', 1337, 'add', [1, 2],  (res:any) => {
            console.log(res);
            expect(res.code, "200");
        },  (err:any) => {
            console.log('err:', err);
        },  null, true);
    });

    it('domain test', async () => {
        const name:string = 'test-add';
        const domain = {
            name,
            chains: [
                {
                    chainid: '1',
                    contract_address:'0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4',
                },
                {
                    chainid: '2',
                    contract_address:'0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4',
                },
            ],
            abi: '{"a":"1"}',
        };
        let res = await httpclient.createDomain(domain);
        expect(res.code).to.equal(200);
        res = await httpclient.delDomain(name);
        expect(res.code).to.equal(200);
    });
});
