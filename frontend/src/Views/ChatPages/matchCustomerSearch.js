/**
 * เช็คว่าแถวเคสตรงกับคำค้นหรือไม่ — ค้นได้ทั้งชื่อลูกค้า, ID ที่แสดง (pcust_id) และ custId ของแพลตฟอร์ม
 * รองรับพิมพ์แบบ "39018", "ID 39018", "id:39018", "#39018"
 */
export function matchCustomerSearch(row, searchTerm) {
    const term = String(searchTerm ?? '').trim().toLowerCase();
    if (!term) return true;

    const idTerm = term.replace(/^(id\s*[:：]?\s*|#)/, '').trim();
    const name = String(row?.custName ?? '').toLowerCase();
    const ids = [row?.pcust_id, row?.custId].map((v) => String(v ?? '').toLowerCase());

    return name.includes(term) || (idTerm !== '' && ids.some((id) => id.includes(idTerm)));
}
