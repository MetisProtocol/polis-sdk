"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const dialog_1 = __importDefault(require("./dialog"));
axios_1.default.defaults.headers['Content-Type'] = 'application/json;charset=utf-8';
class HttpService {
    constructor(isShowDialog = false) {
        this.isShowDialog = true;
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
    setShowDialog(_isShowDialog) {
        this.isShowDialog = _isShowDialog;
    }
    showDialog() {
        if (this.isShowDialog) {
            dialog_1.default.fire({
                html: "Processing...",
                didOpen: () => {
                    dialog_1.default.showLoading();
                }
            });
        }
    }
    closeDialog() {
        if (this.isShowDialog) {
            dialog_1.default.close();
        }
    }
}
exports.default = new HttpService();
