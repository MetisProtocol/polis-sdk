import axios from 'axios'
import Swal from 'sweetalert2';


axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'

declare module 'axios' {
  interface AxiosInstance {
    (config: AxiosRequestConfig): Promise<any>
  }
}

class Service{

    isShowDialog:boolean = true;
    instance:any;

    loadingDialog = Swal.mixin({});

    constructor(isShowDialog:boolean = true) {
        this.isShowDialog = isShowDialog;
        let request = axios.create({
            timeout: 50000
        });

        request.interceptors.request.use( (config) => {
                this.showDialog();
                return config;
            },
            (error) => {
                this.closeDialog();
                Promise.reject(error);
            },
        );

        request.interceptors.response.use(
            (res) => {
                if (isShowDialog) {
                    this.closeDialog();
                }
                return res;
            },
            (error) => {
                this.closeDialog();
                return Promise.reject(error.response);
            },
        );
        this.instance = request;
    }


    showDialog() {
       if (this.isShowDialog) {
           this.loadingDialog.fire({
               html: "Processing...",
               didOpen: () => {
                   Swal.showLoading();
               }
           });
       }
   }

    closeDialog() {
       if (!this.isShowDialog) {
           this.loadingDialog.close();
       }
    }

}
export default Service;
