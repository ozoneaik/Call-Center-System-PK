import {
    Box,
    LinearProgress,
    Modal,
    ModalClose,
    ModalDialog,
    Table,
    Typography,
} from "@mui/joy";
import { useTheme } from "@mui/joy/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

export default function InProgressModal({ open, onClose, loading, user, rows }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <Modal open={open} onClose={onClose}>
            <ModalDialog
                layout="center"
                sx={{
                    // width: isMobile ? "90vw" : "700px",
                    maxWidth: "100%",
                    p: 2,
                }}
            >
                <ModalClose />
                <Typography level="h4" mb={1}>
                    เคสกำลังดำเนินการ{" "}
                    {user ? `(${user.name} - ${user.empCode})` : ""}
                </Typography>

                {loading ? (
                    <LinearProgress />
                ) : (
                    <Box
                        sx={{
                            borderRadius: "sm",
                            overflow: "auto",
                            maxHeight: "70vh",
                        }}
                    >
                        <Table
                            stickyHeader
                            hoverRow
                            sx={{
                                minWidth: isMobile ? "100%" : "650px",
                                "& th, & td": {
                                    fontSize: "0.75rem",
                                    padding: "6px 8px",
                                    whiteSpace: "nowrap",
                                    textOverflow: "ellipsis",
                                    overflow: "hidden",
                                },
                            }}
                        >
                            <thead>
                                <tr>
                                    <th style={{ textAlign: "left", paddingLeft: 12 }}>
                                        ชื่อลูกค้า
                                    </th>
                                    <th style={{ width: isMobile ? "auto" : 300, textAlign: "left" }}>
                                        ชื่อห้องแชท
                                    </th>
                                    <th style={{ width: isMobile ? "auto" : 230, textAlign: "left" }}>
                                        เริ่มสนทนาเมื่อ
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows?.length ? (
                                    rows.map((r) => (
                                        <tr key={r.conversation_id}>
                                            <td style={{ paddingLeft: 12 }}>
                                                {r.customer_name || "-"}
                                            </td>
                                            <td style={{ textAlign: "left" }}>
                                                {r.inprogress_room_name
                                                    ? `${r.room_id} (${r.inprogress_room_name})`
                                                    : r.room_id}
                                            </td>
                                            <td>
                                                {r.started_at
                                                    ? new Date(r.started_at).toLocaleString("th-TH", {
                                                        dateStyle: "short",
                                                        timeStyle: "short",
                                                    })
                                                    : "-"}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: "center", padding: 16 }}>
                                            ไม่พบข้อมูล
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
