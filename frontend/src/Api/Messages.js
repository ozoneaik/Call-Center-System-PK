import axiosClient from "../axios.js";
import {ErrorResponse} from "./ErrorResponse.js";

const display = '/display';

// ดึงรายการแชทตามห้อง
export const MessageListApi = async (roomId) => {
    try {
        const {data,status} = await axiosClient.get(`${display}/message/list/${roomId}`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// ดึงรายการแชทของลูกค้าคนนั้นๆ
export const selectMessageApi = async (rateId,activeId,custId) => {
    try {
        const {data,status} = await axiosClient.post(`${display}/select/${custId}`,{rateId,activeId});
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// ดึงรายการห้องแชท
export const chatRoomListApi = async () => {
    try {
        const {data,status} = await axiosClient.get('chatRooms/list');
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// ดึงรายการแชทด่วน
export const shortChatApi = async () => {
    try {
        const {data,status} = await axiosClient.get('shortChats/list');
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// รับเรื่อง
export const receiveApi = async (rateId,roomId) => {
    try {
        const {data,status} = await axiosClient.post('messages/receive', {rateId,roomId});
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// จบการสนทนา
export const endTalkApi = async (custId) => {
    try {
        const {data,status} = await axiosClient.post('/messages/endTalk',{custId});
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}