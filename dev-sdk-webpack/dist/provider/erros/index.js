"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sdkErrors = exports.makeRequestError = exports.makeError = exports.toError = exports.PolisSdkError = void 0;
class PolisSdkError {
    constructor(code, message, level = 'info', data = null) {
        this.code = code;
        this.message = message;
        this.level = level;
        this.data = data;
    }
    toJson() {
        return {
            code: this.code,
            message: this.message,
            data: this.data,
            level: this.level
        };
    }
}
exports.PolisSdkError = PolisSdkError;
function toError(error, message) {
    if (message) {
        error.message = message;
    }
    return error;
}
exports.toError = toError;
function makeError(error, obj) {
    if (obj) {
        error.message = JSON.stringify(obj);
    }
    return error;
}
exports.makeError = makeError;
function makeRequestError(message) {
    let error = exports.sdkErrors.REQUEST_ERROR;
    if (message) {
        error.message = message;
    }
    return error;
}
exports.makeRequestError = makeRequestError;
function error(code, message, data = null, level = "info") {
    return new PolisSdkError(code, message, data, level);
}
exports.sdkErrors = {
    OK: error(200, 'success.'),
    NOT_LOGIN: error(401, 'Login or authorization is invalid, please log in again.'),
    REQUEST_ERROR: error(-90000, 'Server request error.'),
    TOKEN_IS_EMPTY: error(-90001, 'Access token is empty or unvalid'),
    REFRSHTOKEN_IS_EMPTY: error(-90001, 'Refresh Access token is empty'),
    PROVIDER_IS_NOT_INIT: error(-90002, 'Provider is not initialized, please connect() first.'),
    MM_ERROR: error(-90003, 'Metamask execution error.'),
    MM_SWITCH_CHAIN_CANCEL: error(-90004, 'Metamask:user cancel switching network'),
    MM_ACCOUNT_NOT_MATCH: error(-90005, 'Metamask address does not match Polis address.'),
    MM_ACCOUNT_LOGOUT_ERROR: error(-90006, 'Metamask logout failed.'),
    MM_SWITCH_CANCEL_CONNECT: error(-90006, 'Metamask:User rejected the connect request.'),
    NO_PERMISSION: error(-90007, 'Please login or authorize.'),
    NETWORK_ERROR: error(-90009, 'network error.'),
    MM_NOT_INSTALL: error(-90010, 'Metamask not install.'),
    ACCOUNT_NOT_EXIST: error(-90011, 'Account not exists.'),
    USER_SEND_TX_CANCEL: error(-90012, 'User cancel the transaction.'),
    POLIS_TX_ERROR: error(-90013, 'Send transaction error.'),
    UNKNOW_ERROR: error(-90014, 'unknow error.'),
    WALLET_CONNECT_NOT_LOGIN: error(-90040, 'wallectconnect not logged in.'),
    WC_ERROR: error(-90041, 'WallectConnect execution error.'),
    ETH_CONTRACT_NOT_FOUND: error(-90100, 'Contract can not found or error.')
};
exports.default = exports.sdkErrors;
