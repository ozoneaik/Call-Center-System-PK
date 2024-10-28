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

export const addBotApi = async ({bot}) => {
    try {
        const {data,status} = await axiosClient.post(`${bots}/store`, {
            menuName : bot.menuName,
            roomId : bot.roomId
        });
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const updateBotApi = async ({id, bot}) => {
    try {
        const {data,status} = await axiosClient.put(`${bots}/update/${id}`, {
            menuName : bot.menuName,
            roomId : bot.roomId
        }, {
            headers : {
                'Content-Type': 'application/json',
            }
        });

        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}


export const deleteBotApi = async (id) => {
    try {
        const {data,status} = await axiosClient.delete(`${bots}/delete/${id}`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}