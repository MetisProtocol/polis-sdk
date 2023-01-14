import MetaMaskOnboarding from '@metamask/onboarding';
import { ethers,BigNumber } from 'ethers';
import Swal from 'sweetalert2';
import errData from './error';

const meta_storage_key = 'meta_address';
const chainIds = [1, 4, 435, 1337];

let isConnectedMetaMask: boolean = false;
let metaMaskNetworkStatus: boolean = false;
let env: string = 'prod';
let _disableTooltip: boolean = false;

function convert16(num: any) {
  // return ethers.utils.hexValue(num);
  return ethers.utils.hexValue(BigNumber.from(num).toHexString());
}

function error(msg: string, iconStr: any = 'error') {
  if(!_disableTooltip){
    const toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      },
    });

    toast.fire({
      icon: iconStr,
      title: msg || 'Some errors occured',
    });
  }
}

// get current chain id
export async function getCurChainId() {
  return await window.ethereum.request({method: 'eth_chainId'});
}

// add chain to metamask
async function addChain(chainid: number, chain: any) {
  try {
    const ethChain = convert16(chainid);
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: ethChain, chainName: chain.name,
        nativeCurrency: {
          name: '',
          symbol: chain.symbol, // 2-6 characters long
          decimals: 18,
        },
        rpcUrls: [chain.url],
      }],
    });
    return true;
  } catch (addError: any) {
    // "MetaMask Connect Error,Please try again.",
    error(addError.message);
  }
  return false;
}

export async function changeChain(chainid: number, chain: any) {
 
  const eth_chainid = "0x" + chainid.toString(16);
  // const eth_chainid =convert16(chainid)
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{chainId: eth_chainid}],
    });
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902 && chain != null) {
      const addRes = await addChain(chainid, chain);
      return addRes;
    }
  }
  return false;
}

export async function getMetaAccounts() {
  let metamaskAddress = '';
  if (!MetaMaskOnboarding.isMetaMaskInstalled()) {
    error('MetaMask Not Install.');
    const onboarding = new MetaMaskOnboarding();
    onboarding.stopOnboarding();
  } else {
    try {
      // when change chain
      window.ethereum.on('chainChanged', (chainId: any) => {
        // tslint:disable-next-line:radix
        const chainNum: any = window.parseInt(parseInt(chainId), 10);
        localStorage.setItem('metachain', chainNum);
        metaMaskNetworkStatus = chainIds.indexOf(chainNum) < 0;

      });
      // modify meta accou t
      window.ethereum.on('accountsChanged', (accounts: any) => {
        if (accounts.length > 0) {
          metamaskAddress = accounts[0];
          localStorage.setItem('meta_address', metamaskAddress);
        }
        // else {
        //     error('Can not get metamask account or connect to  metamask,please try again.');
        // }
      });

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      // this.metaConnectStatus = accounts && accounts.length > 0;
      if (accounts.length > 0) {
        metamaskAddress = accounts[0];
        localStorage.setItem(meta_storage_key, metamaskAddress);
        isConnectedMetaMask = true;
      }
    } catch (e: any) {
      if (e.code === -32002) {
        error('Already processing connecting metamask. Please open or unlock Metamask .', 'info');
      } else {
        error(e.message); // "MetaMask Connect Error,Please try again."
      }
    }
    return metamaskAddress;
  }
}

/**
 *
 * @param trans
 * @param chain
 * @returns {Promise<any>}
 * {
    "hash": "0x806edb7151b9ebeaed92483ed2eb455ea2bca7608bd7926e4a7ba38257f83b3c",
    "type": 2,
    "accessList": null,
    "blockHash": null,
    "blockNumber": null,
    "transactionIndex": null,
    "confirmations": 0,
    "from": "0x507d2C5444Be42A5e7Bd599bc370977515B7353F",
    "gasPrice": {
        "type": "BigNumber",
        "hex": "0x596b8e48"
    },
    "maxPriorityFeePerGas": {
        "type": "BigNumber",
        "hex": "0x59682f00"
    },
    "maxFeePerGas": {
        "type": "BigNumber",
        "hex": "0x596b8e48"
    },
    "gasLimit": {
        "type": "BigNumber",
        "hex": "0x8703"
    },
    "to": "0x8E1De235c879ca7b6BDA3Df8c16E42f8eB1Da8d1",
    "value": {
        "type": "BigNumber",
        "hex": "0x00"
    },
    "nonce": 14,
    "data":"0xa9059cbb000000000000000000000000f1181bd15e8780b69a121a8d8946cc1c23
 */
