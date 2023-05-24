import { ethers } from "ethers";
import { Signer, TypedDataDomain, TypedDataField, TypedDataSigner } from "@ethersproject/abstract-signer";

import {Provider,TransactionResponse,TransactionRequest } from "@ethersproject/abstract-provider"
import { checkProperties, deepCopy, Deferrable, defineReadOnly, getStatic, resolveProperties, shallowCopy } from "@ethersproject/properties";
import { _TypedDataEncoder } from "@ethersproject/hash";
import { Bytes, hexlify, hexValue, isHexString } from "@ethersproject/bytes";
import { ConnectionInfo, fetchJson, poll } from "@ethersproject/web";

import { Logger } from "@ethersproject/logger";
import { version } from "../_version";
import { TX_TYPE, WALLET_TYPES } from "./utils";
import log from "./utils/log";

const errorGas = [ "call", "estimateGas" ];

const logger = new Logger(version);

const _constructorGuard = {};

function checkError(method: string, error: any, params: any): any {
    // Undo the "convenience" some nodes are attempting to prevent backwards
    // incompatibility; maybe for v6 consider forwarding reverts as errors
    if (method === "call" && error.code === Logger.errors.SERVER_ERROR) {
        const e = error.error;
        if (e && e.message.match("reverted") && isHexString(e.data)) {
            return e.data;
        }

        logger.throwError("missing revert data in call exception", Logger.errors.CALL_EXCEPTION, {
            error, data: "0x"
        });
    }

    let message = error.message;
    if (error.code === Logger.errors.SERVER_ERROR && error.error && typeof(error.error.message) === "string") {
        message = error.error.message;
    } else if (typeof(error.body) === "string") {
        message = error.body;
    } else if (typeof(error.responseText) === "string") {
        message = error.responseText;
    }
    message = (message || "").toLowerCase();

    const transaction = params.transaction || params.signedTransaction;

    // "insufficient funds for gas * price + value + cost(data)"
    if (message.match(/insufficient funds|base fee exceeds gas limit/)) {
        logger.throwError("insufficient funds for intrinsic transaction cost", Logger.errors.INSUFFICIENT_FUNDS, {
            error, method, transaction
        });
    }

    // "nonce too low"
    if (message.match(/nonce too low/)) {
        logger.throwError("nonce has already been used", Logger.errors.NONCE_EXPIRED, {
            error, method, transaction
        });
    }

    // "replacement transaction underpriced"
    if (message.match(/replacement transaction underpriced/)) {
        logger.throwError("replacement fee too low", Logger.errors.REPLACEMENT_UNDERPRICED, {
            error, method, transaction
        });
    }

    // "replacement transaction underpriced"
    if (message.match(/only replay-protected/)) {
        logger.throwError("legacy pre-eip-155 transactions not supported", Logger.errors.UNSUPPORTED_OPERATION, {
            error, method, transaction
        });
    }

    if (errorGas.indexOf(method) >= 0 && message.match(/gas required exceeds allowance|always failing transaction|execution reverted/)) {
        logger.throwError("cannot estimate gas; transaction may fail or may require manual gas limit", Logger.errors.UNPREDICTABLE_GAS_LIMIT, {
            error, method, transaction
        });
    }

    throw error;
}


export class NuvoWeb3Provider extends  ethers.providers.Web3Provider {

    async sendTransaction(signedTransaction: string | Promise<string>): Promise<TransactionResponse> {

        return super.sendTransaction(signedTransaction)
    }

    getSigner(addressOrIndex?: string | number):ethers.providers.JsonRpcSigner {
        return new NuvoSinger(_constructorGuard, this, addressOrIndex) as ethers.providers.JsonRpcSigner;
    }
}

export class NuvoSinger  extends Signer implements TypedDataSigner {

    // @ts-ignore
    readonly provider: ethers.providers.JsonRpcProvider ;
    _index: number;
    _address: string;

    constructor(constructorGuard: any, provider: NuvoWeb3Provider, addressOrIndex?: string | number) {
        logger.checkNew(new.target, ethers.providers.JsonRpcProvider);

        super();

        if (constructorGuard !== _constructorGuard) {
            throw new Error("do not call the JsonRpcSigner constructor directly; use provider.getSigner");
        }

        defineReadOnly(this, "provider", provider);

        if (addressOrIndex == null) { addressOrIndex = 0; }

        if (typeof(addressOrIndex) === "string") {
            defineReadOnly(this, "_address", this.provider.formatter.address(addressOrIndex));
            defineReadOnly(this, "_index", null);

        } else if (typeof(addressOrIndex) === "number") {
            defineReadOnly(this, "_index", addressOrIndex);
            defineReadOnly(this, "_address", null);

        } else {
            logger.throwArgumentError("invalid address or index", "addressOrIndex", addressOrIndex);
        }
    }

    connect(provider: Provider): NuvoSinger {
        return logger.throwError("cannot alter JSON-RPC Signer connection", Logger.errors.UNSUPPORTED_OPERATION, {
            operation: "connect"
        });
    }

