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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTrans = void 0;
const ethers_1 = require("ethers");
const web3_provider_1 = __importDefault(require("@walletconnect/web3-provider"));
const client_1 = __importDefault(require("@walletconnect/client"));
const qrcode_modal_1 = __importDefault(require("@walletconnect/qrcode-modal"));
const erros_1 = __importDefault(require("./erros"));
const log_1 = __importDefault(require("./utils/log"));
function getWalletConnector() {
    const bridge = "https://bridge.walletconnect.org";
    const connector = new client_1.default({
        bridge,
        qrcodeModal: qrcode_modal_1.default,
    });
    if (!connector.connected) {
        connector.createSession();
    }
    subscribeToEvents(connector);
    return connector;
}
function getWalletConnectProvider() {
    return __awaiter(this, void 0, void 0, function* () {
        const wcProvider = new web3_provider_1.default({
            rpc: {
                1: "https://mainnet.infura.io/v3/25ad049ae13a4315b47369b7679dea80",
                4: "https://rinkeby.infura.io/v3/25ad049ae13a4315b47369b7679dea80",
                588: "https://stardust.metis.io/?owner=588",
                599: "https://goerli.gateway.metisdevops.link",
                1088: "https://andromeda.metis.io/?owner=1088"
            },
        });
        try {
            yield wcProvider.enable();
        }
        catch (e) {
            wcProvider.isConnecting = false;
            log_1.default.error(e);
        }
        return wcProvider;
    });
}
function signMessage(connector, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        if (connector.connected) {
            try {
                const address = connector.accounts[0];
                const msgHex = ethers_1.ethers.utils.hexlify(msg);
                const msgParams = [
                    msgHex,
                    address,
                ];
                return connector.signPersonalMessage(msgParams);
            }
            catch (e) {
                return Promise.reject(e.message);
            }
        }
        else {
            return Promise.reject(erros_1.default.WALLET_CONNECT_NOT_LOGIN);
        }
    });
}
function signPersonalMessage(connector, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        if (connector.connected) {
            try {
                const address = connector.accounts[0];
                const msgHex = ethers_1.ethers.utils.toUtf8Bytes(msg);
                return connector.signPersonalMessage([msgHex, address]);
            }
            catch (e) {
                return Promise.reject(e.message);
            }
        }
        else {
            return Promise.reject(erros_1.default.WALLET_CONNECT_NOT_LOGIN);
        }
    });
}
function sendTrans(connector, tx) {
    return __awaiter(this, void 0, void 0, function* () {
        if (connector.connected) {
            const txsign = yield connector.sendTransaction(tx);
            return txsign;
        }
        else {
            return Promise.reject(erros_1.default.WALLET_CONNECT_NOT_LOGIN);
        }
    });
}
exports.sendTrans = sendTrans;
function subscribeToEvents(connector) {
    connector.on("connect", (error, payload) => {
        if (error) {
            throw error;
        }
        const { accounts, chainId } = payload.params[0];
    });
    connector.on("session_update", (error, payload) => {
        if (error) {
            throw error;
        }
        const { accounts, chainId } = payload.params[0];
    });
    connector.on("disconnect", (error, payload) => {
        if (error) {
            throw error;
        }
    });
}
exports.default = { getWalletConnector, getWalletConnectProvider, signMessage, sendTrans };
