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
exports.formatQueryString = exports.parseQueryString = exports.appendToQueryString = exports.getQueryString = void 0;
const queryStringUtils = __importStar(require("query-string"));
function getQueryString(url) {
    const pathEnd = url.indexOf("?") !== -1 ? url.indexOf("?") : undefined;
    const queryString = typeof pathEnd !== "undefined" ? url.substr(pathEnd) : "";
    return queryString;
}
exports.getQueryString = getQueryString;
function appendToQueryString(queryString, newQueryParams) {
    let queryParams = parseQueryString(queryString);
    queryParams = Object.assign(Object.assign({}, queryParams), newQueryParams);
    queryString = formatQueryString(queryParams);
    return queryString;
}
exports.appendToQueryString = appendToQueryString;
function parseQueryString(queryString) {
    return queryStringUtils.parse(queryString);
}
exports.parseQueryString = parseQueryString;
function formatQueryString(queryParams) {
    return queryStringUtils.stringify(queryParams);
}
exports.formatQueryString = formatQueryString;
