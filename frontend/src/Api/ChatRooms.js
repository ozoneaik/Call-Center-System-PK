/* ------------------------------------------api ที่เกี่ยวกับ ห้องแชท ---------------------------------------------*/
import axiosClient from "../Axios.js";
import {ErrorResponse} from "./ErrorResponse.js";

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