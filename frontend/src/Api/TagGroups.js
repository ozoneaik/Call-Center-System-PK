import axiosClient from "../Axios.js";
import { ErrorResponse } from "./ErrorResponse.js";

const base = "tag-group"; // อิงจาก routes/api.php

export const listTagGroupsApi = async (params = {}) => {
  try {
    const { data, status } = await axiosClient.get(base, { params });
    return { data, status };
  } catch (error) {
    return ErrorResponse(error);
  }
};

export const getTagGroupApi = async (id) => {
  try {
    const { data, status } = await axiosClient.get(`${base}/${id}`);
    return { data, status };
  } catch (error) {
    return ErrorResponse(error);
  }
};

export const storeTagGroupApi = async (payload) => {
  try {
    const { data, status } = await axiosClient.post(base, {
      group_id: payload.group_id,
      group_name: payload.group_name,
      group_description: payload.group_description ?? null,
    });
    return { data, status };
  } catch (error) {
    return ErrorResponse(error);
  }
};

export const updateTagGroupApi = async (id, payload) => {
  try {
    console.log("=== API DEBUG ===", payload);
    const body = {
      id,
      group_id: payload.group_id,
      group_name: payload.group_name,
      group_description: payload.group_description ?? null,
    };

    const response = await axiosClient.put(
      `${base}/${id}`,
      body,
      { headers: { "Content-Type": "application/json" } }
    );

    return { data: response.data, status: response.status };
  } catch (error) {
    return {
      data: error.response?.data || { message: "เกิดข้อผิดพลาด" },
      status: error.response?.status || 500,
    };
  }
};

export const deleteTagGroupApi = async (id) => {
  try {
    const { data, status } = await axiosClient.delete(`${base}/${id}`);
    return { data, status };
  } catch (error) {
    return ErrorResponse(error);
  }
};

export const restoreTagGroupApi = async (id) => {
  try {
    const { data, status } = await axiosClient.patch(`${base}/${id}/restore`);
    return { data, status };
  } catch (error) {
    return ErrorResponse(error);
  }
};

export const forceDeleteTagGroupApi = async (id) => {
  try {
    const { data, status } = await axiosClient.delete(`${base}/${id}/force`);
    return { data, status };
  } catch (error) {
    return ErrorResponse(error);
  }
};