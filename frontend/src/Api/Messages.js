import axiosClient from "../axios.js";
import {ErrorResponse} from "./ErrorResponse.js";




/* ------------------------------------------api ที่เกี่ยวกับ ห้องแชท ---------------------------------------------*/
const chatRooms = '/chatRooms';
// ดึงรายการห้องแชท
export const chatRoomListApi = async () => {
    try {
        const {data,status} = await axiosClient.get(`${chatRooms}/list`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// ดึงรายการห้องแชท
export const storeOrUpdateChatRoomsApi = async (chatRoom) => {
    try {
        const {data,status} = await axiosClient.post(`${chatRooms}/store`, chatRoom);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}
// ลบห้องแชท
export const deleteChatRoomsApi = async (roomId) => {
    try {
        const {data,status} = await axiosClient.delete(`${chatRooms}/delete/${roomId}`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}
// ------------------------------------------------------------------------------------------------------------
/* ------------------------------------------ api ที่เกี่ยวกับ ข้อความส่งด่วน ----------------------------------------*/
const shortChats = '/shortChats';

// ดึงรายการแชทด่วน
export const shortChatApi = async () => {
    try {
        const {data,status} = await axiosClient.get(`${shortChats}/list`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// สร้างหรืออัพเดทแชทด่วน
export const storeOrUpdateChatCreateApi = async (shortChat) => {
    try {
        const {data,status} = await axiosClient.post(`${shortChats}/store`,{...shortChat});
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// ลบแชทด่วน
export const shortChatDeleteApi = async (id) => {
    try {
        const {data,status} = await axiosClient.delete(`${shortChats}/delete/${id}`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}


// ------------------------------------------------------------------------------------------------------------
/* ----------------------------------------api ที่เกี่ยวกับการจัดการเกี่ยวกับ Chats ------------------------------------*/
const messages = '/messages';

// ส่งแชท
export const sendApi = async ({msg,custId,conversationId}) => {
    const body = {
        custId : custId,
        conversationId,
        messages : [{
            content : msg.content,
            contentType : msg.contentType,
            sender : 'sender'
        }]
    };
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
export const endTalkApi = async ({rateId,activeConversationId}) => {
    try {
        const {data,status} = await axiosClient.post(`${messages}/endTalk`,{rateId,activeConversationId});
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
export const selectMessageApi = async (rateId,activeId,custId) => {
    try {
        const {data,status} = await axiosClient.post(`${display}/select/${custId}`,{rateId,activeId});
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}
// ------------------------------------------------------------------------------------------------------------
/* ------------------------------------------- api เกี่ยวกับ customer -------------------------------------------*/
const customers = '/customers';
// ดึงรายการลูกค้า
export const customersListApi = async () => {
    try {
        const {data,status} = await axiosClient.get(`${customers}/list`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// แก้ไขข้อมูลลูกค้า
export const customerUpdateApi = async (customer) => {
    try {
        console.log(customer)
        const {data, status} = await axiosClient.put(`${customers}/update`, {customer});
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// ------------------------------------------------------------------------------------------------------------
/* --------------------------------------------- api เกี่ยวกับ user ----------------------------------------------*/
const users = '/users';

// ดึงรายการผู้ใช้
export const usersListApi = async () => {
    try {
        const {data,status} = await axiosClient.get(`${users}/list`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const storeUserApi = async (user) => {
    try {
        const {data,status} = await axiosClient.post(`${users}/store`, {user});
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// ดึงรายการผู้ใช้
export const deleteUserApi = async (empCode) => {
    try {
        const {data,status} = await axiosClient.delete(`${users}/delete/${empCode}`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// อัพเดทผู้ใช้
export const updateUserApi = async ({empCode, user}) => {
    try {
        const {data,status} = await axiosClient.put(`${users}/update/${empCode}`,user);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// ------------------------------------------------------------------------------------------------------------
/* --------------------------------------------- api เกี่ยวกับ note ----------------------------------------------*/
const notes = '/notes';
export const storeNoteApi = async ({text,custId}) => {
    try {
        const {data,status} = await axiosClient.post(`${notes}/store`,{custId,text});
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const updateNoteApi = async ({text,id}) => {
    try {
        const {data,status} = await axiosClient.put(`${notes}/update`,{id,text});
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const deleteNoteApi = async ({id}) => {
    try {
        const {data,status} = await axiosClient.delete(`${notes}/delete/${id}`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}
