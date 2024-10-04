export const ErrorResponse = (error) => {
    let message = 'เกิดข้อผิดพลาดกับ server';
    let status = 500;
    let detail = error.response.data.message;
    if (error.response.status !== 500) {
        if (error.response) {
            message = 'เกิดข้อผิดพลาด';
            detail = error.response.data.message;
            status = error.response.status;
        }
    }
    const data = {
        message: message,
        detail: detail,
    }
    return {data, status};
}