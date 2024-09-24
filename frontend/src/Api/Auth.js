import axiosClient from "../axios.js";
import {ErrorResponse} from "./ErrorResponse.js";


export const loginApi = async (email,password) =>{
    try {
        const {data,status} = await axiosClient.post('/login',{email,password});
        return {data, status};
    }catch(error) {
        return ErrorResponse(error);
    }
}

export const profileApi = async () => {
    try {
        const {data,status} = await axiosClient.get('/profile');
        return {data, status};
    }catch(error) {
        return ErrorResponse(error);
    }
}

export const logoutApi = async () => {
    try {
        const {data,status} = await axiosClient.post('/logout');
        return {data, status};
    }catch(error) {
        return ErrorResponse(error);
    }
}