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

/** filters: {q, status, chat} — ค่าว่างไม่ส่ง (chat: yes | no ผู้ซื้อเคย/ยังไม่เคยแชท — เฉพาะ Shopee) */
export const shopOrdersApi = async (platform, id, pageToken = null, filters = {}) => {
    try {
        const params = {page_token: pageToken || undefined, q: filters.q || undefined, status: filters.status || undefined, chat: filters.chat || undefined};
        const {data, status} = await axiosClient.get(`${base(platform)}/${id}/orders`, {params});
        return {data, status};
    } catch (error) {
        return ErrorResponse(error);
    }
}

/** filters: {q, status} — ค่าว่างไม่ส่ง */
export const shopOrderDetailApi = async (platform, id, orderId) => {
    try {
        const {data, status} = await axiosClient.get(`${base(platform)}/${id}/orders/${encodeURIComponent(orderId)}`);
        return {data, status};
    } catch (error) {
        return ErrorResponse(error);
    }
}

export const shopProductsApi = async (platform, id, pageToken = null, filters = {}) => {
    try {
        const params = {page_token: pageToken || undefined, q: filters.q || undefined, status: filters.status || undefined};
        const {data, status} = await axiosClient.get(`${base(platform)}/${id}/products`, {params});
        return {data, status};
    } catch (error) {
        return ErrorResponse(error);
    }
}
