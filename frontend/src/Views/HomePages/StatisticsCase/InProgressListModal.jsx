import {
    Modal, ModalDialog, ModalClose, Typography, Table, Box,
    Select, Option, LinearProgress, Button, Tooltip, Skeleton
} from "@mui/joy";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";

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
    const from = total === 0 ? 0 : (page - 1) * perPage + 1;
    const to = Math.min(total, page * perPage);

    const handlePrev = () => onChangePage?.(Math.max(1, page - 1));
    const handleNext = () => onChangePage?.(Math.min(totalPages, page + 1));

    const EllipsisCell = ({ children, className = "left", maxLines = 1 }) => (
        <Tooltip title={children} variant="soft" placement="top" arrow>
            <div
                className={className}
                style={{
                    display: "-webkit-box",
                    WebkitLineClamp: maxLines,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: maxLines === 1 ? "nowrap" : "normal",
                }}
            >
                {children}
            </div>
        </Tooltip>
    );

    return (
        <Modal open={open} onClose={onClose}>
            <ModalDialog sx={{ width: "92vw", maxWidth: 1280, maxHeight: "92vh", p: 0 }}>
                <ModalClose />

                {/* Header */}
                <Box sx={{ p: 2, pb: 1.5 }}>
                    <Typography level="h5">{title}</Typography>
                </Box>

                {/* Toolbar */}
                <Box
                    sx={{
                        px: 2, pb: 1,
                        display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap"
                    }}
                >
                    <Select
                        size="sm"
                        value={hours}
                        onChange={(e, v) => setHours(v || "in")}
                        sx={{ minWidth: 180 }}
                    >
                        <Option value="in">เฉพาะ “ในเวลา”</Option>
                        <Option value="out">เฉพาะ “นอกเวลา”</Option>
                        <Option value="all">ทั้งหมด</Option>
                    </Select>

                    <Box sx={{ flex: 1 }} />
                </Box>

                {loading && <LinearProgress thickness="sm" />}

                {/* Scroll container ครอบทั้งตาราง */}
                <Box
                    sx={{
                        px: 2, pb: 2,
                        width: "100%",
                        maxHeight: "60vh",
                        overflow: "auto",
                        "&::-webkit-scrollbar": { height: 8, width: 8 },
                        "&::-webkit-scrollbar-thumb": {
                            borderRadius: 8,
                            backgroundColor: "neutral.outlinedBorder",
                        },
                    }}
                >
                    <Table
                        stickyHeader
                        hoverRow
                        size="sm"
                        borderAxis="bothBetween"
                        sx={{
                            minWidth: 1100,
                            tableLayout: "fixed",
                            "& thead th": {
                                textAlign: "center",
                                fontWeight: "lg",
                                whiteSpace: "nowrap",
                                bgcolor: "background.level1",
                                position: "sticky",     // ให้หัวติดบนเมื่อ container เลื่อน
                                top: 0,
                                zIndex: 1,
                            },
                            "& td": { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
                            "& td.left": { textAlign: "left" },

                            "@media (max-width: 900px)": {
                                // ซ่อน "รับเมื่อ" บนจอแคบ
                                "& th:nth-of-type(5), & td:nth-of-type(5)": { display: "none" },
                            },
                        }}
                    >
                        {/* ใช้ colgroup ล็อกความกว้างให้หัว/บอดี้ตรงกัน */}
                        <colgroup>
                            <col style={{ width: 64 }} />   {/* # */}
                            <col style={{ width: 240 }} />  {/* ลูกค้า */}
                            <col style={{ width: 180 }} />  {/* พนักงาน */}
                            <col style={{ width: 380 }} />  {/* ห้องที่กำลังดำเนินการ */}
                            <col style={{ width: 180 }} />  {/* รับเมื่อ */}
                        </colgroup>

                        <thead>
                            <tr>
                                <th>#</th>
                                <th>ลูกค้า</th>
                                <th>พนักงาน</th>
                                <th>ห้องที่กำลังดำเนินการ</th>
                                <th>รับเมื่อ</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading
                                ? Array.from({ length: Math.min(perPage, 10) }).map((_, i) => (
                                    <tr key={`s-${i}`}>
                                        <td><Skeleton level="body-sm" /></td>
                                        <td><Skeleton /></td>
                                        <td><Skeleton /></td>
                                        <td><Skeleton /></td>
                                        <td><Skeleton /></td>
                                    </tr>
                                ))
                                : rows.length === 0
                                    ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: "center", padding: 24 }}>
                                                ไม่มีข้อมูลในช่วงที่เลือก
                                            </td>
                                        </tr>
                                    )
                                    : rows.map((r, idx) => (
                                        <tr key={r.conversation_id ?? `${idx}-${r.roomId ?? ""}`}>
                                            <td>{(page - 1) * perPage + idx + 1}</td>
                                            <td className="left">
                                                <EllipsisCell>
                                                    {r.customer_name || r.custId || "-"}
                                                </EllipsisCell>
                                            </td>
                                            <td>
                                                <EllipsisCell>
                                                    {r.employee_name || r.empCode || "-"}
                                                </EllipsisCell>
                                            </td>
                                            <td className="left">
                                                <EllipsisCell maxLines={2}>
                                                    {r.roomName || r.roomId || "-"}
                                                </EllipsisCell>
                                            </td>
                                            <td>
                                                {r.accepted_at ? dayjs(r.accepted_at).format("DD/MM/YYYY HH:mm") : "-"}
                                            </td>
                                        </tr>
                                    ))
                            }
                        </tbody>
                    </Table>
                </Box>

                {/* Footer */}
                <PaginationBar
                    from={from}
                    to={to}
                    total={total}
                    page={page}
                    totalPages={totalPages}
                    perPage={perPage}
                    onChangePage={onChangePage}
                    onChangePerPage={onChangePerPage}
                    onPrev={handlePrev}
                    onNext={handleNext}
                />
            </ModalDialog>
        </Modal>
    );
}

