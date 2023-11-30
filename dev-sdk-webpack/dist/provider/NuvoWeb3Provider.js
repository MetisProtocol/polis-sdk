"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NuvoSinger = exports.NuvoWeb3Provider = void 0;
const ethers_1 = require("ethers");
const abstract_signer_1 = require("@ethersproject/abstract-signer");
const properties_1 = require("@ethersproject/properties");
const hash_1 = require("@ethersproject/hash");
const bytes_1 = require("@ethersproject/bytes");
const web_1 = require("@ethersproject/web");
const logger_1 = require("@ethersproject/logger");
const _version_1 = require("../_version");
const errorGas = ["call", "estimateGas"];
const logger = new logger_1.Logger(_version_1.version);
const _constructorGuard = {};
function checkError(method, error, params) {
    if (method === "call" && error.code === logger_1.Logger.errors.SERVER_ERROR) {
        const e = error.error;
        if (e && e.message.match("reverted") && (0, bytes_1.isHexString)(e.data)) {
            return e.data;
        }
        logger.throwError("missing revert data in call exception", logger_1.Logger.errors.CALL_EXCEPTION, {
            error, data: "0x"
        });
    }
    let message = error.message;
    if (error.code === logger_1.Logger.errors.SERVER_ERROR && error.error && typeof (error.error.message) === "string") {
        message = error.error.message;
    }
    else if (typeof (error.body) === "string") {
        message = error.body;
    }
    else if (typeof (error.responseText) === "string") {
        message = error.responseText;
    }
    message = (message || "").toLowerCase();
    const transaction = params.transaction || params.signedTransaction;
    if (message.match(/insufficient funds|base fee exceeds gas limit/)) {
        logger.throwError("insufficient funds for intrinsic transaction cost", logger_1.Logger.errors.INSUFFICIENT_FUNDS, {
            error, method, transaction
        });
    }
    if (message.match(/nonce too low/)) {
        logger.throwError("nonce has already been used", logger_1.Logger.errors.NONCE_EXPIRED, {
            error, method, transaction
        });
    }
    if (message.match(/replacement transaction underpriced/)) {
        logger.throwError("replacement fee too low", logger_1.Logger.errors.REPLACEMENT_UNDERPRICED, {
            error, method, transaction
        });
    }
    if (message.match(/only replay-protected/)) {
        logger.throwError("legacy pre-eip-155 transactions not supported", logger_1.Logger.errors.UNSUPPORTED_OPERATION, {
            error, method, transaction
        });
    }
    if (errorGas.indexOf(method) >= 0 && message.match(/gas required exceeds allowance|always failing transaction|execution reverted/)) {
        logger.throwError("cannot estimate gas; transaction may fail or may require manual gas limit", logger_1.Logger.errors.UNPREDICTABLE_GAS_LIMIT, {
            error, method, transaction
        });
    }
    throw error;
}
class NuvoWeb3Provider extends ethers_1.ethers.providers.Web3Provider {
    sendTransaction(signedTransaction) {
        const _super = Object.create(null, {
            sendTransaction: { get: () => super.sendTransaction }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return _super.sendTransaction.call(this, signedTransaction);
        });
    }
    getSigner(addressOrIndex) {
        return new NuvoSinger(_constructorGuard, this, addressOrIndex);
    }
}
exports.NuvoWeb3Provider = NuvoWeb3Provider;
class NuvoSinger extends abstract_signer_1.Signer {
    constructor(constructorGuard, provider, addressOrIndex) {
        logger.checkNew(new.target, ethers_1.ethers.providers.JsonRpcProvider);
        super();
        if (constructorGuard !== _constructorGuard) {
            throw new Error("do not call the JsonRpcSigner constructor directly; use provider.getSigner");
        }
        (0, properties_1.defineReadOnly)(this, "provider", provider);
        if (addressOrIndex == null) {
            addressOrIndex = 0;
        }
        if (typeof (addressOrIndex) === "string") {
            (0, properties_1.defineReadOnly)(this, "_address", this.provider.formatter.address(addressOrIndex));
            (0, properties_1.defineReadOnly)(this, "_index", null);
        }
        else if (typeof (addressOrIndex) === "number") {
            (0, properties_1.defineReadOnly)(this, "_index", addressOrIndex);
            (0, properties_1.defineReadOnly)(this, "_address", null);
        }
        else {
            logger.throwArgumentError("invalid address or index", "addressOrIndex", addressOrIndex);
        }
    }
    connect(provider) {
        return logger.throwError("cannot alter JSON-RPC Signer connection", logger_1.Logger.errors.UNSUPPORTED_OPERATION, {
            operation: "connect"
        });
    }
    getAddress() {
        if (this._address) {
            return Promise.resolve(this._address);
        }
        return this.provider.send("eth_accounts", []).then((accounts) => {
            if (accounts.length <= this._index) {
                logger.throwError("unknown account #" + this._index, logger_1.Logger.errors.UNSUPPORTED_OPERATION, {
                    operation: "getAddress"
                });
            }
            return this.provider.formatter.address(accounts[this._index]);
        });
    }
    sendUncheckedTransaction(transaction) {
        transaction = (0, properties_1.shallowCopy)(transaction);
        const fromAddress = this.getAddress().then((address) => {
            if (address) {
                address = address.toLowerCase();
            }
            return address;
        });
        if (transaction.gasLimit == null) {
            const estimate = (0, properties_1.shallowCopy)(transaction);
            estimate.from = fromAddress;
            transaction.gasLimit = this.provider.estimateGas(estimate);
        }
        if (transaction.to != null) {
            transaction.to = Promise.resolve(transaction.to).then((to) => __awaiter(this, void 0, void 0, function* () {
                if (to == null) {
                    return null;
                }
                const address = yield this.provider.resolveName(to);
                if (address == null) {
                    logger.throwArgumentError("provided ENS name resolves to null", "tx.to", to);
                }
                return address;
            }));
        }
        return (0, properties_1.resolveProperties)({
            tx: (0, properties_1.resolveProperties)(transaction),
            sender: fromAddress
        }).then(({ tx, sender }) => {
            if (tx.from != null) {
                if (tx.from.toLowerCase() !== sender) {
                    logger.throwArgumentError("from address mismatch", "transaction", transaction);
                }
            }
            else {
                tx.from = sender;
            }
            const hexTx = this.provider.constructor.hexlifyTransaction(tx, { from: true });
            return this.provider.send("eth_sendTransaction", [hexTx]).then((hash) => {
                return hash;
            }, (error) => {
                checkError("sendTransaction", error, hexTx);
            });
        });
    }
    signTransaction(transaction) {
        return logger.throwError("signing transactions is unsupported", logger_1.Logger.errors.UNSUPPORTED_OPERATION, {
            operation: "signTransaction"
        });
    }
    sendTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const polisProvider = this.provider.provider;
            const walletType = polisProvider.walletType;
            if (!walletType) {
                const address = yield this.getAddress();
            }
            let hash = "";
            let res = {};
            let req = {
                id: 999,
                'jsonrpc': '2.0',
                method: "eth_sendTransaction",
                params: [transaction]
            };
            yield polisProvider.confirmTrans(req, res);
            if (res.error) {
                throw res.error;
            }
            hash = res.result;
            if (hash) {
                const blockNumber = yield this.provider._getInternalBlockNumber(100 + 2 * this.provider.pollingInterval);
                try {
                    return yield (0, web_1.poll)(() => __awaiter(this, void 0, void 0, function* () {
                        const tx = yield this.provider.getTransaction(hash);
                        if (tx === null) {
                            return undefined;
                        }
                        return this.provider._wrapTransaction(tx, hash, blockNumber);
                    }), { oncePoll: this.provider });
                }
                catch (error) {
                    error.transactionHash = hash;
                    throw error;
                }
            }
        });
    }
    signMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = ((typeof (message) === "string") ? ethers_1.ethers.utils.toUtf8Bytes(message) : message);
            const address = yield this.getAddress();
            return yield this.provider.send("personal_sign", [(0, bytes_1.hexlify)(data), address.toLowerCase()]);
        });
    }
    _legacySignMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = ((typeof (message) === "string") ? ethers_1.ethers.utils.toUtf8Bytes(message) : message);
            const address = yield this.getAddress();
            return yield this.provider.send("eth_sign", [address.toLowerCase(), (0, bytes_1.hexlify)(data)]);
        });
    }
    _signTypedData(domain, types, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const populated = yield hash_1._TypedDataEncoder.resolveNames(domain, types, value, (name) => {
                return this.provider.resolveName(name);
            });
            const address = yield this.getAddress();
            return yield this.provider.send("eth_signTypedData_v4", [
                address.toLowerCase(),
                JSON.stringify(hash_1._TypedDataEncoder.getPayload(populated.domain, types, populated.value))
            ]);
        });
    }
    unlock(password) {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = this.provider;
            const address = yield this.getAddress();
            return provider.send("personal_unlockAccount", [address.toLowerCase(), password, null]);
        });
    }
}
exports.NuvoSinger = NuvoSinger;
