declare module 'axios' {
    interface AxiosInstance {
        (config: AxiosRequestConfig): Promise<any>;
    }
}
declare class HttpService {
    isShowDialog: boolean;
    instance: any;
    constructor(isShowDialog?: boolean);
    setShowDialog(_isShowDialog: boolean): void;
    showDialog(): void;
    closeDialog(): void;
}
declare const _default: HttpService;
export default _default;
