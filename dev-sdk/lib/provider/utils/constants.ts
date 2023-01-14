
export const TX_TYPE = {
  SIGN:'SIGN',
  SEND_TX:'TX',
  SEND_CON_TX:'TOKEN_TX'
}

export const WALLET_TYPES ={
  POLIS:'POLIS',
  LOCAL:'LOCAL',
  MM:'METAMASK',
  WC:'WALLETCONNECT',
  NONE:'NONE'
}

export const reservedEvents = [
  "session_request",
  "session_update",
  "exchange_key",
  "connect",
  "disconnect",
  "display_uri",
  "modal_closed",
  "transport_open",
  "transport_close",
  "transport_error",
];


export const PolisEvents = {
  TX_CONFIRM_DIALOG_EVENT: 'tx-confirm-dialog',
  TX_CONFIRM_EVENT:'tx-confirm',
  CHAIN_CHANGED_EVENT: 'chainChanged',
  ACCOUNTS_CHANGED_EVENT: 'accountsChanged',
}
export const signingMethods = [
  "eth_sendTransaction",
  "eth_signTransaction",
  "eth_sign",
  "eth_signTypedData",
  "eth_signTypedData_v1",
  "eth_signTypedData_v2",
  "eth_signTypedData_v3",
  "eth_signTypedData_v4",
  "personal_sign",
   "eth_accounts"
];

export const stateMethods = ["eth_accounts", "eth_chainId", "net_version"];

export const infuraNetworks:any = {
  1: "mainnet",
  3: "ropsten",
  4: "rinkeby",
  5: "goerli",
  42: "kovan",
};


