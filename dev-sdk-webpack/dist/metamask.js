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
exports.addToken = exports.setEnv = exports.getMetaMaskAddress = exports.isConnectedMeta = exports.sendMetaMaskContractTx = exports.getMetaAccounts = exports.changeChain = exports.getCurChainId = void 0;
const onboarding_1 = __importDefault(require("@metamask/onboarding"));
const ethers_1 = require("ethers");
const sweetalert2_1 = __importDefault(require("sweetalert2"));
const error_1 = __importDefault(require("./error"));
const meta_storage_key = 'meta_address';
const chainIds = [1, 4, 435, 1337];
let isConnectedMetaMask = false;
let metaMaskNetworkStatus = false;
let env = 'prod';
let _disableTooltip = false;
function convert16(num) {
    return ethers_1.ethers.utils.hexValue(ethers_1.BigNumber.from(num).toHexString());
}
function error(msg, iconStr = 'error') {
    if (!_disableTooltip) {
        const toast = sweetalert2_1.default.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', sweetalert2_1.default.stopTimer);
                toast.addEventListener('mouseleave', sweetalert2_1.default.resumeTimer);
            },
        });
        toast.fire({
            icon: iconStr,
            title: msg || 'Some errors occured',
        });
    }
}
function getCurChainId() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield window.ethereum.request({ method: 'eth_chainId' });
    });
}
exports.getCurChainId = getCurChainId;
function addChain(chainid, chain) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ethChain = convert16(chainid);
            yield window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                        chainId: ethChain, chainName: chain.name,
                        nativeCurrency: {
                            name: '',
                            symbol: chain.symbol,
                            decimals: 18,
                        },
                        rpcUrls: [chain.url],
                    }],
            });
            return true;
        }
        catch (addError) {
            error(addError.message);
        }
        return false;
    });
}
function changeChain(chainid, chain) {
    return __awaiter(this, void 0, void 0, function* () {
        const eth_chainid = "0x" + chainid.toString(16);
        try {
            yield window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: eth_chainid }],
            });
            return true;
        }
        catch (switchError) {
            if (switchError.code === 4902 && chain != null) {
                const addRes = yield addChain(chainid, chain);
                return addRes;
            }
        }
        return false;
    });
}
exports.changeChain = changeChain;
function getMetaAccounts() {
    return __awaiter(this, void 0, void 0, function* () {
        let metamaskAddress = '';
        if (!onboarding_1.default.isMetaMaskInstalled()) {
            error('MetaMask Not Install.');
            const onboarding = new onboarding_1.default();
            onboarding.stopOnboarding();
        }
        else {
            try {
                window.ethereum.on('chainChanged', (chainId) => {
                    const chainNum = window.parseInt(parseInt(chainId), 10);
                    localStorage.setItem('metachain', chainNum);
                    metaMaskNetworkStatus = chainIds.indexOf(chainNum) < 0;
                });
                window.ethereum.on('accountsChanged', (accounts) => {
                    if (accounts.length > 0) {
                        metamaskAddress = accounts[0];
                        localStorage.setItem('meta_address', metamaskAddress);
                    }
                });
                const accounts = yield window.ethereum.request({
                    method: 'eth_requestAccounts',
                });
                if (accounts.length > 0) {
                    metamaskAddress = accounts[0];
                    localStorage.setItem(meta_storage_key, metamaskAddress);
                    isConnectedMetaMask = true;
                }
            }
            catch (e) {
                if (e.code === -32002) {
                    error('Already processing connecting metamask. Please open or unlock Metamask .', 'info');
                }
                else {
                    error(e.message);
                }
            }
            return metamaskAddress;
        }
    });
}
exports.getMetaAccounts = getMetaAccounts;
function sendMetaMaskContractTx(trans, chain, disableTooltip = false) {
    return __awaiter(this, void 0, void 0, function* () {
        _disableTooltip = disableTooltip;
        const fromAddrees = trans.eth_address;
        let isok = true;
        const metaAddr = yield getMetaAccounts();
        if (metaAddr === '') {
            return null;
        }
        if (fromAddrees.toLocaleLowerCase() !== metaAddr.toLocaleLowerCase().replaceAll('"', '')) {
            return { success: false, code: error_1.default.MM_ACCOUNT_NOT_MATCH, data: `Invalid MetaMask address, it should be: ${fromAddrees}` };
        }
        const curMetaChain = yield getCurChainId();
        if (trans.chainid !== curMetaChain) {
            isok = yield changeChain(trans.chainid, chain);
        }
        if (!isok) {
            return { success: false, code: error_1.default.MM_SWITCH_CHAIN_CANCEL, data: "chain is error " };
        }
        try {
            const provider = new ethers_1.ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner(trans.eth_address);
            const daiAddress = trans.contract_address;
            const daiAbi = [trans.func_abi_sign];
            const contract = new ethers_1.ethers.Contract(daiAddress, daiAbi, provider);
            const daiWithSigner = contract.connect(signer);
            const overrides = {
                value: trans.value,
            };
            const metaTx = yield daiWithSigner[trans.function](...trans.args, overrides);
            const gasLimit = metaTx['gasLimit']['_hex'];
            const gasPrice = metaTx['gasPrice']['_hex'];
            const nonce = metaTx['nonce'];
            const txhash = metaTx['hash'];
            const metaFrom = metaTx['from'];
            const metaTo = metaTx['to'];
            const transRes = {
                chainid: trans.chainid,
                domain: trans.domain,
                from: metaFrom,
                to: metaTo,
                function: trans.function,
                args: trans.args,
                trans: {
                    gasLimit,
                    gasPrice,
                    txhash,
                    nonce,
                },
            };
            return { success: true, data: transRes };
        }
        catch (e) {
            let errMsg = e.message;
            if (e.data) {
                errMsg += '|' + e.data.message;
            }
            if (!disableTooltip) {
                error(`MetaMask Transfer Error ${e.message}`);
            }
            return { success: false, code: error_1.default.MM_ERROR, data: errMsg };
        }
        return { success: false, data: 'not defined error' };
    });
}
exports.sendMetaMaskContractTx = sendMetaMaskContractTx;
function isConnectedMeta() {
    return __awaiter(this, void 0, void 0, function* () {
        const accounts = yield getMetaAccounts();
        return !!accounts && accounts.length > 0;
    });
}
exports.isConnectedMeta = isConnectedMeta;
function getMetaMaskAddress() {
    return localStorage.getItem(meta_storage_key);
}
exports.getMetaMaskAddress = getMetaMaskAddress;
function setEnv(_env) {
    env = _env;
}
exports.setEnv = setEnv;
function addToken(token, tokenAddress, tokenDecimals, tokenImage, chainObj = null) {
    return __awaiter(this, void 0, void 0, function* () {
        let symbol = '', address = '', decimals = 18, image = '', chain;
        if (typeof token === 'object') {
            symbol = token.token;
            address = token.tokenAddress;
            decimals = token.tokenDecimals;
            image = token.tokenImage;
        }
        else {
            symbol = token;
            address = tokenAddress;
            decimals = tokenDecimals;
            image = tokenImage;
        }
        if (chainObj || token['chainId']) {
            const curMetaChain = yield getCurChainId();
            let chainChangeOk = true;
            if (convert16(chainObj.chainId) !== curMetaChain) {
                chainChangeOk = yield changeChain(chainObj.chainId, chainObj);
            }
            if (!chainChangeOk) {
                return Promise.reject({ success: false, code: error_1.default.MM_SWITCH_CHAIN_CANCEL, data: 'chain change error ' });
            }
        }
        return window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address,
                    symbol,
                    decimals,
                    image,
                },
            },
        });
    });
}
exports.addToken = addToken;
exports.default = {
    getMetaMaskAddress, isConnectedMeta, getMetaAccounts, getCurChainId, sendMetaMaskContractTx, changeChain, setEnv, addToken
};
