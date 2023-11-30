"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = void 0;
function sleep(time) {
    return new Promise((resolve) => {
        setInterval(resolve, time);
    });
}
exports.sleep = sleep;
