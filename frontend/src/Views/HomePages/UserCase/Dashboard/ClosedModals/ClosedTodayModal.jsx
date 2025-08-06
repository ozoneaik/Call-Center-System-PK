import { Box, Modal, ModalDialog, ModalClose, Table, Typography, Chip, LinearProgress } from "@mui/joy";
import useResponsiveModal from "./useResponsiveModal";

export default function ClosedTodayModal({ open, onClose, loading, date, user, data }) {
  const modalSx = useResponsiveModal();

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={modalSx}>
        <ModalClose />
        <Typography level="h4" mb={1}>
          ปิดเคสวันนี้ {date ? `(${date})` : ""}
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
            <Table
              stickyHeader
              hoverRow
              sx={{
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
                        <a href={`/chatHistory/detail/${row.custId}`} target="_blank" rel="noopener noreferrer" > {row.customer_name || "-"} </a>
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
                    <td colSpan={4} style={{ textAlign: "center", padding: 16 }}>
                      ไม่พบรายการปิดเคสวันนี้
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
