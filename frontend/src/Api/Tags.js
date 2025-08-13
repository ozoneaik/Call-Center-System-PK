import axiosClient from "../Axios.js";
import {ErrorResponse} from "./ErrorResponse.js";

const tags = '/tags';

export const listTagsApi = async () => {
    try {
        const {data, status} = await axiosClient.get(`${tags}/list`);
        return {data, status};
    }catch (error) {
        return ErrorResponse(error);
    }
}

export const storeTagsApi = async ({tagName}) => {
    try {
        const {data, status} = await axiosClient.post(`${tags}/store`, {tagName});
        return {data, status};
    }catch (error) {
        return ErrorResponse(error);
    }
}

export const updateTagsApi = async ({tagName,id}) => {
    try {
        const {data, status} = await axiosClient.put(`${tags}/update`, {tagName,id},{
            headers: {'Content-Type': 'application/json'}
        });
        return {data, status};
    }catch (error) {
        return ErrorResponse(error);
    }
}

export const deleteTagApi = async ({id}) => {
    try {
        const {data, status} = await axiosClient.delete(`${tags}/delete/${id}`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const listTagGroupsApi = async () => {
    try {
        const { data, status } = await axiosClient.get("/tag-group/list");
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

export const deleteTagGroupApi = async ({ id }) => {
    try {
        const { data, status } = await axiosClient.delete(`/tag-group/delete/${id}`);
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

export const storeTagGroupApi = async (payload) => {
  try {
    const { data, status } = await axiosClient.post("/tag-group", payload);
    return { data, status };
  } catch (error) {
    return ErrorResponse(error);
  }
};

export const updateTagGroupApi = async (payload) => {
    try {
        const { data, status } = await axiosClient.put(`/tag-group/update/${payload.id}`, payload);
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};
