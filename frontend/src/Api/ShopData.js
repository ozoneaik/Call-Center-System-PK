/* --------------------------------------------- api ข้อมูลร้าน (ออเดอร์/สินค้า) — platform: tiktok | shopee | lazada ----------------------------------------------*/
import {ErrorResponse} from "./ErrorResponse.js";
import axiosClient from "../Axios.js";

const base = (platform) => `/${platform}-shop`;

export const shopAccountsApi = async (platform) => {
    try {
        const {data, status} = await axiosClient.get(`${base(platform)}/accounts`);
        return {data, status};
    } catch (error) {
        return ErrorResponse(error);
    }
}

export const shopInfoApi = async (platform, id) => {
    try {
        const {data, status} = await axiosClient.get(`${base(platform)}/${id}/shops`);
        return {data, status};
    } catch (error) {
        return ErrorResponse(error);
    }
}

export const shopOrdersApi = async (platform, id, pageToken = null) => {
    try {
        const {data, status} = await axiosClient.get(`${base(platform)}/${id}/orders`, {params: {page_token: pageToken || undefined}});
        return {data, status};
    } catch (error) {
        return ErrorResponse(error);
    }
}

export const shopProductsApi = async (platform, id, pageToken = null) => {
    try {
        const {data, status} = await axiosClient.get(`${base(platform)}/${id}/products`, {params: {page_token: pageToken || undefined}});
        return {data, status};
    } catch (error) {
        return ErrorResponse(error);
    }
}
