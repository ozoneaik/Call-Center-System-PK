/* --------------------------------------------- api เกี่ยวกับ user ----------------------------------------------*/
import axiosClient from "../Axios.js";
import {ErrorResponse} from "./ErrorResponse.js";

const users = '/users';

// ดึงรายการผู้ใช้
export const usersListApi = async () => {
    try {
        const {data,status} = await axiosClient.get(`${users}/list`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

export const storeUserApi = async (user) => {
    console.log(user)
    try {
        const {data,status} = await axiosClient.post(`${users}/store`, user);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// ดึงรายการผู้ใช้
export const deleteUserApi = async (empCode) => {
    try {
        const {data,status} = await axiosClient.delete(`${users}/delete/${empCode}`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// อัพเดทผู้ใช้
export const updateUserApi = async ({empCode, user}) => {
    try {
        const {data,status} = await axiosClient.put(`${users}/update/${empCode}`,user,{
            headers : {
                'Content-Type': 'application/json'
            }
        });
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}


export const profileApi = async () => {
    try {
        const {data,status} = await axiosClient.put(`${users}/profile`);
        return {data,status};
    }catch (error){
        return ErrorResponse(error);
    }
}

// ------------------------------------------------------------------------------------------------------------