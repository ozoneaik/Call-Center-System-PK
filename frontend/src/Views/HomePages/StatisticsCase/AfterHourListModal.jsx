import { useEffect } from "react";
import {
    Modal, ModalDialog, ModalClose, Typography, Box, Table, Chip,
    Select, Option, Button, CircularProgress, Sheet
} from "@mui/joy";
import dayjs from "dayjs";

const BUCKET_OPTIONS = [
    { value: "", label: "ทุกช่วงเวลา" },
    { value: "within_1", label: "ภายใน 1 นาที" },
    { value: "one_to_five", label: "1-5 นาที" },
    { value: "five_to_ten", label: "5-10 นาที" },
    { value: "over_ten", label: "มากกว่า 10 นาที" },
];

export default function AfterHourListModal({
    open,
    onClose,
    title = "รายการเคสที่ปิด",
    // params
    startDate,
    endDate,
    platformId,
    dept,
    empCode,
    // data
    rows,
    loading,
    page,
    perPage,
    total,
    bucket,
    // actions
    setBucket,
    onRefresh,
    onChangePage,
    onChangePerPage,
}) {
    useEffect(() => {
        if (open && onRefresh) onRefresh();
    }, [open, startDate, endDate, platformId, dept, empCode, bucket, page, perPage]);

    const totalPages = Math.max(1, Math.ceil((total || 0) / (perPage || 1)));

    return (
        <Modal open={open} onClose={onClose}>
            <ModalDialog sx={{ width: "94vw", maxWidth: 1200, p: 2 }}>
                <ModalClose />
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                    <Typography level="h5">{title}</Typography>
                    <Typography level="body-sm" color="neutral">
                        ช่วงวันที่: {dayjs(startDate).format("DD/MM/YYYY")} - {dayjs(endDate).format("DD/MM/YYYY")}
                    </Typography>
                </Box>

                <Sheet variant="soft" sx={{ p: 1.5, borderRadius: "md", mb: 1.5, display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                    <Typography level="body-sm">กรองช่วงเวลาปิด:</Typography>
                    <Select size="sm" value={bucket} onChange={(e, v) => setBucket(v || "")} sx={{ minWidth: 180 }}>
                        {BUCKET_OPTIONS.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                    </Select>
                    <Box sx={{ flex: 1 }} />
                    <Button size="sm" variant="outlined" onClick={onRefresh} startDecorator="🔍">ค้นหา</Button>
                </Sheet>

                <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: "md", overflow: "hidden", overflowX: "auto", }}>
                    <Table
                        borderAxis="bothBetween"
                        size="sm"
                        stickyHeader
                        sx={{
                            minWidth: 1000,
                            tableLayout: "fixed",
                            '& th': { textAlign: 'center', fontWeight: 'bold', whiteSpace: 'nowrap' },
                            '& td': { textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
                            '& td.wrap': { whiteSpace: 'normal' },
                            '& tbody': {
                                display: 'block',
                                maxHeight: '70vh',
                                overflowY: 'auto',
                            },
                            '& thead, & tbody tr': {
                                display: 'table',
                                width: '100%',
                                tableLayout: 'fixed',
                            }

                        }}
                    >
                        <thead>
                            <tr>
                                <th style={{ width: 60 }}>#</th>
                                <th>ลูกค้า</th>
                                <th>พนักงาน</th>
                                <th>ห้อง</th>
                                <th>รับเมื่อ</th>
                                <th>ปิดเมื่อ</th>
                                <th className="wrap">ช่วงเวลาปิด</th>
                                <th className="wrap">แท็ก</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, idx) => (
                                <tr key={r.conversation_id}>
                                    <td style={{ width: 60 }}>{idx + 1}</td>
                                    <td style={{ textAlign: 'left' }}>{r.customer_name}</td>
                                    <td>{r.employee_name}</td>
                                    <td style={{ textAlign: 'left' }}>{r.roomName}</td>
                                    <td>{dayjs(r.accepted_at).format('DD/MM/YYYY HH:mm')}</td>
                                    <td>{dayjs(r.endTime).format('DD/MM/YYYY HH:mm')}</td>
                                    <td className="wrap">
                                        {r.duration_bucket} ({r.duration_mins} นาที)
                                    </td>
                                    <td className="wrap">{r.tag_name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
                    <Typography level="body-sm" color="neutral">
                        ทั้งหมด {total ?? 0} รายการ • หน้า {page}/{totalPages}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <Select size="sm" value={perPage} onChange={(e, v) => onChangePerPage(v || 50)} sx={{ width: 120 }}>
                            {[20, 50, 100, 200].map(n => <Option key={n} value={n}>{n}/หน้า</Option>)}
                        </Select>
                        <Button size="sm" disabled={page <= 1} onClick={() => onChangePage(page - 1)}>ก่อนหน้า</Button>
                        <Button size="sm" disabled={page >= totalPages} onClick={() => onChangePage(page + 1)}>ถัดไป</Button>
                    </Box>
                </Box>
                
            </ModalDialog>
        </Modal>
    );
}
