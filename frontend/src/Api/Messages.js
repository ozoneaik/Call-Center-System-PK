import axiosClient from "../axios.js";
import {ErrorResponse} from "./ErrorResponse.js";

/* ----------------------------------------api ที่เกี่ยวกับการจัดการเกี่ยวกับ Chats ------------------------------------*/
const messages = '/messages';
// ส่งแชท
export const sendApi = async ({msg,contentType,custId,conversationId,selectedFile}) => {
    let Messages = [{
        content : msg,
        contentType : contentType,
        sender : 'sender'
    }];
    if (selectedFile) {
        Messages.push({
            content: selectedFile,
            contentType: 'image',
            sender : 'sender'
        })
    }else console.log('🙏')
    const body = {
        custId : custId,
        conversationId,
        messages : Messages
    };
    console.log(body,msg)
    try {
        const {data,status} = await axiosClient.post(`${messages}/send`, {...body});
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// รับเรื่อง
export const receiveApi = async (rateId,roomId) => {
    try {
        const {data,status} = await axiosClient.post(`${messages}/receive`, {rateId,roomId});
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const senToApi = async ({rateId, activeConversationId,latestRoomId}) => {
    try {
        const {data,status} = await axiosClient.post(`${messages}/sendTo`, {rateId, activeConversationId,latestRoomId});
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// จบการสนทนา
export const endTalkApi = async ({rateId,activeConversationId,tagId}) => {
    try {
        const {data,status} = await axiosClient.post(`${messages}/endTalk`,{rateId,activeConversationId,tagId});
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}
// ------------------------------------------------------------------------------------------------------------
/* ------------------------------------------ api แสดงผลเกี่ยวกับ chats ------------------------------------------*/
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
export const selectMessageApi = async (rateId,activeId,custId,from) => {
    try {
        const {data,status} = await axiosClient.post(`${display}/select/${custId}/${from}`,{rateId,activeId});
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}
// ------------------------------------------------------------------------------------------------------------


/* ------------------------------------------ api เกี่ยวกับ Dashboard -------------------------------------------*/
export const DashboardApi = async (currentDate) => {
    try {
        const {data,status} = await axiosClient.get(`/dashboard`,{
            params: { date: currentDate }
        });
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// ------------------------------------------------------------------------------------------------------------
/* ------------------------------------------ api เกี่ยวกับ MyMessages -------------------------------------------*/
export const MyMessagesApi = async (empCode) => {
    try {
        const {data,status} = await axiosClient.get(`/myMessages/${empCode}`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const chatHistoryApi = async () => {
    try {
        const {data,status} = await axiosClient.get(`/chatHistory`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}