import { IOauth2Client, IOauth2User } from './interfaces';
import endpoints from './endpoints';
export declare class Oauth2Client implements IOauth2Client {
    endpoints: endpoints;
    oauthRedirectUrl: string;
    apiHost: string;
    oauth2User?: IOauth2User;
    constructor(apiHost?: string);
    startOauth2(appId: string, returnUrl: string, newWindow?: boolean, switchAccount?: boolean): Window | null;
    logout(appId: string, accessToken: string, refreshToken: string): Promise<any>;
    setUser(oauth2User: IOauth2User): void;
    refreshToken(appId: string, refreshToken: string, callback?: Function): void;
    refreshTokenAsync(appId: string, refreshToken: string): Promise<any>;
    getUserInfoAsync(accessToken?: string): Promise<any>;
}
