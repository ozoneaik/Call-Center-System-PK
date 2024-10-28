/* ------------------------------------------- api เกี่ยวกับ customer -------------------------------------------*/
import axiosClient from "../Axios.js";
import {ErrorResponse} from "./ErrorResponse.js";

const customers = '/customers';
// ดึงรายการลูกค้า
export const customersListApi = async () => {
    try {
        const {data,status} = await axiosClient.get(`${customers}/list`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// แก้ไขข้อมูลลูกค้า
export const customerUpdateApi = async (customer) => {
    try {
        console.log(customer)
        const {data, status} = await axiosClient.put(`${customers}/update`, {customer});
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// ------------------------------------------------------------------------------------------------------------