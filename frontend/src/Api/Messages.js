import axiosClient from "../axios.js";
import {ErrorResponse} from "./ErrorResponse.js";

export const CustomerListNewDm = async (roomId) => {
    try {
        const {data,status} = await axiosClient.get(`/customer/list/CustomerListNewDm/${roomId}`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// ดึงข้อมูลของลูกค้าคนนั้นๆ
export const MessageCustApi = async (custId) => {
    try {
        const {data,status} = await axiosClient.get(`/messages/selectMessage/${custId}`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// ดึงรายการห้องแชท
export const chatRoomListApi = async () => {
    try {
        const {data,status} = await axiosClient.get('chatRoom/list');
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// ดึงรายการแชทด่วน
export const shortChatApi = async () => {
    try {
        const {data,status} = await axiosClient.get('shortChat/list');
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// รับเรื่อง
export const receiveApi = async (custId) => {
    try {
        const {data,status} = await axiosClient.post('messages/receive', {custId});
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const endTalkApi = async (custId) => {
    try {
        const {data,status} = await axiosClient.post('/messages/endTalk',{custId});
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}