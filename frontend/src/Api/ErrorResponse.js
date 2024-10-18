export const ErrorResponse = (error) => {
    let message = 'เกิดข้อผิดพลาด';
    let status = 500;
    let detail = 'เกิดข้อผิดพลาดกับ server'
    if (error.response){
    detail = error.response.data.message;
        if (error.response.status !== 500) {
            if (error.response) {
                message = error.response.data.message;
                detail = error.response.data.detail;
                status = error.response.status;
            }
        }
    }
    const data = {
        message: message,
        detail: detail,
    }
    return {data, status};
}