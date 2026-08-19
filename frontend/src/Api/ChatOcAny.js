// เรียก AI ผู้ช่วยแบบเรียลไทม์ (chat-oc-any): วิเคราะห์รูปสินค้า/ข้อความ แล้วตอบกลับ พร้อมข้อมูลสินค้า/ราคาอะไหล่ถ้าจับคู่ได้
// เรียกตรงจาก frontend ไปยัง host ของ service นี้ (ไม่ผ่าน backend Laravel) — ตั้งค่า host ผ่าน VITE_CHAT_OC_ANY_URL
const CHAT_OC_ANY_URL = import.meta.env.VITE_CHAT_OC_ANY_URL || "http://127.0.0.1:7001/chat-oc-any";

export const sendChatOcAnyApi = async ({ message, imageFile, imageUrl }) => {
    const formData = new FormData();
    if (imageFile) formData.append("image", imageFile);
    if (imageUrl) formData.append("image_url", imageUrl);
    formData.append("message", message || "");

    // ห้ามใส่ header Content-Type เอง ต้องปล่อยให้ browser ใส่ multipart boundary ให้อัตโนมัติ
    const res = await fetch(CHAT_OC_ANY_URL, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        throw new Error(`chat-oc-any request failed: ${res.status}`);
    }

    return res.json(); // { reply, source, resolved_product }
};
