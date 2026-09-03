import axiosClient from "../Axios.js";
import { ErrorResponse } from "./ErrorResponse.js";

// ตัวอย่าง API ดึงคำแนะนำคำตอบจาก AI ของแชทที่กำลังดำเนินอยู่
// activeId = active_conversations.id — backend หา custId เองจากเรคคอร์ดนี้ ไม่ต้องส่ง custId มาซ้ำ
export const getAiSuggestionsApi = async (activeId) => {
    try {
        const { data, status } = await axiosClient.get(`/ai-assistant/suggestions/${activeId}`);
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

// ประวัติการ์ดวิเคราะห์ AI (ตอบสดจาก chat-oc-any) ของห้องแชทนี้ทั้งหมด เรียงใหม่สุดก่อน
// ใช้โหลดตอนเปิด/รีเฟรชหน้าจอ กันการ์ดที่เคยวิเคราะห์ไว้หายไป (เดิมเก็บแค่ React state)
export const getAiLiveSuggestionsHistoryApi = async (activeId) => {
    try {
        const { data, status } = await axiosClient.get(`/ai-assistant/live-suggestions/${activeId}`);
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

// ตัวอย่าง API ดึงประวัติการติดต่อทั้งหมดของลูกค้า แยกตามห้อง พร้อมวิเคราะห์แต่ละคำถาม
// (intent/category/emotion) และเทียบคำตอบที่ AI แนะนำกับคำตอบจริงที่พนักงานตอบไป
export const getCustomerAnalysisApi = async (custId) => {
    try {
        const { data, status } = await axiosClient.get(`/ai-assistant/customer-analysis/${custId}`);
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};

// บันทึกความรู้ (คำถาม-คำตอบ) เข้า KB จากปุ่ม "เพิ่มเข้า KB" ในหน้าแชท
export const storeAiKbEntryApi = async (payload) => {
    try {
        const { data, status } = await axiosClient.post(`/ai-assistant/kb-entries`, payload, {
            headers: { 'Content-Type': 'application/json' },
        });
        return { data, status };
    } catch (error) {
        return ErrorResponse(error);
    }
};
