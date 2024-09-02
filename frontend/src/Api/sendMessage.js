import axiosClient from "../Axios.js";
import {ErrorResponse} from "./ErrorResponse.js";

export const SendMessageApi = async (text,sendTo) => {
    const dataBody = {
        to : sendTo,
        messages :
            [{
                type : 'text',
                text : text,
            }]

    }
    try {
        const {data,status} = await axiosClient.post('/sendMessage', {dataBody});
        return {data, status};
    }catch(error) {
        return ErrorResponse(error);
    }
}