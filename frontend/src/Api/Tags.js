import axiosClient from "../Axios.js";
import axios from "axios";
import { ErrorResponse } from "./ErrorResponse.js";

const tags = "/tags";

export const listTagsApi = async (params = {}) => {
  try {
    const { data, status } = await axiosClient.get("tags", { params });
    return { data, status };
  } catch (error) {
    return ErrorResponse(error);
  }
};

export const storeTagsApi = async (payload) => {
  try {
    const resp = await axiosClient.post(
      "tags",
      {
        tagName: payload.tagName,
        group_id: payload.group_id ?? null,
        require_note:
          typeof payload.require_note === "boolean"
            ? payload.require_note
            : undefined,
      },
      { headers: { "Content-Type": "application/json" } }
    );
    return { data: resp.data, status: resp.status };
  } catch (error) {
    return {
      data: error.response?.data || { message: "เกิดข้อผิดพลาด" },
      status: error.response?.status || 500,
    };
  }
};

export const updateTagsApi = async (payload) => {
  try {
    const response = await axiosClient.put(`tags/${payload.id}`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return { data: response.data, status: response.status };
  } catch (error) {
    return {
      data: error.response?.data || { message: "เกิดข้อผิดพลาด" },
      status: error.response?.status || 500,
    };
  }
};

export const deleteTagApi = async ({ id }) => {
  try {
    const { data, status } = await axiosClient.delete(`tags/${id}`);
    return { data, status };
  } catch (error) {
    return ErrorResponse(error);
  }
};

export const restoreTagApi = async (id) => {
  try {
    const { data, status } = await axiosClient.patch(`tags/${id}/restore`);
    return { data, status };
  } catch (error) {
    return ErrorResponse(error);
  }
};

export const forceDeleteTagApi = async (id) => {
  try {
    const { data, status } = await axiosClient.delete(`tags/${id}/force`);
    return { data, status };
  } catch (error) {
    return ErrorResponse(error);
  }
};

export const listTagGroupOptionsApi = async () => {
  const { data, status } = await axiosClient.get("tag-group/options"); // ← เอกพจน์
  return { data, status };
};
