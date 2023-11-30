import { IOauth2Info } from "./types";
export declare class PolisOauth2Client {
    _apiHost: string;
    private _authInfo?;
    _appId: string;
    _refreshToken: string;
    constructor(apiHost: string, appId: string, oauthInfo: IOauth2Info);
    get apiHost(): string;
    get appId(): string;
    get oauthInfo(): IOauth2Info;
    refreshToken(callback?: Function): void;
    refreshTokenAsync(): Promise<any>;
    handleRefreshTokenAsync(): Promise<any>;
}
