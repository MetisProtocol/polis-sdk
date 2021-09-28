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
       if (this.isShowDialog) {
           this.loadingDialog.close();
       }
    }

}
export default Service;
