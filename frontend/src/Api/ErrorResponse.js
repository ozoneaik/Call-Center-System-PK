export const ErrorResponse = (error) => {
    let message = 'เกิดข้อผิดพลาดกับ server';
    let status = 500;
    if (error.response) {
        message = error.response.data.message;
        status = error.response.status;
    }
    const data = {
        message: message,
    }
    return {data, status};
}