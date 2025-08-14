// components/StatisticsCase/helpers.js
import dayjs from "dayjs";

/** คีย์ bucket มาตรฐาน */
export const BUCKET_KEYS = ["ภายใน 1 นาที", "1-5 นาที", "5-10 นาที", "มากกว่า 10 นาที"];
export const MAX_DAYS = 31;

/** แปลง buckets เป็น object in/out/total ต่อคีย์ + รวม total */
export function bucketsToKeyed(buckets = []) {
  const inMap = {}, outMap = {}, totalMap = {};
  BUCKET_KEYS.forEach((k, i) => {
    const b = buckets[i] || { in_time: 0, out_time: 0, total_case: 0 };
    inMap[k] = b.in_time ?? 0;
    outMap[k] = b.out_time ?? 0;
    totalMap[k] = b.total_case ?? 0;
  });
  inMap.total = BUCKET_KEYS.reduce((s, k) => s + (inMap[k] ?? 0), 0);
  outMap.total = BUCKET_KEYS.reduce((s, k) => s + (outMap[k] ?? 0), 0);
  totalMap.total = BUCKET_KEYS.reduce((s, k) => s + (totalMap[k] ?? 0), 0);
  return { inMap, outMap, totalMap };
}

export const valueDisplay = (val) => (val !== undefined ? `${val}` : "-");

// ===== helpers ช่วงวันที่ (string "YYYY-MM-DD") =====
export const isRangeTooLongStr = (start, end, limitDays = MAX_DAYS) => {
  if (!start || !end) return false;
  return dayjs(end).diff(dayjs(start), "day") > limitDays;
};
export const addDaysStr = (dateStr, days) => dayjs(dateStr).add(days, "day").format("YYYY-MM-DD");
export const clampEndWithinLimit = (start, end) => {
  if (!start || !end) return end;
  const maxEnd = addDaysStr(start, MAX_DAYS);
  return dayjs(end).isAfter(maxEnd) ? maxEnd : end;
};
export const makeEndMax = (start) => (start ? addDaysStr(start, MAX_DAYS) : undefined);

/** ดาวน์โหลดไฟล์ Excel + รองรับ onStart/onDone สำหรับ loading */
export async function downloadExcel(axiosClient, url, params = {}, opts = {}) {
  const { onStart, onDone } = opts;
  try {
    onStart && onStart();
    const resp = await axiosClient.get(url, { params, responseType: "blob" });
    let filename = "export.xlsx";
    const cd = resp.headers?.["content-disposition"] || resp.headers?.["Content-Disposition"];
    if (cd) {
      const m = /filename\*?=(?:UTF-8'')?"?([^\";]+)"?/i.exec(cd);
      if (m?.[1]) filename = decodeURIComponent(m[1]);
    }
    const blob = new Blob([resp.data], {
      type: resp.data?.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const link = document.createElement("a");
    const objectUrl = URL.createObjectURL(blob);
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    console.error("Export Excel failed:", err);
    alert("Export Excel ไม่สำเร็จ");
  } finally {
    onDone && onDone();
  }
}
