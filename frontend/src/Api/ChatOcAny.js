import axiosClient from "../Axios.js";

// เรียก AI ผู้ช่วยแบบเรียลไทม์ (chat-oc-summary): สรุปบริบทบทสนทนาทั้งหมด แล้วร่างคำตอบให้
// ยิงผ่าน backend Laravel (POST /ai-assistant/chat-oc-any) ที่ proxy ต่อไปยัง service จริง (chat-oc-summary)
// เดิมยิงตรงจาก browser ไป 127.0.0.1:7001 แต่โดนบล็อกเมื่อหน้าเว็บรันบน HTTPS domain
// (CORS / Private Network Access เข้าถึง loopback address ไม่ได้) — host จริงตั้งค่าที่ backend ผ่าน CHAT_OC_SUMMARY_URL
// หมายเหตุ: เดิม endpoint chat-oc-any รับข้อความล่าสุด+รูปแนบทีละข้อความ แต่ chat-oc-summary รับ
// context เป็น "lines" หลายข้อความแทน — backend เป็นคนไปดึงประวัติแชททั้งห้อง (ตาม activeId) มาสร้าง lines
// เองฝั่ง server จึงไม่ต้องส่ง message/imageFile/imageUrl จากตรงนี้อีกแล้ว
export const sendChatOcAnyApi = async ({ custId, activeId, messageRef, upToMessageId, sinceMessageId }) => {
    // active_id/message_ref: ให้ backend บันทึกการ์ดวิเคราะห์นี้ลง ai_live_suggestions
    // เพื่อโหลดกลับมาแสดงได้ตอนรีเฟรชหน้าจอ (ดู Info/main.jsx) และดึงประวัติข้อความทั้งห้องมาทำ context
    // up_to_message_id: ปุ่ม "Generate AI" ที่กดจากข้อความใดข้อความหนึ่งในหน้าแชท (ดู ChatBubble.jsx) —
    // ให้ backend จำกัด context ย้อนกลับไปแค่ถึงข้อความนั้น ไม่เอาข้อความที่มาทีหลัง
    // since_message_id: จุดตัดล่าสุดที่เคยส่งบริบทให้ AI ไปแล้ว (chat-oc-summary จำ session นี้เองอยู่แล้ว
    // ดู /session/clear) — ให้ backend ส่งแค่ข้อความ "ใหม่" หลังจากจุดนี้ ไม่ส่งบทสนทนาทั้งหมดซ้ำทุกครั้ง
    const { data } = await axiosClient.post('/ai-assistant/chat-oc-any', {
        session_id: custId || undefined,
        active_id: activeId || undefined,
        message_ref: messageRef !== undefined ? String(messageRef) : undefined,
        up_to_message_id: upToMessageId || undefined,
        since_message_id: sinceMessageId || undefined,
    });
    return data; // { summarytxt, answer, ... }
};
