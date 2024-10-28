/* --------------------------------------------- api เกี่ยวกับ note ----------------------------------------------*/
import axiosClient from "../Axios.js";
import {ErrorResponse} from "./ErrorResponse.js";

const notes = '/notes';
export const storeNoteApi = async ({text,custId}) => {
    try {
        const {data,status} = await axiosClient.post(`${notes}/store`,{custId,text});
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const updateNoteApi = async ({text,id}) => {
    try {
        const {data,status} = await axiosClient.put(`${notes}/update`,{id,text});
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const deleteNoteApi = async ({id}) => {
    try {
        const {data,status} = await axiosClient.delete(`${notes}/delete/${id}`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// ------------------------------------------------------------------------------------------------------------