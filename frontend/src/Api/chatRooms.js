import axiosClient from "../Axios.js";
import {ErrorResponse} from "./ErrorResponse.js";

const prefix = '/chatRoom'
export const chatRoomListApi = async () => {
    try{
        const {data,status} = await axiosClient.get(`${prefix}/list`)
        return {data,status}
    }catch(error){
        return ErrorResponse(error);
    }
}

export const changeRoomApi = async (roomId,custId) => {
    try{
        const {data,status} = await axiosClient.post(`/customer/changeRoom`,{roomId,custId});
        return {data,status}
    }catch(error){
        return ErrorResponse(error);
    }
}