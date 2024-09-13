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

export const listCustNewDmAPi = async () => {
    try {
        const {data,status} = await axiosClient.get(`${prefix}/list/CustomerListNewDm`);
        return {data, status};
    }catch(error) {
        return ErrorResponse(error);
    }
}

export const CustDetailApi = async (custId) => {
    try {
        const {data,status} = await axiosClient.get(`${prefix}/detail/${custId}`);
        return {data, status};
    }catch(error) {
        return ErrorResponse(error);
    }
}

export const UpdateCustDetailApi = async (custId,detail) => {
    try {
        const {data,status} = await axiosClient.post(`${prefix}/update`,{custId,detail});
        return {data, status};
    }catch(error) {
        return ErrorResponse(error);
    }
}
export const changeUserReplyApi = async (Item,custId) => {
    try {
        const {data,status} = await axiosClient.post(`${prefix}/changeUserReply`,{Item,custId});
        return {data, status};
    }catch(error) {
        return ErrorResponse(error);
    }
}