/** แยก Footer เป็นคอมโพเนนท์ย่อยให้อ่านง่าย */
function PaginationBar({
    from, to, total, page, totalPages, perPage,
    onChangePage, onChangePerPage, onPrev, onNext,
}) {
    return (
        <Box
            sx={{
                px: 2, py: 1.5, mt: 1,
                display: "flex",
                gap: 1,
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                borderTop: "1px solid",
                borderColor: "neutral.outlinedBorder",
            }}
        >
            <Typography level="body-sm" sx={{ mr: 1 }}>
                {from.toLocaleString()}-{to.toLocaleString()} จาก {total.toLocaleString()}
            </Typography>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Select
                    size="sm"
                    value={perPage}
                    onChange={(e, v) => onChangePerPage?.(Number(v) || 50)}
                    sx={{ minWidth: 120 }}
                >
                    {[20, 50, 100, 150, 200].map(n => (
                        <Option key={n} value={n}>{n}/หน้า</Option>
                    ))}
                </Select>

                <Button
                    size="sm"
                    variant="outlined"
                    onClick={onPrev}
                    disabled={page <= 1}
                    startDecorator={<ChevronLeft />}
                >
                    ก่อนหน้า
                </Button>

                <Select
                    size="sm"
                    value={page}
                    onChange={(e, v) => onChangePage?.(Number(v) || 1)}
                    sx={{ minWidth: 120 }}
                >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <Option key={p} value={p}>{p}/{totalPages}</Option>
                    ))}
                </Select>

                <Button
                    size="sm"
                    variant="outlined"
                    onClick={onNext}
                    disabled={page >= totalPages}
                    endDecorator={<ChevronRight />}
                >
                    ถัดไป
                </Button>
            </Box>
        </Box>
    );
}
