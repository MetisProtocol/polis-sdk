"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const sweetalert2_1 = __importDefault(require("sweetalert2"));
axios_1.default.defaults.headers['Content-Type'] = 'application/json;charset=utf-8';
class Service {
    constructor(isShowDialog = true) {
        this.isShowDialog = true;
        this.loadingDialog = sweetalert2_1.default.mixin({});
        this.isShowDialog = isShowDialog;
        let request = axios_1.default.create({
            timeout: 50000,
        });
        request.interceptors.request.use((config) => {
            this.showDialog();
            return config;
        }, (error) => {
            this.closeDialog();
            Promise.reject({ "status": "ERROR", "message": error });
        });
        request.interceptors.response.use((res) => {
            this.closeDialog();
            return res;
        }, (error) => {
            this.closeDialog();
            return Promise.reject({ "status": "ERROR", "message": error.message });
        });
        this.instance = request;
    }
    showDialog() {
        if (this.isShowDialog) {
            this.loadingDialog.fire({
                html: "Processing...",
                didOpen: () => {
                    sweetalert2_1.default.showLoading();
                }
            });
        }
    }
    closeDialog() {
        if (this.isShowDialog) {
            this.loadingDialog.close();
        }
    }
}
exports.default = Service;
