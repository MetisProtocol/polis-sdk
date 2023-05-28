/// <reference types="node" />
import { BrowserInfo, BotInfo, NodeInfo, SearchBotDeviceInfo, ReactNativeInfo } from "detect-browser";
export declare function detectEnv(userAgent?: string): BrowserInfo | BotInfo | NodeInfo | SearchBotDeviceInfo | ReactNativeInfo | null;
export declare function detectOS(): import("detect-browser").OperatingSystem | NodeJS.Platform;
export declare function isAndroid(): boolean;
export declare function isIOS(): boolean;
export declare function isMobile(): boolean;
export declare function isNode(): boolean;
