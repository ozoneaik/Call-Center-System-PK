import axiosClient from "../Axios.js";
import { ErrorResponse } from "./ErrorResponse"

const prefix = '/keywords'
export const KeywordListApi = async () => {
    try{
        const {data, status} = await axiosClient.get(`${prefix}/list`);
        return {data, status}
    }catch(error){
        return ErrorResponse(error)
    }
}

export const createKeywordApi = async ({keyword}) => {
    try {
        const {data, status} = await axiosClient.post(`${prefix}/store`, keyword);
        return {data, status}
    } catch (error) {
        return ErrorResponse(error)
    }
}

export const updateKeywordApi = async ({keywordId, keyword}) => {
    try {
        const {data, status} = await axiosClient.put(`${prefix}/update/${keywordId}`, keyword,{
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return {data, status}
    } catch (error) {
        return ErrorResponse(error)
    }
}

export const deleteKeywordApi = async ({keywordId}) => {
    try {
        const {data, status} = await axiosClient.delete(`${prefix}/delete/${keywordId}`);
        return {data, status}
    } catch (error) {
        return ErrorResponse(error)
    }
}
