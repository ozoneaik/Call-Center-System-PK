import { useState } from "react";
import {
  Box,
  Chip,
  Modal,
  ModalDialog,
  ModalClose,
  Typography,
  Table,
  LinearProgress,
  Input,
  Button
} from "@mui/joy";
import useResponsiveModal from "./useResponsiveModal";
import dayjs from "dayjs";

export default function ForwardedModal({ open, onClose, loading, user, data }) {
  const modalSx = useResponsiveModal();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  // ฟิลเตอร์ข้อมูลตามวันที่
  const filteredData = data.filter((row) => {
    if (!startDate && !endDate) return true;

    const time = dayjs(row.forwarded_time);
    const afterStart = startDate ? time.isAfter(dayjs(startDate).startOf("day").subtract(1, "ms")) : true;
    const beforeEnd = endDate ? time.isBefore(dayjs(endDate).endOf("day").add(1, "ms")) : true;

    return afterStart && beforeEnd;
  });

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={modalSx}>
        <ModalClose />
        <Typography level="h4" mb={1}>
          เคสที่ส่งต่อทั้งหมด
        </Typography>
        <Typography level="body-sm" mb={2}>
          {user ? `โดย ${user.name} (${user.empCode})` : ""}
        </Typography>

        {/* 🔹 ฟิลเตอร์วันที่ + ปุ่ม "ดูทั้งหมด" */}
        <Box display="flex" gap={1.5} mb={2} flexWrap="wrap" alignItems="center">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            size="sm"
            sx={{ minWidth: 150 }}
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            size="sm"
            sx={{ minWidth: 150 }}
          />
          <Button
            size="sm"
            variant="outlined"
            color="neutral"
            onClick={handleClearFilters}
          >
            ดูทั้งหมด
          </Button>
        </Box>

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
                  <th style={{ textAlign: "left", paddingLeft: 12 }}>ชื่อลูกค้า</th>
                  <th style={{ textAlign: "center" }}>ห้องที่ส่งต่อ</th>
                  <th style={{ textAlign: "center" }}>เวลา</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <tr key={row.conversation_id}>
                      <td style={{ paddingLeft: 12 }}>{row.customer_name || "-"}</td>
                      <td style={{ textAlign: "center" }}>
                        <Chip size="sm" variant="soft">
                          {row.forwarded_to_room}
                          {row.forwarded_room_name
                            ? ` (${row.forwarded_room_name})`
                            : ""}
                        </Chip>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {row.forwarded_time
                          ? new Date(row.forwarded_time).toLocaleString()
                          : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: 16 }}>
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
