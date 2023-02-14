// import WalletConnectProvider from "@walletconnect/web3-provider";
// import Web3Modal from "@/utils/WallectConnector";
import { providers, ethers } from "ethers";
import WalletConnectProvider from "@walletconnect/web3-provider";

import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import errors from "./erros";
import log from "./utils/log"

import keccak256 from 'keccak256';

function getWalletConnector() {
    //  Create WalletConnect Provider
    const bridge = "https://bridge.walletconnect.org";

    const connector:WalletConnect = new WalletConnect({
        bridge,
        qrcodeModal: QRCodeModal,
    });
    // Check if connection is already established
    if (!connector.connected) {
        // create new session
        connector.createSession();
    }
    subscribeToEvents(connector);
    return connector;
}
//WalletConnectProvider
async function getWalletConnectProvider() {
    //  Create WalletConnect Provider
    const wcProvider = new WalletConnectProvider({
        rpc: {
            1: "https://mainnet.infura.io/v3/25ad049ae13a4315b47369b7679dea80",
            4: "https://rinkeby.infura.io/v3/25ad049ae13a4315b47369b7679dea80",
            588: "https://stardust.metis.io/?owner=588",
            599: "https://goerli.gateway.metisdevops.link",
            1088: "https://andromeda.metis.io/?owner=1088"
        },
    });
    //
    try {
        await wcProvider.enable();
    } catch (e) {
        wcProvider.isConnecting = false;
        log.error(e);
    }
    return  wcProvider;
}


async function signMessage(connector:WalletConnect,msg: string): Promise<any> {
    if (connector.connected) {
        try {
            const address = connector.accounts[0];
            const msgHex =  ethers.utils.hexlify(msg);
            const msgParams = [
                msgHex,
                address,                            // Required
            ];
            return connector.signPersonalMessage(msgParams)
        } catch (e:any) {
            return Promise.reject(e.message)
        }
    }else{
        return Promise.reject(errors.WALLET_CONNECT_NOT_LOGIN);
    }
}

async function signPersonalMessage(connector:WalletConnect,msg: string): Promise<any> {
    if (connector.connected) {
        try {
            const address = connector.accounts[0];
            const msgHex =  ethers.utils.toUtf8Bytes(msg);
            return connector.signPersonalMessage([msgHex,address])
        } catch (e:any) {
            return Promise.reject(e.message)
        }
    }else{
        return Promise.reject(errors.WALLET_CONNECT_NOT_LOGIN);
    }
}

/**
 * {
    "hash": "0xcc913e21df0c8e3d914aea5c30adf987ecfe6cac66c283a37787507d8520c3f0",
    "type": 2,
    "accessList": [],
    "blockHash": null,
    "blockNumber": null,
    "transactionIndex": null,
    "confirmations": 0,
    "from": "0x51dcb30420967e67D0C103e42e6Cc737b0a32857",
    "gasPrice": {
        "type": "BigNumber",
        "hex": "0x596b3289"
    },
    "maxPriorityFeePerGas": {
        "type": "BigNumber",
        "hex": "0x59682f00"
    },
    "maxFeePerGas": {
        "type": "BigNumber",
        "hex": "0x596b3289"
    },
    "gasLimit": {
        "type": "BigNumber",
        "hex": "0xe3bc"
    },
    "to": "0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4",
    "value": {
        "type": "BigNumber",
        "hex": "0x470de4df820000"
    },
    "nonce": 36,
    "data": "0x",
    "r": "0x93f2071cb755bb0fa2a4ddcf7b7d7ff6328167126068975dd848fd88fb8aa1a0",
    "s": "0x48bbbac5d0a4bc224ca0677cb3d9634c8639f14e407311de564d2afbed04d5dd",
    "v": 1,
    "creates": null,
    "chainId": 4
}
 * @param to
 * @param from
 * @param amount
 * @param chainId
 * @param limit
 * @param price
 * @param nonce
 */
export async function sendTrans(connector:WalletConnect,
                                tx: {to: any,
                                    from: any,
                                    value: any,
                                    chainId: number,
                                    gas: number,
                                    gasPrice: number,
                                    data: string,
                                    nonce: number },
                                ):Promise<any>{
    if (connector.connected) {
      const txsign = await connector.sendTransaction(tx);
      return txsign;
  }else{
        return Promise.reject(errors.WALLET_CONNECT_NOT_LOGIN);
    }
}

function subscribeToEvents(connector: WalletConnect) {

    // Subscribe to connection events
    connector.on("connect", (error, payload) => {
        if (error) {
            throw error;
        }

        // Get provided accounts and chainId
        const { accounts, chainId } = payload.params[0];
    });

    connector.on("session_update", (error, payload) => {
        if (error) {
            throw error;
        }

        // Get updated accounts and chainId
        const { accounts, chainId } = payload.params[0];
    });

    connector.on("disconnect", (error, payload) => {
        if (error) {
            throw error;
        }
    });
}

export default {getWalletConnector ,getWalletConnectProvider , signMessage ,sendTrans }