import Swal from "sweetalert2";

const options = {
    confirmButtonColor: '#f16a4b',
    allowOutsideClick: false,
    showCancelButton: true,
}

export const AlertWithConfirm = (
    {
        title,
        text,
        icon = 'error',
        cancelButtonText = 'ปิด',
        confirmButtonText = 'ตกลง',
        onPassed
    }) => {
    Swal.fire({
        icon, title, text, cancelButtonText, confirmButtonText,
        ...options
    }).then((result) => {
        if (result.isConfirmed) {
            onPassed(true);
        } else {
            onPassed(false);
        }
    })
}

export const AlertStandard = ({title, text, icon = 'error'}) => {
    Swal.fire({
        icon,
        title,
        text,
        ...options
    }).then((result) => {
        console.log(result);
    })
}