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

export const kbListApi = async (status = '') => {
    try {
        const { data, status: s } = await axiosClient.get(`${kb}/list`, { params: status ? { status } : {} });
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

export const kbUpdateAiApi = async (id, payload) => {
    try {
        const { data, status } = await axiosClient.put(`${kb}/update-ai/${id}`, payload, {
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
