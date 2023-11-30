import { JsonRpcMiddleware } from 'json-rpc-engine';
import { IPolisProviderOpts } from "./types";
import SafeEventEmitter from '@metamask/safe-event-emitter';
export default function createPolisConnectMiddleware(opts: IPolisProviderOpts, provider?: SafeEventEmitter): JsonRpcMiddleware<unknown, unknown>;