export async function sendMetaMaskContractTx(trans: any, chain: any,disableTooltip=false) {

  _disableTooltip = disableTooltip;
  // return await this._sendMetaMaskTx(trans);
  const fromAddrees = trans.eth_address;
  let isok = true;
  // 1.check meta install
  const metaAddr: any = await getMetaAccounts();
  if (metaAddr === '') {
    return null;
  }
  // 2.check account
  if (fromAddrees.toLocaleLowerCase() !== metaAddr.toLocaleLowerCase().replaceAll('"', '')) {
    // error(); // "MetaMask Connect Error,Please try again.",
    return {success: false, code: errData.MM_ACCOUNT_NOT_MATCH, data: `Invalid MetaMask address, it should be: ${fromAddrees}`};
  }
  // 3.check network
  const curMetaChain = await getCurChainId();
  if (trans.chainid !== curMetaChain) {
    isok = await changeChain(trans.chainid, chain);
  }
  if (!isok) {
    return {success: false, code: errData.MM_SWITCH_CHAIN_CANCEL, data: "chain is error "};
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner(trans.eth_address);
    const daiAddress = trans.contract_address;
    const daiAbi = [trans.func_abi_sign];
    // const daiAbi = ["function transfer(address to, uint amount)"];
    const contract = new ethers.Contract(daiAddress, daiAbi, provider);
    const daiWithSigner = contract.connect(signer);
    // const txHash = await  contract[trans.function](trans.args);
    const overrides = {
      value: trans.value,
    };
    const metaTx = await daiWithSigner[trans.function](...trans.args, overrides);
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
    return {success: true, data: transRes};

  } catch (e: any) {
    let errMsg = e.message;
    if (e.data) {
      errMsg += '|' + e.data.message;
    }
    if(!disableTooltip){
      error(`MetaMask Transfer Error ${e.message}`); // "MetaMask Connect Error,Please try again.",
    }
    return {success: false, code: errData.MM_ERROR, data: errMsg};
  }

  return {success: false, data: 'not defined error'};
}

export async function isConnectedMeta() {
  const accounts = await getMetaAccounts();
  return !!accounts && accounts.length > 0;
}

export function getMetaMaskAddress() {
  return localStorage.getItem(meta_storage_key);
}

export function setEnv(_env: string) {
  env = _env;
}

export async function addToken(token:any, tokenAddress:string, tokenDecimals:number, tokenImage:string , chainObj:any = null):Promise<any> {
  let symbol = '', address = '', decimals = 18, image = '', chain;
  if (typeof token === 'object') {
      symbol = token.token;
      address = token.tokenAddress;
      decimals = token.tokenDecimals;
      image = token.tokenImage;
  }else {
    symbol = token;
    address = tokenAddress;
    decimals = tokenDecimals;
    image = tokenImage;
  }
  if (chainObj || token['chainId']) {
    const curMetaChain = await getCurChainId();
    let chainChangeOk = true;
    if (convert16(chainObj.chainId) !== curMetaChain) {
      chainChangeOk = await changeChain(chainObj.chainId, chainObj);
    }
    if (!chainChangeOk) {
      return Promise.reject({ success: false, code: errData.MM_SWITCH_CHAIN_CANCEL, data: 'chain change error ' });
      // return ({ success: false, code: errData.MM_SWITCH_CHAIN_CANCEL, data: 'chain is error ' });
    }
  }
  // wasAdded is a boolean. Like any RPC method, an error may be thrown.
  return window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20', // Initially only supports ERC20, but eventually more!
          options: {
             address,    // The address that the token is at.
             symbol,     // A ticker symbol or shorthand, up to 5 chars.
             decimals, // The number of decimals in the token
             image,       // A string url of the token logo
          },
        },
      });
      
}

export default {
  getMetaMaskAddress, isConnectedMeta, getMetaAccounts, getCurChainId, sendMetaMaskContractTx, changeChain, setEnv, addToken
};
