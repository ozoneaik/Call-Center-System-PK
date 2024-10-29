import axiosClient from "../Axios.js";
import {ErrorResponse} from "./ErrorResponse.js";

const bots = '/bots';

export const botListApi = async () => {
    try {
        const {data,status} = await axiosClient.get(`${bots}/list`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const addOrUpdateBotApi = async ({bot}) => {
    try {
        const {data,status} = await axiosClient.post(`${bots}/storeOrUpdate`, {bot});
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}