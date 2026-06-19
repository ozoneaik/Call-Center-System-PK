import { useState } from "react";
import {
    Modal, ModalDialog, ModalClose, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Textarea, Button, Chip, Divider, Stack, IconButton,
} from "@mui/joy";
import { CheckCircle, Cancel, RestartAlt, ChevronLeft, ChevronRight, SmartToy, Edit } from "@mui/icons-material";
import { kbApproveApi, kbRejectApi, kbResetApi, kbUpdateAiApi } from "../../Api/KnowledgeBase.js";
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import { convertFullDate } from "../../Components/Options.jsx";

const statusColor  = { pending: 'warning', approved: 'success', rejected: 'danger' };
const statusLabel  = { pending: 'รอตรวจสอบ', approved: 'อนุมัติแล้ว', rejected: 'ปรับแก้คำตอบแล้ว' };
const platformLabel = { line: 'LINE', facebook: 'Facebook', tiktok: 'TikTok' };

function ChatBubble({ msg }) {
    const isAgent    = msg.role === 'agent';
    const isBot      = msg.role === 'bot';
    const timeStr    = msg.sent_at
        ? new Date(msg.sent_at).toLocaleString('th-TH', {
            day: '2-digit', month: '2-digit', year: '2-digit',
            hour: '2-digit', minute: '2-digit',
          })
        : '';

    if (isBot) {
        return (
            <Box sx={{ textAlign: 'center', my: 0.75 }}>
                <Box sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 0.5,
                    px: 1.5, py: 0.5, borderRadius: 'xl',
                    bgcolor: 'neutral.100', border: '1px solid', borderColor: 'neutral.outlinedBorder',
                }}>
                    <SmartToy sx={{ fontSize: 14, color: 'text.tertiary' }} />
                    <Typography level="body-xs" color="neutral" sx={{ whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                    </Typography>
                </Box>
                <Typography level="body-xs" color="neutral" sx={{ display: 'block', mt: 0.25 }}>
                    {timeStr}
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: isAgent ? 'row-reverse' : 'row', mb: 1.25 }}>
            <Box sx={{ maxWidth: '75%' }}>
                <Typography level="body-xs" color="neutral"
                    sx={{ textAlign: isAgent ? 'right' : 'left', mb: 0.3, px: 0.5 }}>
                    {msg.sender_name}
                </Typography>
                <Box sx={{
                    px: 1.5, py: 0.75,
                    borderRadius: isAgent ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                    bgcolor: isAgent ? 'primary.softBg' : 'background.surface',
                    border: '1px solid',
                    borderColor: isAgent ? 'primary.outlinedBorder' : 'neutral.outlinedBorder',
                }}>
                    {msg.contentType === 'image' ? (
                        <Box component="img" src={msg.content}
                            sx={{ maxWidth: '100%', maxHeight: 200, borderRadius: 'sm', display: 'block' }}
                        />
                    ) : msg.contentType === 'sticker' ? (
                        <Typography level="body-xs" color="neutral">🖼 สติกเกอร์</Typography>
                    ) : (
                        <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {msg.content}
                        </Typography>
                    )}
                </Box>
                <Typography level="body-xs" color="neutral"
                    sx={{ textAlign: isAgent ? 'right' : 'left', mt: 0.3, px: 0.5 }}>
                    {timeStr}
                </Typography>
            </Box>
        </Box>
    );
}

