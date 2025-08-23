import { Modal, ModalDialog, ModalClose, Typography, Table, Box, Button, Sheet } from "@mui/joy";
import dayjs from "dayjs";

export default function EmployeeCaseDetailModal({ open, onClose, user, rows, startDate, endDate }) {
    return (
        <Sheet sx={{ mt: 3 }}>
            <Box sx={{ overflowX: "auto" }}>
                <Modal open={open} onClose={onClose}>
                    <ModalDialog sx={{ width: "90vw", maxWidth: 1100 }}>
                        <ModalClose />
                        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 2, gap: 1, flexWrap: 'wrap' }}>
                            <Typography level="h5">
                                {user?.name ? `พนักงาน: ${user.name}` : "รายละเอียดเคส"}
                            </Typography>
                            {!!startDate && !!endDate && (
                                <Typography level="body-sm" color="neutral">
                                    ช่วงวันที่: {dayjs(startDate).format("DD/MM/YYYY")} - {dayjs(endDate).format("DD/MM/YYYY")}
                                </Typography>
                            )}
                        </Box>
                        <Box sx={{ overflowX: "auto", maxHeight: "65vh" }}>
                            <Table stickyHeader hoverRow variant="outlined" sx={{ minWidth: 950 }}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>สถานะ</th>
                                        <th>ลูกค้า</th>
                                        <th>ห้อง Chat</th>
                                        <th>วันที่-เวลาสร้าง</th>
                                        <th>วันที่-เวลารับงาน</th>
                                        <th>วันที่-เวลาจบงาน</th>
                                        <th>Tag</th>
                                        <th>#</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, i) => (
                                        <tr key={`${row.conversation_id}-${i}`}>
                                            <td>{i + 1}</td>
                                            <td>{row.status_name}</td>
                                            <td>{row.customer_name}</td>
                                            <td>{row.room_name}</td>
                                            <td>{row.start_time}</td>
                                            <td>{row.accept_time}</td>
                                            <td>{row.end_time}</td>
                                            <td>{row.tag_name}</td>
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
                        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                            <Button onClick={onClose} variant="solid">Close</Button>
                        </Box>
                    </ModalDialog>
                </Modal>
            </Box>
        </Sheet>
    );
}
