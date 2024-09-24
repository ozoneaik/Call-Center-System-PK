import Swal from "sweetalert2";

const options = {
    showCancelButton: true,
    showConfirmButton: true,
    confirmButtonText: 'ตกลง',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#f15721'
}

export const AlertDiaLog = ({title, text, icon, Outside,timer, onPassed}) => {
    Swal.fire({
        title : title,
        text : text,
        icon : icon ? icon : 'error',
        allowOutsideClick : Outside ? Outside : false,
        timer: timer ? timer : null,
        ...options,
    }).then((result) => {
        onPassed(result.isConfirmed);
    })
}