"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkNew = exports.getStatic = exports.defineReadOnly = void 0;
function defineReadOnly(object, name, value) {
    Object.defineProperty(object, name, {
        enumerable: true,
        value: value,
        writable: false,
    });
}
exports.defineReadOnly = defineReadOnly;
function getStatic(ctor, key) {
    for (let i = 0; i < 32; i++) {
        if (ctor[key]) {
            return ctor[key];
        }
        if (!ctor.prototype || typeof (ctor.prototype) !== "object") {
            break;
        }
        ctor = Object.getPrototypeOf(ctor.prototype).constructor;
    }
    return null;
}
exports.getStatic = getStatic;
function checkNew(target, kind) {
    if (target === Object || target == null) {
        return;
    }
}
exports.checkNew = checkNew;
