import axiosClient from "../Axios.js";
import { ErrorResponse } from "./ErrorResponse.js";

/* ----------------------------------------api ที่เกี่ยวกับการจัดการเกี่ยวกับ Chats ------------------------------------*/
const messages = '/messages';
// ส่งแชท
export const sendApi = async ({ msg, contentType, custId, conversationId, selectedFile }) => {
    let Messages = [];
    if (msg) {
        Messages.push({
            content: msg,
            contentType: contentType,
            sender: 'sender'
        })
    }
    if (selectedFile) {
        console.log('select file >> ', selectedFile)
        const files = Array.isArray(selectedFile) ? selectedFile : Array.from(selectedFile);
        files.forEach((file) => {
            const fileContentType = file.type === 'image/png' || file.type === 'image/jpeg' ? 'image' :
                file.type.startsWith('video/') ? 'video' : file.type.startsWith('application/pdf') ? 'file' : 'unknown';
            Messages.push({
                content: file,
                contentType: fileContentType,
                sender: 'sender'
            });
        });
    } else console.log('🙏')
    const body = {
        custId: custId,
        conversationId,
        messages: Messages
    };
    console.log(body, msg)
    try {
        const { data, status } = await axiosClient.post(`${messages}/send`, { ...body }, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
}

// รับเรื่อง
export const receiveApi = async (rateId, roomId) => {
    try {
        const { data, status } = await axiosClient.post(`${messages}/receive`, { rateId, roomId });
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
}

export const senToApi = async ({ rateId, activeConversationId, latestRoomId }) => {
    try {
        const { data, status } = await axiosClient.post(`${messages}/sendTo`, { rateId, activeConversationId, latestRoomId });
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
}

// พักการสนทนา
export const pauseTalkApi = async ({activeConversationId, rateId}) => {
    try {
        const { data, status } = await axiosClient.post(`${messages}/pauseTalk`, {activeConversationId,rateId});
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
}

// จบการสนทนา
export const endTalkApi = async ({ rateId, activeConversationId, tagId ,Assessment,note = null}) => {
    try {
        const { data, status } = await axiosClient.post(`${messages}/endTalk`, { rateId, activeConversationId, tagId,Assessment,note });
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
}
// ------------------------------------------------------------------------------------------------------------
/* ------------------------------------------ api แสดงผลเกี่ยวกับ chats ------------------------------------------*/
const display = '/display';

// ดึงรายการแชทตามห้อง
export const MessageListApi = async (roomId) => {
    try {
        const { data, status } = await axiosClient.get(`${display}/message/list/${roomId}`);
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
}

// ดึงรายการแชทของลูกค้าคนนั้นๆ
export const selectMessageApi = async (rateId, activeId, custId, from) => {
    try {
        const { data, status } = await axiosClient.post(`${display}/select/${custId}/${from}`, { rateId, activeId });
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
}

export const myCaseApi = async () => {
    try {
        const { data, status } = await axiosClient.get(`/myCase`);
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
}
// ------------------------------------------------------------------------------------------------------------


/* ------------------------------------------ api เกี่ยวกับ Dashboard -------------------------------------------*/
export const DashboardApi = async (currentDate) => {
    try {
        const { data, status } = await axiosClient.get(`/dashboard`, {
            params: { date: currentDate }
        });
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
}

// ------------------------------------------------------------------------------------------------------------
/* ------------------------------------------ api เกี่ยวกับ MyMessages -------------------------------------------*/
export const MyMessagesApi = async (empCode) => {
    try {
        const { data, status } = await axiosClient.get(`/myMessages/${empCode}`);
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
}

export const chatHistoryApi = async ({page=1}) => {
    try {
        const { data, status } = await axiosClient.get(`/chatHistory?page=${page}`);
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
}

export const endTalkAllProgressApi = async (props) => {
    const { roomId, list } = props;
    try {
        console.log(props)
        const { data, status } = await axiosClient.post(`/endTalkAllProgress/${roomId}`, {
            list: list,
        });
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
}

export const endTalkAllPendingApi = async (props) => {
    let { roomId, list, startTime, endTime } = props;
    console.log(props);
    startTime = new Date(startTime).toISOString();
    endTime = new Date(endTime).toISOString();
    const Filter = list.filter((item) => item.updated_at > startTime && item.updated_at < endTime);
    console.log('Filter >> ', Filter);
    try {
        const { data, status } = await axiosClient.post(`/endTalkAllPending/${roomId}`, {
            list: Filter,
            startTime,
            endTime
        });
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
}