import axiosClient from "../axios"
import { ErrorResponse } from "./ErrorResponse"

const prefix = '/reports'

export const listLineApi = async ({startTime, endTime}) => {
    try{
        const {data, status} = await axiosClient.get(`${prefix}/listLine`,{
            params : {
                startTime,endTime
            }
        })
        return {data, status}
    }catch(err){
        return ErrorResponse(err)
    }
}

export const rateListApi = async ({startTime, endTime, lineDescription}) => {
    try{
        const {data, status} = await axiosClient.get(`${prefix}/rateList`,{
            params : {
                startTime,endTime,lineDescription
            }
        })
        return {data, status}
    }catch(err){
        return ErrorResponse(err)
    }
}

export const activeListApi = async ({rateId}) => {
    try{
        const {data, status} = await axiosClient.get(`${prefix}/activeList`,{
            params : {
                rateId
            }
        })
        return {data, status}
    }catch(err){
        return ErrorResponse(err)
    }
}

export const reportDepartmentApi = async ({startTime, endTime}) => {
    try{
        const {data, status} = await axiosClient.get(`${prefix}/reportDepartment`,{
            params : {
                startTime,endTime
            }
        })
        return {data, status}
    }catch(err){
        return ErrorResponse(err)
    }
}    