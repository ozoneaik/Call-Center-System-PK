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

export const ListForForm = async () => {
    try {
        const {data,status} = await axiosClient.get(`${shortChats}/listForForm`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const ListGroupsApi = async () => {
    try {
        const {data,status} = await axiosClient.get(`${shortChats}/list/groups`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const ListModelsApi = async ({group}) => {
    try {
        const {data,status} = await axiosClient.get(`${shortChats}/list/models/${group}`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const ListProblemsApi = async ({group,model}) => {
    try {
        const {data,status} = await axiosClient.get(`${shortChats}/list/problems/${group}/${model}`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const ListContentsApi = async ({group,model,problem}) => {
    try {
        const {data,status} = await axiosClient.get(`${shortChats}/list/contents/${group}/${model}/${problem}`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}


// สร้างหรืออัพเดทแชทด่วน
export const storeOrUpdateChatCreateApi = async (dataForm) => {
    try {
        const {data,status} = await axiosClient.post(`${shortChats}/store`,{...dataForm});
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


export const testSendApi = async ({msg, custId, conversationId}) => {
    const body = {
        custId : custId,
        conversationId : conversationId,
        messages : []
    }
    try {
        const {data,status} = await axiosClient.post(`test`, {...body});
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

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
    console.log(user)
    try {
        const {data,status} = await axiosClient.post(`${users}/store`, user);
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

// ------------------------------------------------------------------------------------------------------------
/* --------------------------------------------- api เกี่ยวกับ note ----------------------------------------------*/
const tokens = '/tokens';
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
        const {data,status} = await axiosClient.put(`${tokens}/update`,token);
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
/* ------------------------------------------ api เกี่ยวกับ Dashboard -------------------------------------------*/
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