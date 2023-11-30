import Swal from 'sweetalert2';
declare module 'axios' {
    interface AxiosInstance {
        (config: AxiosRequestConfig): Promise<any>;
    }
}
declare class Service {
    isShowDialog: boolean;
    instance: any;
    loadingDialog: typeof Swal;
    constructor(isShowDialog?: boolean);
    showDialog(): void;
    closeDialog(): void;
}
export default Service;
