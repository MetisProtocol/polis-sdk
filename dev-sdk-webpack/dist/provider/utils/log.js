"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const loglevel_1 = __importDefault(require("loglevel"));
if (process.env.NODE_ENV && (process.env.NODE_ENV != 'prod' && process.env.NODE_ENV != "production")) {
    loglevel_1.default.setLevel("debug");
    loglevel_1.default.debug("sdk env:", process.env.NODE_ENV);
}
else {
    loglevel_1.default.setLevel("error");
}
exports.default = loglevel_1.default;
