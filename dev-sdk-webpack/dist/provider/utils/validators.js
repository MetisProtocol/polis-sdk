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
exports.isInternalEvent = exports.isJsonRpcResponseError = exports.isJsonRpcResponseSuccess = exports.isJsonRpcRequest = exports.isHexString = exports.getEncoding = exports.getType = exports.isArrayBuffer = exports.isTypedArray = exports.isBuffer = exports.isEmptyArray = exports.isEmptyString = void 0;
const encoding = __importStar(require("@walletconnect/encoding"));
function isEmptyString(value) {
    return value === "" || (typeof value === "string" && value.trim() === "");
}
exports.isEmptyString = isEmptyString;
function isEmptyArray(array) {
    return !(array && array.length);
}
exports.isEmptyArray = isEmptyArray;
function isBuffer(val) {
    return encoding.isBuffer(val);
}
exports.isBuffer = isBuffer;
function isTypedArray(val) {
    return encoding.isTypedArray(val);
}
exports.isTypedArray = isTypedArray;
function isArrayBuffer(val) {
    return encoding.isArrayBuffer(val);
}
exports.isArrayBuffer = isArrayBuffer;
function getType(val) {
    return encoding.getType(val);
}
exports.getType = getType;
function getEncoding(val) {
    return encoding.getEncoding(val);
}
exports.getEncoding = getEncoding;
function isHexString(value, length) {
    return encoding.isHexString(value, length);
}
exports.isHexString = isHexString;
function isJsonRpcRequest(object) {
    return typeof object.method !== "undefined";
}
exports.isJsonRpcRequest = isJsonRpcRequest;
function isJsonRpcResponseSuccess(object) {
    return typeof object.result !== "undefined";
}
exports.isJsonRpcResponseSuccess = isJsonRpcResponseSuccess;
function isJsonRpcResponseError(object) {
    return typeof object.error !== "undefined";
}
exports.isJsonRpcResponseError = isJsonRpcResponseError;
function isInternalEvent(object) {
    return typeof object.event !== "undefined";
}
exports.isInternalEvent = isInternalEvent;
