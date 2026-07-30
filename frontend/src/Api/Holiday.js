import axiosClient from "../Axios.js";
import { ErrorResponse } from "./ErrorResponse";

const prefix = '/holidays';

export const HolidayListApi = async () => {
    try {
        const { data, status } = await axiosClient.get(`${prefix}/list`);
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

export const createHolidayApi = async (holiday) => {
    try {
        const { data, status } = await axiosClient.post(`${prefix}/store`, holiday);
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

export const updateHolidayApi = async (id, holiday) => {
    try {
        const { data, status } = await axiosClient.put(`${prefix}/update/${id}`, holiday, {
            headers: { 'Content-Type': 'application/json' }
        });
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

export const deleteHolidayApi = async (id) => {
    try {
        const { data, status } = await axiosClient.delete(`${prefix}/delete/${id}`);
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};
