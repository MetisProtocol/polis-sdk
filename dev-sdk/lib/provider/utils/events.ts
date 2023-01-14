import { JsonRpcRequest, JsonRpcResponse, PendingJsonRpcResponse } from "json-rpc-engine";
import {
    IEventEmitter,
} from "../types";
import { isInternalEvent, isJsonRpcRequest, isJsonRpcResponseError, isJsonRpcResponseSuccess } from "./validators";
import { PolisSdkError } from "../erros"
// -- EventManager --------------------------------------------------------- //

class EventManager {
    private _eventEmitters: IEventEmitter[];

    constructor() {
        this._eventEmitters = [];
    }

    public subscribe(eventEmitter: IEventEmitter) {
        this._eventEmitters.push(eventEmitter);
    }

    public unsubscribe(event: string) {
        this._eventEmitters = this._eventEmitters.filter(x => x.event !== event);
    }

    public trigger(
        payload: any ,eventName:string=''
    ): void {
        let eventEmitters: IEventEmitter[] = [];
        let event: string;

        if (isJsonRpcRequest(payload)) {
            event = payload.method;
        } else if (isJsonRpcResponseSuccess(payload) || isJsonRpcResponseError(payload)) {
            event = `response:${payload.id}`;
        } else if (isInternalEvent(payload)) {
            event = payload.event;
        } else {
            event = eventName;
        }

        if (event) {
            eventEmitters = this._eventEmitters.filter(
                (eventEmitter: IEventEmitter) => eventEmitter.event === event ||eventEmitter.event === eventName,
            );
        }
        eventEmitters.forEach((eventEmitter: IEventEmitter) => {
            if (isJsonRpcResponseError(payload)) {
                const error = new PolisSdkError(payload.error.code,payload.error.message);
                eventEmitter.callback(error, payload);
            } else {
                eventEmitter.callback(null, payload);
            }
        });
    }
}

export default EventManager;
