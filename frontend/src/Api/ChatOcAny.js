import axiosClient from "../Axios.js";

// เรียก AI ผู้ช่วยแบบเรียลไทม์ (chat-oc-any): วิเคราะห์รูปสินค้า/ข้อความ แล้วตอบกลับ พร้อมข้อมูลสินค้า/ราคาอะไหล่ถ้าจับคู่ได้
// ยิงผ่าน backend Laravel (POST /ai-assistant/chat-oc-any) ที่ proxy ต่อไปยัง service จริง
// เดิมยิงตรงจาก browser ไป 127.0.0.1:7001 แต่โดนบล็อกเมื่อหน้าเว็บรันบน HTTPS domain
// (CORS / Private Network Access เข้าถึง loopback address ไม่ได้) — host จริงตั้งค่าที่ backend ผ่าน CHAT_OC_ANY_URL
export const sendChatOcAnyApi = async ({ message, imageFile, imageUrl, custId }) => {
    const form = new FormData();
    // normalize('NFC') กันกรณีตัวอักษรไทย (สระ/วรรณยุกต์) มาแบบแยกส่วนจนต่อกันผิดรูป
    form.append('message', (message || '').normalize('NFC'));
    if (imageUrl) form.append('image_url', imageUrl.normalize('NFC'));
    if (custId) form.append('session_id', custId);
    if (imageFile) form.append('image', imageFile, imageFile.name || 'image.jpg');

    // Content-Type: null → ลบ default (Axios.js ตั้ง multipart/form-data ไว้แบบไม่มี boundary)
    // ให้ browser ใส่ header พร้อม boundary เองจาก FormData ไม่งั้น backend parse ไม่ออก ($request ว่าง)
    const { data } = await axiosClient.post('/ai-assistant/chat-oc-any', form, {
        headers: { 'Content-Type': null },
    });
    return data; // { reply, source, primary_intent, ... }
};
