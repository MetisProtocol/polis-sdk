import * as encoding from "@walletconnect/encoding";
import { JsonRpcFailure, JsonRpcRequest, JsonRpcResponse } from "json-rpc-engine";
import { IInternalEvent } from "../types";

export function isEmptyString(value: string): boolean {
  return value === "" || (typeof value === "string" && value.trim() === "");
}

export function isEmptyArray(array: any[]): boolean {
  return !(array && array.length);
}

export function isBuffer(val: any) {
  return encoding.isBuffer(val);
}

export function isTypedArray(val: any) {
  return encoding.isTypedArray(val);
}

export function isArrayBuffer(val: any) {
  return encoding.isArrayBuffer(val);
}

export function getType(val: any) {
  return encoding.getType(val);
}

export function getEncoding(val: any) {
  return encoding.getEncoding(val);
}

export function isHexString(value: any, length?: number): boolean {
  return encoding.isHexString(value, length);
}

export function isJsonRpcRequest(object: any): boolean {
  return typeof object.method !== "undefined";
}

export function isJsonRpcResponseSuccess(object: any): boolean {
  return typeof object.result !== "undefined";
}

export function isJsonRpcResponseError(object: any): boolean {
  return typeof object.error !== "undefined";
}

export function isInternalEvent(object: any): object is IInternalEvent {
  return typeof object.event !== "undefined";
}
