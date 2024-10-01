export const ErrorResponse = (error) => {
    let message = 'เกิดข้อผิดพลาดกับ server';
    let status = 500;
    let detail = 'ไม่สามารถหารายละเอียดข้อผิดพลาดได้'
    if (error.response) {
        message = error.response.data.message;
        detail = error.response.data.detail;
        status = error.response.status;
    }
    const data = {
        message: message,
        detail : detail,
    }
    return {data, status};
}