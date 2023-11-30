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
const json_rpc_engine_1 = require("json-rpc-engine");
const eth_rpc_errors_1 = require("eth-rpc-errors");
const httpRequest_1 = __importDefault(require("./utils/httpRequest"));
const utils_1 = require("./utils");
const RETRIABLE_ERRORS = [
    'Gateway timeout',
    'ETIMEDOUT',
    'ECONNRESET',
    'SyntaxError',
];
function createPolisConnectMiddleware(opts, provider) {
    const maxAttempts = opts.maxAttempts || 5;
    const { token, headers = {} } = opts;
    if (!headers || typeof headers !== 'object') {
        throw new Error(`Invalid value for 'headers': "${headers}"`);
    }
    if (!maxAttempts) {
        throw new Error(`Invalid value for 'maxAttempts': "${maxAttempts}" (${typeof maxAttempts})`);
    }
    if (!opts.chainId) {
        throw new Error(`Invalid value for 'chainId': "${maxAttempts}" (${typeof maxAttempts}),and can not be empty`);
    }
    return (0, json_rpc_engine_1.createAsyncMiddleware)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
        if (provider) {
            provider.emit('debug', req);
        }
        if (!opts.token && utils_1.signingMethods.includes(req.method)) {
            provider === null || provider === void 0 ? void 0 : provider.emit('error', `Invalid value for 'token': "${opts.token}" (${typeof opts.token})`);
            throw new Error(`Invalid value for 'token': "${opts.token}" (${typeof opts.token})`);
        }
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                req.token = opts.token;
                if (utils_1.signingMethods.includes(req.method)) {
                    attempt = maxAttempts;
                }
                yield performFetch(req, res, opts, provider);
                break;
            }
            catch (err) {
                if (!isRetriableError(err)) {
                    throw err;
                }
                const remainingAttempts = maxAttempts - attempt;
                if (!remainingAttempts) {
                    res.error = err;
                }
                yield timeout(1000);
            }
        }
        if (provider) {
            provider.emit('debug', Object.assign({}, { action: 'connectMiddleware response' }, res));
        }
        next();
    }));
}
exports.default = createPolisConnectMiddleware;
function timeout(length) {
    return new Promise((resolve) => {
        setTimeout(resolve, length);
    });
}
function isRetriableError(err) {
    const errMessage = err.toString();
    return RETRIABLE_ERRORS.some((phrase) => errMessage.includes(phrase));
}
function performFetch(req, res, opts, provider) {
    return __awaiter(this, void 0, void 0, function* () {
        let { fetchUrl, fetchParams } = fetchConfigFromReq(req, res, opts, provider);
        if (!!!fetchUrl) {
            fetchUrl = "";
        }
        if (provider) {
            provider.emit('debug', Object.assign({}, { action: 'request data' }, fetchParams));
            provider.emit(`debug:${req.method}`, Object.assign({}, { action: 'request data' }, fetchParams));
        }
        const response = yield httpRequest_1.default.instance.post(fetchUrl, fetchParams.data, { headers: fetchParams.headers });
        const rawData = response.data;
        if (provider) {
            provider.emit('debug', Object.assign({}, { action: 'response data' }, response));
            provider.emit(`debug:${req.method}`, Object.assign({}, { action: 'response data' }, response));
        }
        if (response.status != 200) {
            switch (response.status) {
                case 405:
                    throw eth_rpc_errors_1.ethErrors.rpc.methodNotFound();
                case 429:
                    throw createRatelimitError();
                case 503:
                case 504:
                    throw createTimeoutError();
                default:
                    throw createInternalError(response);
            }
        }
        res.result = rawData.result;
        res.error = rawData.error;
    });
}
function fetchConfigFromReq(req, res, opts, provider) {
    const requestOrigin = req.origin || 'internal';
    const headers = Object.assign({}, opts.headers, {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    });
    if (opts.token) {
        headers['Access-Token'] = `${opts.token}`;
    }
    if (provider.chainId) {
        headers['chainId'] = provider.chainId;
    }
    const rpcUrl = opts.apiHost ? opts.apiHost + 'api/rpc/v1' : 'https://one.nuvosphere.io/api/rpc/v1';
    console.log("host:", provider.host);
    if (provider)
        provider.emit('debug', {
            action: 'request config',
            rpcUrl,
            chainId: opts.chainId,
            request: req,
        });
    return {
        fetchUrl: rpcUrl,
        fetchParams: {
            headers,
            data: normalizeReq(req),
        },
    };
}
function normalizeReq(req) {
    return {
        id: req.id,
        jsonrpc: req.jsonrpc,
        method: req.method,
        params: req.params,
    };
}
function createRatelimitError() {
    const msg = `Request is being rate limited.`;
    return createInternalError(msg);
}
function createTimeoutError() {
    let msg = `Gateway timeout. The request took too long to process. `;
    msg += `This can happen when querying logs over too wide a block range.`;
    return createInternalError(msg);
}
function createInternalError(msg) {
    return eth_rpc_errors_1.ethErrors.rpc.internal(msg);
}
