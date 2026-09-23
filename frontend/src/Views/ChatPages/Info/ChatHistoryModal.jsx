import { Box, Modal, ModalDialog, ModalClose, Divider, CircularProgress } from "@mui/joy";
import Typography from "@mui/joy/Typography";
import HistoryIcon from "@mui/icons-material/History";

// ป้ายชื่อผู้พูดต่อบรรทัด — ลูกค้า (sender มี custId), แอดมิน/พนักงาน (sender มี empCode),
// หรือ Shopee เอง เช่น "Shopee AI ผู้ช่วยตอบแชท"/"Shopee Chatbot" (sender มีแค่ name)
const senderLabel = (sender) => {
    if (sender?.custId) return sender.custName || 'ลูกค้า';
    if (sender?.empCode) return sender.real_name || sender.name || 'แอดมิน';
    return sender?.name || 'ระบบ';
};

// Modal แสดงประวัติแชทที่ดึงมาจาก Shopee (get_message) ตอนกดปุ่ม "ประวัติแชท" ใน Info/main.jsx
// แยกออกมาต่างหาก ไม่ยุ่งกับข้อความในหน้าแชทหลัก (MessagePane) ตามที่ตกลง
export default function ChatHistoryModal({ open, onClose, messages = [], loading = false, summary }) {
    return (
        <Modal open={open} onClose={onClose}>
            <ModalDialog
                size="lg"
                sx={{
                    maxWidth: 560, width: '95vw', maxHeight: '85vh', p: { xs: 2.5, sm: 3 },
                    display: 'flex', flexDirection: 'column',
                }}
            >
                <ModalClose sx={{ '--IconButton-size': '40px' }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexShrink: 0 }}>
                    <HistoryIcon sx={{ color: '#ff5722' }} fontSize="small" />
                    <Typography level="title-lg">ประวัติแชท Shopee</Typography>
                </Box>
                {summary && (
                    <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 1.5, flexShrink: 0 }}>
                        {summary}
                    </Typography>
                )}

                <Divider sx={{ mb: 1.5, flexShrink: 0 }} />

                <Box sx={{ overflowY: 'auto', flex: 1, minHeight: 0, pr: 0.5 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress size="sm" />
                        </Box>
                    ) : messages.length === 0 ? (
                        <Typography level="body-sm" sx={{ color: 'text.tertiary', textAlign: 'center', py: 3 }}>
                            ไม่มีประวัติแชทของลูกค้าคนนี้
                        </Typography>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {messages.map((m) => {
                                const isImage = m.contentType === 'image';
                                const isCustomer = !!m.sender?.custId;
                                return (
                                    <Box
                                        key={m.id ?? m.created_at}
                                        sx={{
                                            display: 'flex', flexDirection: 'column', gap: 0.25,
                                            alignItems: isCustomer ? 'flex-start' : 'flex-end',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', flexDirection: isCustomer ? 'row' : 'row-reverse', gap: 1, maxWidth: '80%' }}>
                                            <Typography level="body-xs" sx={{ fontWeight: 600, color: 'text.tertiary' }}>
                                                {senderLabel(m.sender)}
                                            </Typography>
                                            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                                {m.created_at}
                                            </Typography>
                                        </Box>
                                        <Box
                                            sx={{
                                                p: 1, borderRadius: 'sm', maxWidth: '80%',
                                                bgcolor: isCustomer ? 'background.level1' : 'primary.softBg',
                                                borderTopLeftRadius: isCustomer ? 2 : undefined,
                                                borderTopRightRadius: isCustomer ? undefined : 2,
                                            }}
                                        >
                                            {isImage ? (
                                                <img
                                                    src={m.content}
                                                    alt="chat"
                                                    style={{ maxWidth: 160, maxHeight: 120, borderRadius: 4, display: 'block' }}
                                                />
                                            ) : (
                                                <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                    {m.content}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            </ModalDialog>
        </Modal>
    );
}
