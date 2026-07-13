import axiosClient from "../Axios.js";
import { ErrorResponse } from "./ErrorResponse.js";

const base = '/platform-routing';

export const platformRoutingListApi = async () => {
    try {
        const { data, status } = await axiosClient.get(`${base}`);
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

export const allowedRoomsApi = async (tokenId, type = 'forward') => {
    try {
        const { data, status } = await axiosClient.get(`${base}/allowed-rooms/${tokenId}?type=${type}`);
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

export const updatePlatformRoutingRulesApi = async ({ token_id, rules }) => {
    try {
        const { data, status } = await axiosClient.post(`${base}/update-rules`, { token_id, rules });
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};
