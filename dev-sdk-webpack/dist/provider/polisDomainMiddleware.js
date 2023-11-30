"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPolisRPCMiddleware = void 0;
const createScaffoldMiddleware_1 = require("json-rpc-engine/dist/createScaffoldMiddleware");
function createPolisRPCMiddleware(chainId) {
    return (0, createScaffoldMiddleware_1.createScaffoldMiddleware)({});
}
exports.createPolisRPCMiddleware = createPolisRPCMiddleware;
