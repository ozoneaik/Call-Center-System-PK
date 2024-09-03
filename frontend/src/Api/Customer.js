import axiosClient from "../Axios.js";
import {ErrorResponse} from "./ErrorResponse.js";



const prefix = '/customer';
export const listCustApi = async () => {
    try {
        const {data,status} = await axiosClient.get(`${prefix}/list`);
        return {data, status};
    }catch(error) {
        return ErrorResponse(error);
    }
}