    getAddress(): Promise<string> {
        if (this._address) {
            return Promise.resolve(this._address);
        }

        return this.provider.send("eth_accounts", []).then((accounts) => {
            if (accounts.length <= this._index) {
                logger.throwError("unknown account #" + this._index, Logger.errors.UNSUPPORTED_OPERATION, {
                    operation: "getAddress"
                });
            }
            return this.provider.formatter.address(accounts[this._index])
        });
    }

    sendUncheckedTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
        transaction = shallowCopy(transaction);

        const fromAddress = this.getAddress().then((address) => {
            if (address) { address = address.toLowerCase(); }
            return address;
        });

        // The JSON-RPC for eth_sendTransaction uses 90000 gas; if the user
        // wishes to use this, it is easy to specify explicitly, otherwise
        // we look it up for them.
        if (transaction.gasLimit == null) {
            const estimate = shallowCopy(transaction);
            estimate.from = fromAddress;
            transaction.gasLimit = this.provider.estimateGas(estimate);
        }

        if (transaction.to != null) {
            transaction.to = Promise.resolve(transaction.to).then(async (to) => {
                if (to == null) { return null; }
                const address = await this.provider.resolveName(to);
                if (address == null) {
                    logger.throwArgumentError("provided ENS name resolves to null", "tx.to", to);
                }
                return address;
            });
        }

        return resolveProperties({
            tx: resolveProperties(transaction),
            sender: fromAddress
        }).then(({ tx, sender }) => {

            if (tx.from != null) {
                if (tx.from.toLowerCase() !== sender) {
                    logger.throwArgumentError("from address mismatch", "transaction", transaction);
                }
            } else {
                tx.from = sender;
            }

            const hexTx = (<any>this.provider.constructor).hexlifyTransaction(tx, { from: true });

            return this.provider.send("eth_sendTransaction", [ hexTx ]).then((hash) => {
                return hash;
            }, (error) => {
                checkError("sendTransaction", error, hexTx);
            });
        });
    }

    signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
        return logger.throwError("signing transactions is unsupported", Logger.errors.UNSUPPORTED_OPERATION, {
            operation: "signTransaction"
        });
    }

    async sendTransaction(transaction: Deferrable<TransactionRequest>): Promise<TransactionResponse> {
        // @ts-ignore
        const polisProvider = this.provider.provider;

        const walletType = polisProvider.walletType;
        if(!walletType){
            const address = await this.getAddress();
        }
        let hash = "";
        let res:any = {}
        let req = {
            id:999,
            'jsonrpc': '2.0',
            method: "eth_sendTransaction",
            params: [transaction]
        }

        await polisProvider.confirmTrans(req,res);
        if(res.error){
            throw res.error;
        }
        hash = res.result;
        // switch (walletType) {
        //     case WALLET_TYPES.MM:
        //         let res:any = {}
        //         let req = {
        //             id:999,
        //             'jsonrpc': '2.0',
        //             method: "eth_sendTransaction",
        //             params: [transaction]
        //         }
        //
        //         await polisProvider.confirmTrans(req,res);
        //         if(res.error){
        //             throw res.error;
        //         }
        //         hash = res.result;
        //         break
        //     default:
        //         // Send the transaction
        //         hash = await this.sendUncheckedTransaction(transaction);
        // }
        if(hash){
            // This cannot be mined any earlier than any recent block
            const blockNumber = await this.provider._getInternalBlockNumber(100 + 2 * this.provider.pollingInterval);

            try {
                // Unfortunately, JSON-RPC only provides and opaque transaction hash
                // for a response, and we need the actual transaction, so we poll
                // for it; it should show up very quickly
                return await poll(async () => {
                    const tx = await this.provider.getTransaction(hash);
                    if (tx === null) { return undefined; }
                    return this.provider._wrapTransaction(tx, hash, blockNumber);
                }, { oncePoll: this.provider });
            } catch (error) {
                (<any>error).transactionHash = hash;
                throw error;
            }
        }

    }

    async signMessage(message: Bytes | string): Promise<string> {
        const data = ((typeof(message) === "string") ? ethers.utils.toUtf8Bytes(message): message);
        const address = await this.getAddress();

        return await this.provider.send("personal_sign", [ hexlify(data), address.toLowerCase() ]);

    }

    async _legacySignMessage(message: Bytes | string): Promise<string> {
        const data = ((typeof(message) === "string") ? ethers.utils.toUtf8Bytes(message): message);
        const address = await this.getAddress();

        // https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign
        return await this.provider.send("eth_sign", [ address.toLowerCase(), hexlify(data) ]);
    }

    async _signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string> {
        // Populate any ENS names (in-place)
        const populated = await _TypedDataEncoder.resolveNames(domain, types, value, (name: string) => {
            return this.provider.resolveName(name);
        });

        const address = await this.getAddress();

        return await this.provider.send("eth_signTypedData_v4", [
            address.toLowerCase(),
            JSON.stringify(_TypedDataEncoder.getPayload(populated.domain, types, populated.value))
        ]);
    }

    async unlock(password: string): Promise<boolean> {
        const provider = this.provider;

        const address = await this.getAddress();

        return provider.send("personal_unlockAccount", [ address.toLowerCase(), password, null ]);
    }

}
