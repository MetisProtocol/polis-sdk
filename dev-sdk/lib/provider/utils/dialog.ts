import Swal from 'sweetalert2';

const dialog = Swal.mixin({
    customClass:{
        container: 'polis-swal2-container'
    },
    showClass: {
        popup: 'polis-swal2-show',
    }
});

export function showLoading() {
    const loadingDialog = Swal.mixin({
        customClass:{
            container: 'polis-loading-swal2-container'
        },
        showClass: {
            popup: 'polis-loading-swal2-show',
        }
    });
    loadingDialog.fire({
        html: 'Processing...',
        didOpen: () => {
            Swal.showLoading();
        },
        allowOutsideClick:false,
    });
    return loadingDialog;
}

export default dialog;