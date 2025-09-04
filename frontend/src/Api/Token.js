/* --------------------------------------------- api เกี่ยวกับ token ----------------------------------------------*/
import {ErrorResponse} from "./ErrorResponse.js";
import axiosClient from "../Axios.js";

const tokens = '/tokens';

export const verifyTokenApi = async ({token}) => {
    try {
        const {data,status} = await axiosClient.post(`${tokens}/verify`, {token});
        return {data, status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const tokenListApi = async () => {
    try {
        const {data,status} = await axiosClient.get(`${tokens}/list`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const storeTokenApi = async (token) => {
    try {
        const {data,status} = await axiosClient.post(`${tokens}/store`, token);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const updateTokenApi = async (token) => {
    try {
        const {data,status} = await axiosClient.put(`${tokens}/update`,token,{
            headers : {
                "Content-Type": "application/json"
            }
        });
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const deleteTokenApi = async (id) => {
    try {
        const {data,status} = await axiosClient.delete(`${tokens}/delete/${id}`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// ------------------------------------------------------------------------------------------------------------