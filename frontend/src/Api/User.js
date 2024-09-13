import axiosClient from "../Axios.js";
import {ErrorResponse} from "./ErrorResponse.js";

const prefix = '/user'
export const userListApi = async () => {
    try {
        const {data,status} = await axiosClient.get(`${prefix}/list`);
        return {data, status};
    }catch(error) {
        return ErrorResponse(error);
    }
}
export const deleteUserApi = async (code) => {
    try {
        const {data,status} = await axiosClient.post(`${prefix}/delete`,{code});
        return {data, status};
    }catch(error) {
        return ErrorResponse(error);
    }
}