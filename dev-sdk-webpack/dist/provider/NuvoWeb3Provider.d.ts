import { ethers } from "ethers";
import { Signer, TypedDataDomain, TypedDataField, TypedDataSigner } from "@ethersproject/abstract-signer";
import { Provider, TransactionResponse, TransactionRequest } from "@ethersproject/abstract-provider";
import { Deferrable } from "@ethersproject/properties";
import { Bytes } from "@ethersproject/bytes";
export declare class NuvoWeb3Provider extends ethers.providers.Web3Provider {
    sendTransaction(signedTransaction: string | Promise<string>): Promise<TransactionResponse>;
    getSigner(addressOrIndex?: string | number): ethers.providers.JsonRpcSigner;
}
export declare class NuvoSinger extends Signer implements TypedDataSigner {
    readonly provider: ethers.providers.JsonRpcProvider;
    _index: number;
    _address: string;
    constructor(constructorGuard: any, provider: NuvoWeb3Provider, addressOrIndex?: string | number);
    connect(provider: Provider): NuvoSinger;
    getAddress(): Promise<string>;
    sendUncheckedTransaction(transaction: Deferrable<TransactionRequest>): Promise<string>;
    signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string>;
    sendTransaction(transaction: Deferrable<TransactionRequest>): Promise<TransactionResponse>;
    signMessage(message: Bytes | string): Promise<string>;
    _legacySignMessage(message: Bytes | string): Promise<string>;
    _signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string>;
    unlock(password: string): Promise<boolean>;
}
