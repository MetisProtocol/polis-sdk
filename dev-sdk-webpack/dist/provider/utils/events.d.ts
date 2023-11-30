import { IEventEmitter } from "../types";
declare class EventManager {
    private _eventEmitters;
    constructor();
    subscribe(eventEmitter: IEventEmitter): void;
    unsubscribe(event: string): void;
    trigger(payload: any, eventName?: string): void;
}
export default EventManager;
