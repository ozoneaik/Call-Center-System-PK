import axiosClient from "../Axios.js";
import { ErrorResponse } from "./ErrorResponse.js";

export const newGetFacebook = async () => {
    try {
        const { data, status } = await axiosClient.get(`/getFeedFacebook`);
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
}