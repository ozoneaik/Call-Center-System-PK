import { useState } from "react";
import { Modal, ModalDialog, ModalClose, Typography, Grid, Input, Button, Alert } from "@mui/joy";
import dayjs from "dayjs";
import RangeTable from "./RangeTable";
import { bucketsToKeyed, isRangeTooLongStr, makeEndMax, MAX_DAYS, downloadExcel } from "./helpers";

export default function RangeModal({
    open, onClose,
    startDate, setStartDate,
    endDate, setEndDate,
    exporting, setExporting,
    axiosClient,
    fetchUrl = "home/user-case/closure-range-stats",
    exportUrl = "home/user-case/export/detailed-cases-intime.xlsx",
    baseParams = {},
    rows = [], setRows,
}) {
    const businessRangeError = isRangeTooLongStr(startDate, endDate);
    const businessEndMax = makeEndMax(startDate);

    const handleStartChange = (v) => {
        const s = v || "";
        setStartDate(s);
        if (!s) return;
        setEndDate((prev) => {
            let candidate = prev || s;
            if (dayjs(candidate).isBefore(s)) candidate = s;
            const maxEnd = businessEndMax || s;
            if (dayjs(candidate).isAfter(maxEnd)) candidate = maxEnd;
            return candidate;
        });
    };
    const handleEndChange = (v) => {
        if (!v) return setEndDate("");
        let e = v;
        if (startDate && dayjs(e).isBefore(startDate)) e = startDate;
        const maxEnd = businessEndMax || e;
        if (dayjs(e).isAfter(maxEnd)) e = maxEnd;
        setEndDate(e);
    };

    const fetchRangeStats = async () => {
        if (businessRangeError || !startDate || !endDate) return;
        const params = { start_date: startDate, end_date: endDate, ...baseParams };
        try {
            const { data } = await axiosClient.get(fetchUrl, { params });
            const mapRows = (data.data || []).map((d) => {
                const { totalMap } = bucketsToKeyed(d.buckets || []);
                return { date: d.date, ...totalMap };
            });
            setRows(mapRows);
        } catch (err) {
            console.error("❌ closure-range-stats error:", err);
        }
    };

    const onExport = () =>
        downloadExcel(axiosClient, exportUrl, { start_date: startDate, end_date: endDate, ...baseParams },
            { onStart: () => setExporting(true), onDone: () => setExporting(false) }
        );

    return (
        <Modal open={open} onClose={onClose}>
            <ModalDialog sx={{ width: "90vw", maxHeight: "90vh", p: 2 }}>
                <ModalClose />
                <Typography level="h5" mb={2}>📆 เลือกช่วงวันที่ (ในเวลาทำการ)</Typography>
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
                            slotProps={{ input: { min: startDate || undefined, max: businessEndMax || undefined } }}
                            sx={{ width: "100%" }}
                        />
                    </Grid>
                    <Grid xs={12} sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Button onClick={fetchRangeStats} disabled={businessRangeError || !startDate || !endDate}>🔍 ค้นหา</Button>
                        <Button
                            color="primary"
                            variant="solid"
                            onClick={onExport}
                            disabled={exporting || !startDate || !endDate || dayjs(endDate).isBefore(startDate) || businessRangeError}
                            sx={{ minWidth: 80 }}
                        >
                            {exporting ? "กำลังสร้าง..." : "Export"}
                        </Button>
                    </Grid>
                </Grid>
                {businessRangeError && (
                    <Alert color="danger" variant="soft" sx={{ mt: 1 }}>
                        เลือกช่วงได้ไม่เกิน {MAX_DAYS} วัน
                    </Alert>
                )}
                <RangeTable rows={rows} />
            </ModalDialog>
        </Modal>
    );
}
