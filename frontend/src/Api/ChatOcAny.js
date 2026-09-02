// เรียก AI ผู้ช่วยแบบเรียลไทม์ (chat-oc-any): วิเคราะห์รูปสินค้า/ข้อความ แล้วตอบกลับ พร้อมข้อมูลสินค้า/ราคาอะไหล่ถ้าจับคู่ได้
// เรียกตรงจาก frontend ไปยัง host ของ service นี้ (ไม่ผ่าน backend Laravel) — ตั้งค่า host ผ่าน VITE_CHAT_OC_ANY_URL
const CHAT_OC_ANY_URL = import.meta.env.VITE_CHAT_OC_ANY_URL || "http://127.0.0.1:7001/chat-oc-any";

// FormData ปกติของ browser ไม่แนบ Content-Type/charset ให้ field ข้อความ (เป็น string เปล่าๆ)
// ทำให้บาง server เดา charset ผิด (เช่น เดาเป็น latin1) พอมีภาษาไทยแล้วอ่านไม่รู้เรื่อง
// จึงสร้าง multipart body เองเพื่อกำกับ Content-Type: text/plain; charset=UTF-8 ให้ทุก field ข้อความอย่างชัดเจน
const buildMultipartBody = ({ message, imageUrl, imageFile, custId }) => {
    const boundary = `----ccsBoundary${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
    const parts = [];

    const appendTextField = (name, value) => {
        parts.push(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="${name}"\r\n` +
            `Content-Type: text/plain; charset=UTF-8\r\n\r\n` +
            `${value}\r\n`
        );
    };

    // normalize('NFC') กันกรณีตัวอักษรไทย (สระ/วรรณยุกต์) มาแบบแยกส่วนจนต่อกันผิดรูป
    appendTextField('message', (message || '').normalize('NFC'));
    if (imageUrl) appendTextField('image_url', imageUrl.normalize('NFC'));
    if (custId) appendTextField('custId', custId);

    if (imageFile) {
        parts.push(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="image"; filename="${imageFile.name || 'image.jpg'}"\r\n` +
            `Content-Type: ${imageFile.type || 'application/octet-stream'}\r\n\r\n`
        );
        parts.push(imageFile);
        parts.push('\r\n');
    }

    parts.push(`--${boundary}--\r\n`);

    return { body: new Blob(parts), boundary };
};

export const sendChatOcAnyApi = async ({ message, imageFile, imageUrl, custId }) => {
    const { body, boundary } = buildMultipartBody({ message, imageFile, imageUrl, custId });

    const res = await fetch(CHAT_OC_ANY_URL, {
        method: "POST",
        headers: {
            "Content-Type": `multipart/form-data; boundary=${boundary}; charset=UTF-8`,
        },
        body,
    });

    if (!res.ok) {
        throw new Error(`chat-oc-any request failed: ${res.status}`);
    }

    return res.json(); // { reply, source, resolved_product }
};
