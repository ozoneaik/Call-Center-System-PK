import {
    Modal, ModalDialog, ModalClose, Typography, Table, Box,
    Select, Option, CircularProgress
} from "@mui/joy";
import dayjs from "dayjs";

export default function InProgressListModal({
    open,
    onClose,
    title = "🛠️ รายการเคสที่กำลังดำเนินการ",
    rows = [],
    loading = false,
    page = 1,
    perPage = 50,
    total = 0,
    onChangePage,
    onChangePerPage,
    hours = "in",        // in | out | all
    setHours,
}) {
    const totalPages = Math.max(1, Math.ceil(total / Math.max(1, perPage)));

    return (
        <Modal open={open} onClose={onClose}>
            <ModalDialog sx={{ width: "90vw", maxWidth: 1200, maxHeight: "90vh", p: 2 }}>
                <ModalClose />
                <Typography level="h5" mb={1}>{title}</Typography>

                <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1, flexWrap: "wrap" }}>
                    <Select size="sm" value={hours} onChange={(e, v) => setHours(v || "in")}>
                        <Option value="in">เฉพาะ "ในเวลา"</Option>
                        <Option value="out">เฉพาะ "นอกเวลา"</Option>
                        <Option value="all">ทั้งหมด</Option>
                    </Select>

                    <Box sx={{ flex: 1 }} />
                    <Select size="sm" value={perPage} onChange={(e, v) => onChangePerPage?.(Number(v) || 50)}>
                        {[20, 50, 100, 150, 200].map(n => <Option key={n} value={n}>{n}/หน้า</Option>)}
                    </Select>
                    <Select size="sm" value={page} onChange={(e, v) => onChangePage?.(Number(v) || 1)}>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <Option key={p} value={p}>{p}/{totalPages}</Option>
                        ))}
                    </Select>
                </Box>

                {/* กล่องสกอร์ลแนวนอน */}
                <Box
                    sx={{
                        width: "100%",
                        overflowX: "auto",
                        "&::-webkit-scrollbar": { height: 8 },
                        "&::-webkit-scrollbar-thumb": {
                            borderRadius: 8,
                            backgroundColor: "neutral.outlinedBorder",
                        },
                    }}
                >
                    <Table
                        hoverRow
                        stickyHeader
                        size="sm"
                        borderAxis="bothBetween"
                        sx={{
                            minWidth: 1000,           // บังคับให้เลื่อนได้บนจอเล็ก
                            tableLayout: "fixed",
                            "& th": { textAlign: "center", fontWeight: "bold", whiteSpace: "nowrap" },
                            "& td": { textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
                            "& td.left": { textAlign: "left" },
                            "& td.wrap": { whiteSpace: "normal" },
                            "& tbody": { display: "block", maxHeight: "65vh", overflowY: "auto" },
                            "& thead, & tbody tr": { display: "table", width: "100%", tableLayout: "fixed" },
                        }}
                    >
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>ลูกค้า</th>
                                <th>พนักงาน</th>
                                <th>ห้องที่กำลังดำเนินการ</th>
                                <th>รับเมื่อ</th>
                                <th className="wrap">แท็ก</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center" }}>
                                        <CircularProgress />
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center" }}>ไม่พบข้อมูล</td>
                                </tr>
                            ) : (
                                rows.map((r, idx) => (
                                    <tr key={r.conversation_id}>
                                        <td>{(page - 1) * perPage + idx + 1}</td>
                                        <td className="left">{r.customer_name || r.custId}</td>
                                        <td>{r.employee_name || r.empCode}</td>
                                        <td className="left">{r.roomName || r.roomId || "-"}</td> {/* ✅ คอลัมน์ใหม่ */}
                                        <td>{r.accepted_at ? dayjs(r.accepted_at).format("DD/MM/YYYY HH:mm") : "-"}</td>
                                        <td className="wrap">{r.tag_name || "-"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </Box>
            </ModalDialog>
        </Modal>
    );
}
