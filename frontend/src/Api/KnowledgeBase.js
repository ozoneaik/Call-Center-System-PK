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

export const kbDeleteApi = async (id) => {
    try {
        const { data, status } = await axiosClient.delete(`${kb}/delete/${id}`);
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};
