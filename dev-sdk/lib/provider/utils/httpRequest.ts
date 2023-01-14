import axios from 'axios';
import loadingDialog  from "./dialog";

axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'

declare module 'axios' {
  interface AxiosInstance {
    (config: AxiosRequestConfig): Promise<any>
  }
}

class HttpService{

    isShowDialog:boolean = true;
    instance:any;


    constructor(isShowDialog:boolean = false) {
        this.isShowDialog = isShowDialog;
        let request = axios.create({
            timeout: 50000,
        });

        request.interceptors.request.use( (config) => {
                this.showDialog();
                return config;
            },
            (error) => {
                this.closeDialog();
                Promise.reject({"status":"ERROR","message":error});
            },
        );

        request.interceptors.response.use(
            (res) => {
                this.closeDialog();
                return res;
            },
            (error) => {
                this.closeDialog();
                return Promise.reject({"status":"ERROR","message":error.message});
            },
        );
        this.instance = request;
    }

    setShowDialog(_isShowDialog:boolean){
        this.isShowDialog = _isShowDialog;
    }

    showDialog() {
       if (this.isShowDialog) {
           loadingDialog.fire({
               html: "Processing...",
               didOpen: () => {
                   loadingDialog.showLoading();
               }
           });
       }
   }

    closeDialog() {
       if (this.isShowDialog) {
           loadingDialog.close();
       }
    }

}
export default new HttpService();
