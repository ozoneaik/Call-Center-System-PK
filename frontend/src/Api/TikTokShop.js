/* --------------------------------------------- api ข้อมูลร้าน TikTok Shop ----------------------------------------------*/
import {ErrorResponse} from "./ErrorResponse.js";
import axiosClient from "../Axios.js";

const tiktokShop = '/tiktok-shop';

export const tiktokAccountsApi = async () => {
    try {
        const {data, status} = await axiosClient.get(`${tiktokShop}/accounts`);
        return {data, status};
    } catch (error) {
        return ErrorResponse(error);
    }
}

export const tiktokShopsApi = async (id) => {
    try {
        const {data, status} = await axiosClient.get(`${tiktokShop}/${id}/shops`);
        return {data, status};
    } catch (error) {
        return ErrorResponse(error);
    }
}

export const tiktokOrdersApi = async (id, pageToken = null) => {
    try {
        const {data, status} = await axiosClient.get(`${tiktokShop}/${id}/orders`, {params: {page_token: pageToken || undefined}});
        return {data, status};
    } catch (error) {
        return ErrorResponse(error);
    }
}

export const tiktokProductsApi = async (id, pageToken = null) => {
    try {
        const {data, status} = await axiosClient.get(`${tiktokShop}/${id}/products`, {params: {page_token: pageToken || undefined}});
        return {data, status};
    } catch (error) {
        return ErrorResponse(error);
    }
}
