"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validators_1 = require("./validators");
const erros_1 = require("../erros");
class EventManager {
    constructor() {
        this._eventEmitters = [];
    }
    subscribe(eventEmitter) {
        this._eventEmitters.push(eventEmitter);
    }
    unsubscribe(event) {
        this._eventEmitters = this._eventEmitters.filter(x => x.event !== event);
    }
    trigger(payload, eventName = '') {
        let eventEmitters = [];
        let event;
        if ((0, validators_1.isJsonRpcRequest)(payload)) {
            event = payload.method;
        }
        else if ((0, validators_1.isJsonRpcResponseSuccess)(payload) || (0, validators_1.isJsonRpcResponseError)(payload)) {
            event = `response:${payload.id}`;
        }
        else if ((0, validators_1.isInternalEvent)(payload)) {
            event = payload.event;
        }
        else {
            event = eventName;
        }
        if (event) {
            eventEmitters = this._eventEmitters.filter((eventEmitter) => eventEmitter.event === event || eventEmitter.event === eventName);
        }
        eventEmitters.forEach((eventEmitter) => {
            if ((0, validators_1.isJsonRpcResponseError)(payload)) {
                const error = new erros_1.PolisSdkError(payload.error.code, payload.error.message);
                eventEmitter.callback(error, payload);
            }
            else {
                eventEmitter.callback(null, payload);
            }
        });
    }
}
exports.default = EventManager;
