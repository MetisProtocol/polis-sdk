import { keccak_256 } from "js-sha3";

import { convertUtf8ToHex, convertNumberToHex, convertUtf8ToBuffer, removeHexPrefix, addHexPrefix } from "./encoding";
import { isEmptyArray, isHexString, isEmptyString } from "./validators";

export function toChecksumAddress(address: string): string {
  address = removeHexPrefix(address.toLowerCase());
  const hash = removeHexPrefix(keccak_256(convertUtf8ToBuffer(address)));
  let checksum = "";
  for (let i = 0; i < address.length; i++) {
    if (parseInt(hash[i], 16) > 7) {
      checksum += address[i].toUpperCase();
    } else {
      checksum += address[i];
    }
  }
  return addHexPrefix(checksum);
}

export const isValidAddress = (address?: string) => {
  if (!address) {
    return false;
  } else if (address.toLowerCase().substring(0, 2) !== "0x") {
    return false;
  } else if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
    return false;
  } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
    return true;
  } else {
    return address === toChecksumAddress(address);
  }
};

export function parsePersonalSign(params: string[]): string[] {
  if (!isEmptyArray(params) && !isHexString(params[0])) {
    params[0] = convertUtf8ToHex(params[0]);
  }
  return params;
}
