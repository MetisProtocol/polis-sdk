export interface IPolisSdkError {
    code: number;
    message: string;
    data: any;
    level: any;
}
export declare class PolisSdkError {
    code: number;
    message: string;
    data: any;
    level: string;
    constructor(code: number, message: string, level?: string, data?: any);
    toJson(): {
        code: number;
        message: string;
        data: any;
        level: string;
    };
}
export declare function toError(error: PolisSdkError, message?: string): PolisSdkError;
export declare function makeError(error: PolisSdkError, obj: any): PolisSdkError;
export declare function makeRequestError(message?: string): PolisSdkError;
export declare const sdkErrors: {
    OK: PolisSdkError;
    NOT_LOGIN: PolisSdkError;
    REQUEST_ERROR: PolisSdkError;
    TOKEN_IS_EMPTY: PolisSdkError;
    REFRSHTOKEN_IS_EMPTY: PolisSdkError;
    PROVIDER_IS_NOT_INIT: PolisSdkError;
    MM_ERROR: PolisSdkError;
    MM_SWITCH_CHAIN_CANCEL: PolisSdkError;
    MM_ACCOUNT_NOT_MATCH: PolisSdkError;
    MM_ACCOUNT_LOGOUT_ERROR: PolisSdkError;
    MM_SWITCH_CANCEL_CONNECT: PolisSdkError;
    NO_PERMISSION: PolisSdkError;
    NETWORK_ERROR: PolisSdkError;
    MM_NOT_INSTALL: PolisSdkError;
    ACCOUNT_NOT_EXIST: PolisSdkError;
    USER_SEND_TX_CANCEL: PolisSdkError;
    POLIS_TX_ERROR: PolisSdkError;
    UNKNOW_ERROR: PolisSdkError;
    WALLET_CONNECT_NOT_LOGIN: PolisSdkError;
    WC_ERROR: PolisSdkError;
    ETH_CONTRACT_NOT_FOUND: PolisSdkError;
};
export default sdkErrors;
