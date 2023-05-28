"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePersonalSign = exports.isValidAddress = exports.toChecksumAddress = void 0;
const js_sha3_1 = require("js-sha3");
const encoding_1 = require("./encoding");
const validators_1 = require("./validators");
function toChecksumAddress(address) {
    address = (0, encoding_1.removeHexPrefix)(address.toLowerCase());
    const hash = (0, encoding_1.removeHexPrefix)((0, js_sha3_1.keccak_256)((0, encoding_1.convertUtf8ToBuffer)(address)));
    let checksum = "";
    for (let i = 0; i < address.length; i++) {
        if (parseInt(hash[i], 16) > 7) {
            checksum += address[i].toUpperCase();
        }
        else {
            checksum += address[i];
        }
    }
    return (0, encoding_1.addHexPrefix)(checksum);
}
exports.toChecksumAddress = toChecksumAddress;
const isValidAddress = (address) => {
    if (!address) {
        return false;
    }
    else if (address.toLowerCase().substring(0, 2) !== "0x") {
        return false;
    }
    else if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
        return false;
    }
    else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
        return true;
    }
    else {
        return address === toChecksumAddress(address);
    }
};
exports.isValidAddress = isValidAddress;
function parsePersonalSign(params) {
    if (!(0, validators_1.isEmptyArray)(params) && !(0, validators_1.isHexString)(params[0])) {
        params[0] = (0, encoding_1.convertUtf8ToHex)(params[0]);
    }
    return params;
}
exports.parsePersonalSign = parsePersonalSign;
