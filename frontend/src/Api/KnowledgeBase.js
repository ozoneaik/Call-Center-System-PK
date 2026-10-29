import axiosClient from "../Axios.js";
import { ErrorResponse } from "./ErrorResponse.js";

const kb = '/knowledge-base';

export const kbStatsApi = async () => {
    try {
        const { data, status } = await axiosClient.get(`${kb}/stats`);
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

export const kbListApi = async (options = {}) => {
    try {
        const { status = 'all', tagName = null, showInactive = false, search = '', page = 1, perPage = 20 } = options;
        const params = { page, per_page: perPage };
        if (status && status !== 'all') params.status   = status;
        if (tagName && tagName !== 'all') params.tag_name = tagName;
        if (showInactive) params.inactive = true;
        if (search) params.search = search;
        const { data, status: s } = await axiosClient.get(`${kb}/list`, { params });
        return { data, status: s };
    } catch (error) {
        return ErrorResponse(error);
    }
};

export const kbShowApi = async (id) => {
    try {
        const { data, status } = await axiosClient.get(`${kb}/show/${id}`);
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

export const kbConversationApi = async (id) => {
    try {
        const { data, status } = await axiosClient.get(`${kb}/conversation/${id}`);
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

export const kbTagsApi = async () => {
    try {
        const { data, status } = await axiosClient.get(`${kb}/tags`);
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

export const kbUpdateApi = async (id, payload) => {
    try {
        const { data, status } = await axiosClient.put(`${kb}/update/${id}`, payload, {
            headers: { 'Content-Type': 'application/json' },
        });
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

export const kbApproveApi = async (id) => {
    try {
        const { data, status } = await axiosClient.put(`${kb}/approve/${id}`, {}, {
            headers: { 'Content-Type': 'application/json' },
        });
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

export const kbRejectApi = async (id, payload) => {
    try {
        const { data, status } = await axiosClient.put(`${kb}/reject/${id}`, payload, {
            headers: { 'Content-Type': 'application/json' },
        });
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

export const kbApproveEditedApi = async (id, payload) => {
    try {
        const { data, status } = await axiosClient.put(`${kb}/approve-edited/${id}`, payload, {
            headers: { 'Content-Type': 'application/json' },
        });
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

export const kbResetApi = async (id) => {
    try {
        const { data, status } = await axiosClient.put(`${kb}/reset/${id}`, {}, {
            headers: { 'Content-Type': 'application/json' },
        });
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

export const kbToggleActiveApi = async (id) => {
    try {
        const { data, status } = await axiosClient.put(`${kb}/toggle-active/${id}`, {});
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

// แท็บ "จัดการข้อความส่งอัตโนมัติ" — รายการที่อนุมัติแล้ว (autoReply: 'all' | 'on' | 'off')
export const kbAutoReplyListApi = async (options = {}) => {
    try {
        const { autoReply = 'all', tagName = null, search = '', page = 1, perPage = 20 } = options;
        const params = { page, per_page: perPage };
        if (autoReply && autoReply !== 'all') params.auto_reply = autoReply;
        if (tagName && tagName !== 'all') params.tag_name = tagName;
        if (search) params.search = search;
        const { data, status } = await axiosClient.get(`${kb}/auto-reply/list`, { params });
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

// เปิด/ปิด AI ตอบอัตโนมัติ — ids รับได้หลายรายการ
export const kbSetAutoReplyApi = async (ids, enabled) => {
    try {
        const { data, status } = await axiosClient.put(`${kb}/auto-reply`, { ids, enabled }, {
            headers: { 'Content-Type': 'application/json' },
        });
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

// ค่าตั้งระบบ AI ตอบอัตโนมัติ: { mode: 'off'|'shadow'|'live', min_score, min_margin }
export const kbAutoReplySettingsApi = async () => {
    try {
        const { data, status } = await axiosClient.get(`${kb}/auto-reply/settings`);
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

export const kbUpdateAutoReplySettingsApi = async (payload) => {
    try {
        const { data, status } = await axiosClient.put(`${kb}/auto-reply/settings`, payload, {
            headers: { 'Content-Type': 'application/json' },
        });
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

// บันทึกการตัดสินใจของระบบ (decision: 'all' หรือค่าเฉพาะ เช่น 'sent', 'would_send')
export const kbAutoReplyLogsApi = async ({ decision = 'all', page = 1, perPage = 20 } = {}) => {
    try {
        const params = { page, per_page: perPage };
        if (decision && decision !== 'all') params.decision = decision;
        const { data, status } = await axiosClient.get(`${kb}/auto-reply/logs`, { params });
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

// ทดลองพิมพ์คำถาม ดูว่าจะจับคู่กับรายการไหน (ไม่เรียก AI ไม่ส่งข้อความ)
export const kbAutoReplyTestApi = async (q, useAi = false) => {
    try {
        const { data, status } = await axiosClient.get(`${kb}/auto-reply/test`, { params: { q, use_ai: useAi ? 1 : 0 } });
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

// แก้ "คำที่ใช้แทนกัน" ของรายการ KB (คั่นด้วย "|")
export const kbUpdateAltApi = async (id, alt) => {
    try {
        const { data, status } = await axiosClient.put(`${kb}/alt/${id}`, { alt }, {
            headers: { 'Content-Type': 'application/json' },
        });
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

export const kbDeleteApi = async (id) => {
    try {
        const { data, status } = await axiosClient.delete(`${kb}/delete/${id}`);
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};
