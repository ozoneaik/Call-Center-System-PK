import {
    Box,
    Modal,
    ModalDialog,
    ModalClose,
    Table,
    Typography,
    Chip,
    LinearProgress
} from "@mui/joy";

export default function ClosedMonthModal({ open, onClose, loading, data, range, user }) {
    return (
        <Modal open={open} onClose={onClose}>
            <ModalDialog sx={{ minWidth: 720, maxWidth: 980 }}>
                <ModalClose />
                <Typography level="h4" mb={1}>
                    ปิดเคสเดือนนี้ {range?.start && range?.end ? `(${range.start} - ${range.end})` : ""}
                </Typography>
                <Typography level="body-sm" mb={2}>
                    {user ? `ผู้ปิดเคส: ${user.name} (${user.empCode})` : ""}
                </Typography>

                {loading ? (
                    <Box>
                        <LinearProgress />
                        <Typography level="body-sm" mt={1}>
                            กำลังโหลดข้อมูล...
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ borderRadius: "sm", overflow: "auto", maxHeight: 520 }}>
                        <Table stickyHeader hoverRow>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', paddingLeft: 12, whiteSpace: 'nowrap' }}>ชื่อลูกค้า</th>
                                    <th style={{ width: 230, textAlign: 'left', whiteSpace: 'nowrap' }}>ปิดเมื่อไหร่</th>
                                    <th style={{ width: 200, textAlign: 'center', whiteSpace: 'nowrap' }}>แท็กที่ปิด</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.isArray(data) && data.length > 0 ? (
                                    data.map((row) => (
                                        <tr key={row.conversation_id}>
                                            <td style={{ paddingLeft: 12 }}>
                                                {row.customer_name || "-"}
                                            </td>
                                            <td style={{ textAlign: "left" }}>
                                                {row.closed_at ? new Date(row.closed_at).toLocaleString() : "-"}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                <Chip size="sm" variant="soft">
                                                    {row.tag_name || "ไม่ระบุแท็ก"}
                                                </Chip>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={2} style={{ textAlign: "center", padding: 16 }}>
                                            ไม่พบรายการปิดเคสเดือนนี้
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Box>
                )}
            </ModalDialog>
        </Modal>
    );
}
