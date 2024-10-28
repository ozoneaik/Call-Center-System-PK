/* ------------------------------------------ api ที่เกี่ยวกับ ข้อความส่งด่วน ----------------------------------------*/
import {ErrorResponse} from "./ErrorResponse.js";
import axiosClient from "../Axios.js";

const shortChats = '/shortChats';

// ดึงรายการแชทด่วน
export const shortChatApi = async () => {
    try {
        const {data,status} = await axiosClient.get(`${shortChats}/list`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const ListGroupsApi = async () => {
    try {
        const {data,status} = await axiosClient.get(`${shortChats}/list/groups`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const ListModelsApi = async ({group}) => {
    try {
        const {data,status} = await axiosClient.get(`${shortChats}/list/models/${group}`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const ListProblemsApi = async ({group,model}) => {
    try {
        const {data,status} = await axiosClient.get(`${shortChats}/list/problems/${group}/${model}`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const ListContentsApi = async ({group,model,problem}) => {
    try {
        const {data,status} = await axiosClient.get(`${shortChats}/list/contents/${group}/${model}/${problem}`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}


// สร้างหรืออัพเดทแชทด่วน
export const storeOrUpdateChatCreateApi = async (dataForm) => {
    try {
        const {data,status} = await axiosClient.post(`${shortChats}/store`,{...dataForm});
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// ลบแชทด่วน
export const shortChatDeleteApi = async (id) => {
    try {
        const {data,status} = await axiosClient.delete(`${shortChats}/delete/${id}`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}


// ------------------------------------------------------------------------------------------------------------