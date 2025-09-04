import { Modal, ModalDialog, ModalClose, Typography, Grid, Input, Button, Alert } from "@mui/joy";
import dayjs from "dayjs";
import RangeTable from "./RangeTable";
import { isRangeTooLongStr, makeEndMax, MAX_DAYS } from "./helpers";

export default function AfterHourModal({
    open, onClose,
    startDate, setStartDate,
    endDate, setEndDate,
    rows = [], setRows,
    axiosClient,
    fetchUrl = "home/user-case/after-hour-closure-range-stats",
    baseParams = {},
}) {
    const rangeError = isRangeTooLongStr(startDate, endDate);
    const endMax = makeEndMax(startDate);

    const handleStartChange = (v) => {
        const s = v || "";
        setStartDate(s);
        if (!s) return;
        setEndDate((prev) => {
            let candidate = prev || s;
            if (dayjs(candidate).isBefore(s)) candidate = s;
            const maxEnd = endMax || s;
            if (dayjs(candidate).isAfter(maxEnd)) candidate = maxEnd;
            return candidate;
        });
    };
    const handleEndChange = (v) => {
        if (!v) return setEndDate("");
        let e = v;
        if (startDate && dayjs(e).isBefore(startDate)) e = startDate;
        const maxEnd = endMax || e;
        if (dayjs(e).isAfter(maxEnd)) e = maxEnd;
        setEndDate(e);
    };

    const fetchRangeStats = async () => {
        if (rangeError || !startDate || !endDate) return;
        const params = { start_date: startDate, end_date: endDate, ...baseParams };
        try {
            const { data } = await axiosClient.get(fetchUrl, { params });
            const rows = (data.data || []).map(r => ({
                date: r.date,
                "ภายใน 1 นาที": r.within_1_min ?? 0,
                "1-5 นาที": r.one_to_five_min ?? 0,
                "5-10 นาที": r.five_to_ten_min ?? 0,
                "มากกว่า 10 นาที": r.over_ten_min ?? 0,
                total: r.total ?? 0,
            }));
            setRows(rows);
        } catch (err) {
            console.error("❌ after-hour-closure-range-stats error:", err);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <ModalDialog sx={{ width: "90vw", maxHeight: "90vh", p: 2 }}>
                <ModalClose />
                <Typography level="h5" mb={2}>🌙 เลือกช่วงวันที่ (นอกเวลาทำการ)</Typography>
                <Grid container spacing={2}>
                    <Grid xs={6}>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => handleStartChange(e.target.value)}
                            slotProps={{ input: { max: endDate || undefined } }}
                            sx={{ width: "100%" }}
                        />
                    </Grid>
                    <Grid xs={6}>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => handleEndChange(e.target.value)}
                            slotProps={{ input: { min: startDate || undefined, max: endMax || undefined } }}
                            sx={{ width: "100%" }}
                        />
                    </Grid>
                    <Grid xs={12} sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Button onClick={fetchRangeStats} disabled={rangeError || !startDate || !endDate}>🔍 ค้นหา</Button>
                        {/* ถ้าจะ Export เพิ่มเติม ค่อยต่อยอดจาก helpers.downloadExcel */}
                    </Grid>
                </Grid>
                {rangeError && (
                    <Alert color="danger" variant="soft" sx={{ mt: 1 }}>
                        เลือกช่วงได้ไม่เกิน {MAX_DAYS} วัน
                    </Alert>
                )}
                <RangeTable rows={rows} />
            </ModalDialog>
        </Modal>
    );
}
