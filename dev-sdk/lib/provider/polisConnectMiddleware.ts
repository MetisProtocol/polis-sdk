import { createAsyncMiddleware, JsonRpcMiddleware, JsonRpcRequest } from 'json-rpc-engine'
import { ethErrors } from 'eth-rpc-errors';
import {  IPolisProviderOpts } from "./types";
import events from "./utils/events";
import http from './utils/httpRequest'
import { signingMethods } from "./utils";
import { PolisProvider } from "./polisProvider";
import SafeEventEmitter from '@metamask/safe-event-emitter'

const RETRIABLE_ERRORS = [
    // ignore server overload errors
    'Gateway timeout',
    'ETIMEDOUT',
    'ECONNRESET',
    // ignore server sent html error pages
    // or truncated json responses
    'SyntaxError',
]
export default function createPolisConnectMiddleware(opts: IPolisProviderOpts,provider?:SafeEventEmitter) {
    // const network = opts.network || 'mainnet'
    const maxAttempts = opts.maxAttempts || 5

    const {token, headers = {}} = opts

    // validate options
    if (!headers || typeof headers !== 'object') {
        throw new Error(`Invalid value for 'headers': "${headers}"`)
    }
    if (!maxAttempts) {
        throw new Error(`Invalid value for 'maxAttempts': "${maxAttempts}" (${typeof maxAttempts})`)
    }

    if (!opts.chainId) {
        throw new Error(`Invalid value for 'chainId': "${maxAttempts}" (${typeof maxAttempts}),and can not be empty`)
    }

    return createAsyncMiddleware(async (req: any, res:any, next) => {
        if(provider){
            provider.emit('debug',req)
        }
        if (!opts.token && signingMethods.includes(req.method)) {
            provider?.emit('error',`Invalid value for 'token': "${opts.token}" (${typeof opts.token})`)
            throw new Error(`Invalid value for 'token': "${opts.token}" (${typeof opts.token})`)
        }
        // retry MAX_ATTEMPTS times, if error matches filter
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                // attempt request
                req.token = opts.token
                //sign method
                if( signingMethods.includes(req.method)){
                    attempt = maxAttempts;
                }
                await performFetch(req, res, opts,provider)
                // request was successful
                break
            } catch (err) {
                // an error was caught while performing the request
                // if not retriable, resolve with the encountered error
                if (!isRetriableError(err)) {
                  // abort with error
                  throw err
                }
                // if no more attempts remaining, throw an error
                const remainingAttempts = maxAttempts - attempt
                if (!remainingAttempts) {
                    // const errMsg = `PolisProvider - cannot complete request. All retries exhausted.\nOriginal Error:\n${err.toString()}\n\n`
                    // const retriesExhaustedErr = new Error(err)
                    res.error = err;
                }
                // otherwise, ignore error and retry again after timeout
                await timeout(1000)
            }
        }
        // request was handled correctly, end
        if(provider){
            provider.emit('debug',Object.assign({},{action:'connectMiddleware response'},res))
        }
        next();

    })
}

//
function timeout(length: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, length)
    })
}

//
function isRetriableError (err:any) {
  const errMessage = err.toString()
  return RETRIABLE_ERRORS.some((phrase) => errMessage.includes(phrase))
}
//
async function performFetch(req: any, res: any, opts: IPolisProviderOpts,provider?:SafeEventEmitter ) {
    let {fetchUrl, fetchParams} = fetchConfigFromReq(req, res, opts,provider)
    // const fetchUrl = opts.rpcUrl;
    // const fetchParams = opts;
    if (!!!fetchUrl) {
        fetchUrl = ""
    }
    if(provider){
        provider.emit('debug',Object.assign({},{action:'request data'},fetchParams));
        provider.emit(`debug:${req.method}`,Object.assign({},{action:'request data'},fetchParams));

    }
    const response = await http.instance.post(fetchUrl,fetchParams.data, {headers:fetchParams.headers});
    // const response:any = {}
    const rawData = response.data;
    if(provider){
        provider.emit('debug',Object.assign({},{action:'response data'},response))
        provider.emit(`debug:${req.method}`,Object.assign({},{action:'response data'},response));
    }

    // handle errors
    if (response.status != 200) {
        switch (response.status) {
            case 405:
                throw ethErrors.rpc.methodNotFound()
            case 429:
                throw createRatelimitError()
            case 503:
            case 504:
                throw createTimeoutError()
            default:
                throw createInternalError(response)
        }
    }
    res.result = rawData.result
    res.error = rawData.error
}

//
function fetchConfigFromReq(req: any, res: any, opts: IPolisProviderOpts, provider?:any ) {
    const requestOrigin = req.origin || 'internal'
    const headers: any = Object.assign({}, opts.headers, {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    })

    if (opts.token) {
        headers['Access-Token'] = `${opts.token}`
    }
   
    if (provider.chainId) {
        headers['chainId'] = provider.chainId;
    }
    const rpcUrl = opts.apiHost ? opts.apiHost + 'api/rpc/v1' : 'https://one.nuvosphere.io/api/rpc/v1';
    console.log("host:",provider.host);
    if(provider)
        provider.emit('debug',{
                action:'request config',
                rpcUrl,
                chainId:opts.chainId,
                request: req,
        });
    return {
        fetchUrl: rpcUrl,
        fetchParams: {
            headers,
            data: normalizeReq(req),
        },
    }
}

//
// // strips out extra keys that could be rejected by strict nodes like parity
function normalizeReq(req: any) {
    return {
        id: req.id,
        jsonrpc: req.jsonrpc,
        method: req.method,
        params: req.params,
    }
}

//
function createRatelimitError() {
    const msg = `Request is being rate limited.`
    return createInternalError(msg)
}

//
function createTimeoutError() {
    let msg = `Gateway timeout. The request took too long to process. `
    msg += `This can happen when querying logs over too wide a block range.`
    return createInternalError(msg)
}

//
function createInternalError(msg: any) {
    return ethErrors.rpc.internal(msg)
}
