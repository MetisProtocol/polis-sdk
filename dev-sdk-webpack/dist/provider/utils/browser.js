"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNode = exports.isMobile = exports.isIOS = exports.isAndroid = exports.detectOS = exports.detectEnv = void 0;
const detect_browser_1 = require("detect-browser");
const log_1 = __importDefault(require("./log"));
function detectEnv(userAgent) {
    return (0, detect_browser_1.detect)(userAgent);
}
exports.detectEnv = detectEnv;
function detectOS() {
    const env = detectEnv();
    log_1.default.debug("os:", env === null || env === void 0 ? void 0 : env.os);
    log_1.default.debug("name:", env === null || env === void 0 ? void 0 : env.name);
    log_1.default.debug("version:", env === null || env === void 0 ? void 0 : env.version);
    return env && env.os ? env.os : undefined;
}
exports.detectOS = detectOS;
function isAndroid() {
    const os = detectOS();
    return os ? os.toLowerCase().includes("android") : false;
}
exports.isAndroid = isAndroid;
function isIOS() {
    const os = detectOS();
    return os
        ? os.toLowerCase().includes("ios") ||
            (os.toLowerCase().includes("mac") && navigator.maxTouchPoints > 1)
        : false;
}
exports.isIOS = isIOS;
function isMobile() {
    const os = detectOS();
    return os ? isAndroid() || isIOS() : false;
}
exports.isMobile = isMobile;
function isNode() {
    const env = detectEnv();
    const result = env && env.name ? env.name.toLowerCase() === "node" : false;
    return result;
}
exports.isNode = isNode;
