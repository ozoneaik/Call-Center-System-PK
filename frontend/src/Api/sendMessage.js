import axiosClient from "../Axios.js";
import {ErrorResponse} from "./ErrorResponse.js";


const prefix = '/messages'
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

export const MessageAllAPi = async () => {
    try {
        const {data,status} = await axiosClient.get(`${prefix}/listMessage`);
        return {data, status};
    }catch(error) {
        return ErrorResponse(error);
    }
}

export const MessageSelectApi = async (id) => {
    try {
        const {data,status} = await axiosClient.get(`${prefix}/selectMessage/${id}`);
        return {data, status};
    }catch(error) {
        return ErrorResponse(error);
    }
}