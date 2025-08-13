import {
    Modal, ModalDialog, ModalClose, Typography, Table,
    Sheet,
    Box
} from "@mui/joy";

export default function TagCaseDetailModal({ open, onClose, tag, rows }) {
    return (
        <Sheet sx={{ mt: 3 }}>
            <Box sx={{ overflowX: "auto" }}>
                <Modal open={open} onClose={onClose}>
                    <ModalDialog sx={{ width: "90vw", maxHeight: 1100 }}>
                        <ModalClose />
                        <Typography level="h5" mb={2} sx={{ fontWeight: 'bold' }}>
                            รายละเอียดเคสของแท็ก: {tag}
                        </Typography>
                        <Box sx={{ overflowX: "auto", maxHeight: "65vh" }}>
                            <Table stickyHeader hoverRow variant="outlined" sx={{ minWidth: 950 }}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>ลูกค้า</th>
                                        <th>ห้อง Chat</th>
                                        <th>วันที่-เวลาสร้าง</th>
                                        <th>วันที่-เวลารับงาน</th>
                                        <th>วันที่-เวลาจบงาน</th>
                                        <th>พนักงาน</th>
                                        <th>#</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, i) => (
                                        <tr key={`${row.conversation_id}-${i}`}>
                                            <td>{i + 1}</td>
                                            <td>{row.customer_name}</td>
                                            <td>{row.room_id || "-"}</td>
                                            <td>{row.start_time}</td>
                                            <td>{row.accept_time}</td>
                                            <td>{row.end_time}</td>
                                            <td>{row.employee_name}</td>
                                            <td>
                                                {row.custId ? (
                                                    <a
                                                        href={`/chatHistory/detail/${row.custId}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        📄
                                                    </a>
                                                ) : (
                                                    <span style={{ color: "gray" }}>ไม่มี custId</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                            </Table>
                        </Box>
                    </ModalDialog>
                </Modal>
            </Box>
        </Sheet>
    );
}
