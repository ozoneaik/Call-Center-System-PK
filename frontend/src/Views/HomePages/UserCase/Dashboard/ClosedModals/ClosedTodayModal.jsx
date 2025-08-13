import { Box, Modal, ModalDialog, ModalClose, Table, Typography, Chip, LinearProgress } from "@mui/joy";
import useResponsiveModal from "./useResponsiveModal";
import dayjs from "dayjs";

const formatDateTime = (val) => (val ? dayjs(val).format("DD/MM/YYYY HH:mm:ss") : "-");

const tagColor = (name) => {
  if (!name) return "neutral";
  const n = String(name).toLowerCase();
  if (n.includes("ร้องเรียน")) return "danger";
  if (n.includes("ประกัน")) return "primary";
  if (n.includes("แจ้งเรื่อง") || n.includes("สอบถาม")) return "warning";
  return "neutral";
};

export default function ClosedTodayModal({ open, onClose, loading, date, user, data = [] }) {
  const modalSx = useResponsiveModal();

  const hasRows = Array.isArray(data) && data.length > 0;

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={modalSx}>
        <ModalClose />
        <Typography level="h4" mb={0.5}>
          ปิดเคสวันนี้ {date ? `(${date})` : ""}
        </Typography>
        <Typography level="body-sm" mb={2}>
          {user ? `ผู้ปิดเคส: ${user.name} (${user.empCode})` : ""}
        </Typography>

        {loading ? (
          <Box>
            <LinearProgress />
            <Typography level="body-sm" mt={1}>กำลังโหลดข้อมูล...</Typography>
          </Box>
        ) : (
          <Box sx={{ borderRadius: "sm", overflow: "auto", maxHeight: 520 }}>
            <Table
              stickyHeader
              hoverRow
              variant="outlined"
              size="sm"
              sx={{
                minWidth: 780,     // กันหัวตารางซ้อนในจอแคบ
                "& th": { whiteSpace: "nowrap" },
                "& th, & td": {
                  fontSize: "0.85rem",
                  padding: "8px 10px",
                },
                "& td.truncate": {
                  maxWidth: 260,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                },
              }}
            >
              <thead>
                <tr>
                  <th style={{ width: 60, textAlign: "center" }}>#</th>
                  <th style={{ width: 260, textAlign: "left" }}>ชื่อลูกค้า</th>
                  <th style={{ width: 230, textAlign: "left" }}>ปิดเมื่อไหร่</th>
                  <th style={{ width: 220, textAlign: "center" }}>แท็กที่ปิด</th>
                  <th style={{ width: 80, textAlign: "center" }}>ดูแชท</th>
                </tr>
              </thead>
              <tbody>
                {hasRows ? (
                  data.map((row, idx) => (
                    <tr key={row.conversation_id ?? `${row.custId}-${idx}`}>
                      <td style={{ textAlign: "center" }}>{idx + 1}</td>
                      <td className="truncate" title={row.customer_name || "-"}>
                        {row.customer_name || "-"}
                      </td>
                      <td className="truncate" title={formatDateTime(row.closed_at)}>
                        {formatDateTime(row.closed_at)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <Chip
                          size="sm"
                          variant="soft"
                          color={tagColor(row.tag_name)}
                          title={row.tag_name || "ไม่ระบุแท็ก"}
                        >
                          {row.tag_name || "ไม่ระบุแท็ก"}
                        </Chip>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {row.custId ? (
                          <a
                            href={`/chatHistory/detail/${row.custId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="เปิดประวัติแชท"
                          >
                            📄
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 20 }}>
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
