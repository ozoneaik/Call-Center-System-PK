import Swal from "sweetalert2";
import {updateNoteApi} from "../Api/Messages.js";

const options = {
    showCancelButton: true,
    showConfirmButton: true,
    confirmButtonText: 'ตกลง',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#f15721'
}

export const AlertDiaLog = ({title, text, icon, Outside, timer, onPassed}) => {
    Swal.fire({
        title: title,
        text: text,
        icon: icon ? icon : 'error',
        allowOutsideClick: Outside ? Outside : false,
        timer: timer ? timer : null,
        ...options,
    }).then((result) => {
        onPassed(result.isConfirmed);
    })
}


export const AlertWithForm = ({text, onPassed, id}) => {
    Swal.fire({
        title: "แก้ไขโน้ต",
        input: "text",
        inputValue: text,
        inputAttributes: {autocapitalize: "off"},
        ...options,
        preConfirm: async (input) => {
            try {
                const {data, status} = await updateNoteApi({id, text: input});
                if (status !== 200) {
                    return Swal.showValidationMessage(`${data.message}`);
                }
                return {textUpdate : input};
            } catch (error) {
                Swal.showValidationMessage(`Request failed: ${error}`);
            }
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        console.log(result)
        if (result.isConfirmed) {
            let textUpdate = result.value.textUpdate;
            onPassed({confirm: result.isConfirmed,textUpdate : textUpdate,id});
        }
    });
}