export default function ReviewModal({ open, entry, onClose, onRefresh, entries, currentIndex, onNavigate }) {
    const [adminAnswer, setAdminAnswer] = useState('');
    const [adminNote,   setAdminNote]   = useState('');
    const [mode,        setMode]        = useState(null);
    const [loading,     setLoading]     = useState(false);
    const [editTopic,   setEditTopic]   = useState('');
    const [editAnswer,  setEditAnswer]  = useState('');

    const resetForm = () => { setMode(null); setAdminAnswer(''); setAdminNote(''); setEditTopic(''); setEditAnswer(''); };

    const handleEditAi = () => {
        setEditTopic(entry.ai_topic ?? '');
        setEditAnswer(entry.ai_answer ?? '');
        setMode('edit-ai');
    };

    const handleSaveAi = async () => {
        if (!editTopic.trim() || !editAnswer.trim()) return;
        setLoading(true);
        const { data, status } = await kbUpdateAiApi(entry.id, { ai_topic: editTopic, ai_answer: editAnswer });
        setLoading(false);
        AlertDiaLog({
            icon: status === 200 ? 'success' : 'error', title: data.message, text: data.detail,
            onPassed: () => { onRefresh(); setMode(null); },
        });
    };

    const handleClose = () => { resetForm(); onClose(); };

    const handleNavigate = (dir) => { resetForm(); onNavigate(dir); };

    const handleApprove = () => {
        AlertDiaLog({
            icon: 'question', title: 'ยืนยันการอนุมัติ', text: 'ระบบจะใช้คำตอบจาก AI เป็นคำตอบหลัก',
            onPassed: async (confirm) => {
                if (!confirm) return;
                setLoading(true);
                const { data, status } = await kbApproveApi(entry.id);
                setLoading(false);
                AlertDiaLog({
                    icon: status === 200 ? 'success' : 'error', title: data.message, text: data.detail,
                    onPassed: () => { onRefresh(); handleClose(); },
                });
            },
        });
    };

    const handleReject = () => {
        if (!adminAnswer.trim()) {
            AlertDiaLog({ icon: 'warning', title: 'กรุณากรอกคำตอบที่ปรับแก้', onPassed: () => {} });
            return;
        }
        AlertDiaLog({
            icon: 'question', title: 'ยืนยันการบันทึกคำตอบที่แก้ไข',
            text: 'ระบบจะใช้คำตอบที่คุณกรอกแทนคำตอบจาก AI',
            onPassed: async (confirm) => {
                if (!confirm) return;
                setLoading(true);
                const { data, status } = await kbRejectApi(entry.id, {
                    admin_answer: adminAnswer, admin_note: adminNote || null,
                });
                setLoading(false);
                AlertDiaLog({
                    icon: status === 200 ? 'success' : 'error', title: data.message, text: data.detail,
                    onPassed: () => { onRefresh(); handleClose(); },
                });
            },
        });
    };

    const handleReset = () => {
        AlertDiaLog({
            icon: 'question', title: 'รีเซ็ตสถานะเป็น รอตรวจสอบ?',
            text: 'สถานะจะกลับเป็น pending และข้อมูลการยืนยันจะถูกล้าง',
            onPassed: async (confirm) => {
                if (!confirm) return;
                setLoading(true);
                const { data, status } = await kbResetApi(entry.id);
                setLoading(false);
                AlertDiaLog({
                    icon: status === 200 ? 'success' : 'error', title: data.message, text: data.detail,
                    onPassed: () => { onRefresh(); handleClose(); },
                });
            },
        });
    };

    if (!entry) return null;

    const hasPrev    = currentIndex > 0;
    const hasNext    = currentIndex < (entries?.length ?? 0) - 1;
    const messages   = Array.isArray(entry.chat_data) ? entry.chat_data : [];

    return (
        <Modal open={open} onClose={handleClose}>
            <ModalDialog
                layout="center"
                sx={{ width: { xs: '95vw', md: '820px' }, maxHeight: '92vh', overflowY: 'auto' }}
            >
                <ModalClose />

                <DialogTitle>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={0.5}>
                        <Typography level="title-lg">ตรวจสอบบทสนทนา</Typography>
                        <Chip color={statusColor[entry.admin_status]} size="sm">
                            {statusLabel[entry.admin_status]}
                        </Chip>
                        {entry.platform && (
                            <Chip color="neutral" size="sm">{platformLabel[entry.platform] ?? entry.platform}</Chip>
                        )}
                        {entries && (
                            <Typography level="body-xs" color="neutral" sx={{ ml: 'auto !important' }}>
                                {currentIndex + 1} / {entries.length}
                            </Typography>
                        )}
                    </Stack>
                </DialogTitle>

                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>

                    {/* AI fields */}
                    <Box>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <SmartToy sx={{ fontSize: 16, color: 'primary.400' }} />
                                <Typography level="title-sm">AI วิเคราะห์</Typography>
                                {!entry.ai_topic && (
                                    <Chip size="sm" variant="soft" color="neutral" sx={{ fontStyle: 'italic' }}>รอวิเคราะห์</Chip>
                                )}
                            </Stack>
                            {mode !== 'edit-ai' && (
                                <Button size="sm" variant="outlined" color="neutral"
                                    startDecorator={<Edit sx={{ fontSize: 14 }} />}
                                    onClick={handleEditAi}>
                                    แก้ไข AI
                                </Button>
                            )}
                        </Stack>

                        {mode === 'edit-ai' ? (
                            <Stack spacing={1.5}>
                                <Box>
                                    <Typography level="body-xs" color="neutral" mb={0.5}>หัวข้อ *</Typography>
                                    <Textarea minRows={2} placeholder="หัวข้อสั้นๆ สรุปว่าลูกค้าต้องการอะไร"
                                        value={editTopic} onChange={(e) => setEditTopic(e.target.value)} />
                                </Box>
                                <Box>
                                    <Typography level="body-xs" color="neutral" mb={0.5}>คำตอบ *</Typography>
                                    <Textarea minRows={4} placeholder="คำตอบที่ดีที่สุดสำหรับปัญหาหรือคำถามของลูกค้า"
                                        value={editAnswer} onChange={(e) => setEditAnswer(e.target.value)} />
                                </Box>
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    <Button size="sm" variant="outlined" color="neutral" onClick={() => setMode(null)}>ยกเลิก</Button>
                                    <Button size="sm" color="primary" onClick={handleSaveAi} loading={loading}
                                        disabled={!editTopic.trim() || !editAnswer.trim()}>
                                        บันทึก
                                    </Button>
                                </Stack>
                            </Stack>
                        ) : (
                            <Stack spacing={1}>
                                {entry.ai_topic && (
                                    <Box sx={{ p: 1.5, borderRadius: 'sm', bgcolor: 'background.level1', border: '1px solid', borderColor: 'divider' }}>
                                        <Typography level="body-xs" color="neutral" mb={0.25}>หัวข้อ</Typography>
                                        <Typography level="body-md" fontWeight="md">{entry.ai_topic}</Typography>
                                    </Box>
                                )}
                                {entry.ai_answer && (
                                    <Box sx={{ p: 1.5, borderRadius: 'sm', bgcolor: 'background.level1', border: '1px solid', borderColor: 'divider' }}>
                                        <Typography level="body-xs" color="neutral" mb={0.25}>คำตอบ</Typography>
                                        <Typography level="body-md" sx={{ whiteSpace: 'pre-wrap' }}>{entry.ai_answer}</Typography>
                                    </Box>
                                )}
                                {!entry.ai_topic && !entry.ai_answer && (
                                    <Typography level="body-sm" color="neutral" sx={{ fontStyle: 'italic', py: 0.5 }}>
                                        ยังไม่มีข้อมูลจาก AI — กดแก้ไขเพื่อเพิ่มเองได้
                                    </Typography>
                                )}
                            </Stack>
                        )}
                    </Box>
                    <Divider />

                    {/* Chat bubbles */}
                    <Box>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                            <Typography level="title-sm">บทสนทนา</Typography>
                            <Typography level="body-xs" color="neutral">{messages.length} ข้อความ</Typography>
                        </Stack>
                        <Box sx={{
                            p: 1.5, borderRadius: 'sm', minHeight: 80, maxHeight: 380, overflowY: 'auto',
                            bgcolor: 'background.level1', border: '1px solid', borderColor: 'divider',
                        }}>
                            {messages.length > 0
                                ? messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)
                                : <Typography level="body-xs" color="neutral" sx={{ textAlign: 'center', py: 2 }}>ไม่มีข้อความ</Typography>
                            }
                        </Box>
                    </Box>

                    {/* ข้อมูลการยืนยันเดิม */}
                    {entry.admin_status !== 'pending' && (
                        <>
                            <Divider />
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Typography level="body-sm" color="neutral">
                                    ยืนยันโดย: <strong>{entry.approved_by_name ?? '-'}</strong>
                                </Typography>
                                <Typography level="body-sm" color="neutral">
                                    เมื่อ: <strong>{entry.approved_at ? convertFullDate(entry.approved_at) : '-'}</strong>
                                </Typography>
                            </Box>
                            {entry.admin_status === 'rejected' && entry.admin_answer && (
                                <Box>
                                    <Typography level="title-sm" mb={0.5} color="danger">คำตอบที่แอดมินปรับแก้</Typography>
                                    <Box sx={{ p: 1.5, borderRadius: 'sm', bgcolor: 'danger.softBg', border: '1px solid', borderColor: 'danger.outlinedBorder' }}>
                                        <Typography level="body-md" sx={{ whiteSpace: 'pre-wrap' }}>{entry.admin_answer}</Typography>
                                    </Box>
                                </Box>
                            )}
                            {entry.admin_note && (
                                <Box>
                                    <Typography level="title-sm" mb={0.5}>หมายเหตุ</Typography>
                                    <Typography level="body-sm" color="neutral">{entry.admin_note}</Typography>
                                </Box>
                            )}
                        </>
                    )}

                    <Divider />

                    {/* ฟอร์มปรับแก้คำตอบ */}
                    {mode === 'reject' && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Typography level="title-sm" color="danger">คำตอบที่ต้องการแก้ไข *</Typography>
                            <Textarea minRows={4} placeholder="กรอกคำตอบที่ถูกต้อง..."
                                value={adminAnswer} onChange={(e) => setAdminAnswer(e.target.value)} color="danger" />
                            <Typography level="title-sm">หมายเหตุ (ไม่บังคับ)</Typography>
                            <Textarea minRows={2} placeholder="เหตุผลที่ปรับแก้..."
                                value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
                        </Box>
                    )}
                </DialogContent>

                <DialogActions>
                    {/* Prev / Next */}
                    {entries && (
                        <Stack direction="row" spacing={0.5} sx={{ mr: 'auto' }}>
                            <IconButton size="sm" variant="outlined" color="neutral"
                                disabled={!hasPrev} onClick={() => handleNavigate(-1)}>
                                <ChevronLeft />
                            </IconButton>
                            <IconButton size="sm" variant="outlined" color="neutral"
                                disabled={!hasNext} onClick={() => handleNavigate(1)}>
                                <ChevronRight />
                            </IconButton>
                        </Stack>
                    )}

                    {/* Reset */}
                    {entry.admin_status !== 'pending' && (
                        <Button variant="outlined" color="neutral" size="sm"
                            startDecorator={<RestartAlt />} onClick={handleReset} loading={loading}>
                            รีเซ็ตสถานะ
                        </Button>
                    )}

                    {mode === null ? (
                        <>
                            <Button variant="outlined" color="neutral" size="sm" onClick={handleClose}>ปิด</Button>
                            <Button color="danger" size="sm" variant="soft"
                                startDecorator={<Cancel />} onClick={() => setMode('reject')}>
                                ปรับแก้คำตอบ
                            </Button>
                            <Button color="success" size="sm"
                                startDecorator={<CheckCircle />} onClick={handleApprove} loading={loading}>
                                อนุมัติ (ใช้คำตอบ AI)
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outlined" color="neutral" size="sm" onClick={() => setMode(null)}>ยกเลิก</Button>
                            <Button color="danger" size="sm"
                                startDecorator={<Cancel />} onClick={handleReject} loading={loading}>
                                บันทึกคำตอบที่แก้ไข
                            </Button>
                        </>
                    )}
                </DialogActions>
            </ModalDialog>
        </Modal>
    );
}
