"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInfuraRpcUrl = exports.logDeprecationWarning = exports.uuid = exports.payloadId = exports.removeHexLeadingZeros = exports.sanitizeHex = void 0;
const encoding = __importStar(require("@walletconnect/encoding"));
const constants_1 = require("./constants");
function sanitizeHex(hex) {
    return encoding.sanitizeHex(hex);
}
exports.sanitizeHex = sanitizeHex;
function removeHexLeadingZeros(hex) {
    return encoding.removeHexLeadingZeros(encoding.addHexPrefix(hex));
}
exports.removeHexLeadingZeros = removeHexLeadingZeros;
function payloadId() {
    const date = Date.now() * Math.pow(10, 3);
    const extra = Math.floor(Math.random() * Math.pow(10, 3));
    return date + extra;
}
exports.payloadId = payloadId;
function uuid() {
    const result = ((a, b) => {
        for (b = a = ""; a++ < 36; b += (a * 51) & 52 ? (a ^ 15 ? 8 ^ (Math.random() * (a ^ 20 ? 16 : 4)) : 4).toString(16) : "-") {
        }
        return b;
    })();
    return result;
}
exports.uuid = uuid;
function logDeprecationWarning() {
    console.warn("DEPRECATION WARNING: This WalletConnect client library will be deprecated in favor of @walletconnect/client. Please check docs.walletconnect.org to learn more about this migration!");
}
exports.logDeprecationWarning = logDeprecationWarning;
function getInfuraRpcUrl(chainId, infuraId) {
    let rpcUrl;
    const network = constants_1.infuraNetworks[chainId];
    if (network) {
        rpcUrl = `https://${network}.infura.io/v3/${infuraId}`;
    }
    return rpcUrl;
}
exports.getInfuraRpcUrl = getInfuraRpcUrl;
