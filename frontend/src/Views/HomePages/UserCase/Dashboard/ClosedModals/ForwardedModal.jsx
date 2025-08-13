import {
  Box,
  Chip,
  Modal,
  ModalDialog,
  ModalClose,
  Typography,
  Table,
  LinearProgress,
} from "@mui/joy";
import useResponsiveModal from "./useResponsiveModal";
import dayjs from "dayjs";

const formatDateTime = (val) => (val ? dayjs(val).format("DD/MM/YYYY HH:mm:ss") : "-");

const roomColor = (name) => {
  if (!name) return "neutral";
  const n = String(name).toLowerCase();
  if (n.includes("claim") || n.includes("ประกัน")) return "primary";
  if (n.includes("support") || n.includes("ซัพพอร์ต")) return "warning";
  if (n.includes("complain") || n.includes("ร้องเรียน")) return "danger";
  return "neutral";
};

export default function ForwardedModal({ open, onClose, loading, user, data = [], range }) {
  const modalSx = useResponsiveModal();
  const hasRows = Array.isArray(data) && data.length > 0;

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={modalSx}>
        <ModalClose />
        <Typography level="h4" mb={0.5}>
          เคสที่ส่งต่อทั้งหมด
        </Typography>

        <Typography level="body-sm">
          {user ? `โดย ${user.name} (${user.empCode})` : ""}
        </Typography>
        <Typography level="body-sm" mb={2}>
          ช่วงที่ใช้: {range?.start || "-"} ถึง {range?.end || (range ? "-" : "วันนี้")}
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
                minWidth: 780,
                "& th": { whiteSpace: "nowrap" },
                "& th, & td": { fontSize: "0.85rem", padding: "8px 10px" },
                "& td.truncate": {
                  maxWidth: 280,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                },
              }}
            >
              <thead>
                <tr>
                  <th style={{ width: 60, textAlign: "center" }}>#</th>
                  <th style={{ width: 280, textAlign: "left" }}>ชื่อลูกค้า</th>
                  <th style={{ width: 260, textAlign: "center" }}>ห้องที่ส่งต่อ</th>
                  <th style={{ width: 220, textAlign: "center" }}>เวลา</th>
                  {/* <th style={{ width: 90, textAlign: "center" }}>ดูแชท</th> */}
                </tr>
              </thead>
              <tbody>
                {hasRows ? (
                  data.map((row, idx) => (
                    <tr key={row.conversation_id ?? `${row.custId || "x"}-${idx}`}>
                      <td style={{ textAlign: "center" }}>{idx + 1}</td>
                      <td className="truncate" title={row.customer_name || "-"}>
                        {row.customer_name || "-"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <Chip
                          size="sm"
                          variant="soft"
                          color={roomColor(row.forwarded_room_name || row.forwarded_to_room)}
                          title={
                            row.forwarded_room_name
                              ? `${row.forwarded_to_room} (${row.forwarded_room_name})`
                              : row.forwarded_to_room || "-"
                          }
                        >
                          {row.forwarded_to_room}
                          {row.forwarded_room_name ? ` (${row.forwarded_room_name})` : ""}
                        </Chip>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {formatDateTime(row.forwarded_time)}
                      </td>
                      {/* <td style={{ textAlign: "center" }}>
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
                      </td> */}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 20 }}>
                      ไม่พบข้อมูลเคสที่ส่งต่อ
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
