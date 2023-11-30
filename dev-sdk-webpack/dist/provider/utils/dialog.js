"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showLoading = void 0;
const sweetalert2_1 = __importDefault(require("sweetalert2"));
const dialog = sweetalert2_1.default.mixin({
    customClass: {
        container: 'polis-swal2-container'
    },
    showClass: {
        popup: 'polis-swal2-show',
    }
});
function showLoading() {
    const loadingDialog = sweetalert2_1.default.mixin({
        customClass: {
            container: 'polis-loading-swal2-container'
        },
        showClass: {
            popup: 'polis-loading-swal2-show',
        }
    });
    loadingDialog.fire({
        html: 'Processing...',
        didOpen: () => {
            sweetalert2_1.default.showLoading();
        },
        allowOutsideClick: false,
    });
    return loadingDialog;
}
exports.showLoading = showLoading;
exports.default = dialog;
