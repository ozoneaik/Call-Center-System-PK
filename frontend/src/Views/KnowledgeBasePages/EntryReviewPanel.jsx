import { useState } from "react";
import { Box, Typography, Textarea, Input, Button, Chip, Divider, Stack } from "@mui/joy";
import { Delete, Edit, CheckCircle, Cancel, RestartAlt } from "@mui/icons-material";
import {
    kbUpdateApi, kbApproveApi, kbRejectApi, kbApproveEditedApi, kbResetApi, kbToggleActiveApi, kbDeleteApi,
} from "../../Api/KnowledgeBase.js";
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import { convertFullDate } from "../../Components/Options.jsx";
import { MessageStyle } from "../../styles/MessageStyle.js";

const sourceLabel = { kb: 'จาก KB', web: 'เว็บไซต์', ai: 'AI แนะนำ' };
const statusColor = { pending: 'warning', approved: 'success', rejected: 'danger' };
const statusLabel = { pending: 'รอตรวจสอบ', approved: 'อนุมัติแล้ว', rejected: 'ปรับแก้แล้ว' };

/**
 * เนื้อหาแท็บ "AI" ในหน้าจำลองแชท — บล็อคที่เพิ่มเข้า KB พร้อมพื้นที่ให้แอดมินแก้ไข/อนุมัติ
 * เหมือน EntryModal.jsx เดิม แต่แสดงเป็น panel ถาวรในไซด์บาร์แทน dialog (ไม่มี prev/next — ย้ายไปอยู่ที่ header ของหน้าแทน)
 */
export default function EntryReviewPanel({ entry, onRefresh, onDeleted }) {
    const [mode,        setMode]        = useState(null); // null | 'edit' | 'reject'
    const [loading,     setLoading]     = useState(false);
    const [question,    setQuestion]    = useState('');
    const [answer,      setAnswer]      = useState('');
    const [note,        setNote]        = useState('');
    const [tagName,     setTagName]     = useState('');
    const [adminAnswer, setAdminAnswer] = useState('');
    const [adminNote,   setAdminNote]   = useState('');

    if (!entry) return null;

    const handleStartEdit = () => {
        setQuestion(entry.question ?? '');
        setAnswer(entry.answer ?? '');
        setNote(entry.note ?? '');
        setTagName(entry.tag_name ?? '');
        setMode('edit');
    };

    const handleSaveEdit = async () => {
        if (!question.trim() || !answer.trim()) return;
        setLoading(true);
        const { data, status } = await kbUpdateApi(entry.id, {
            question, answer,
            note: note.trim() || null,
            tag_name: tagName.trim() || null,
        });
        setLoading(false);
        AlertDiaLog({
            icon: status === 200 ? 'success' : 'error', title: data.message, text: data.detail,
            onPassed: () => { if (status === 200) { onRefresh(); setMode(null); } },
        });
    };

    const handleApprove = () => {
        AlertDiaLog({
            icon: 'question', title: 'ยืนยันการอนุมัติ', text: 'ระบบจะใช้คำตอบปัจจุบันเป็นคำตอบหลักสำหรับ AI',
            onPassed: async (confirm) => {
                if (!confirm) return;
                setLoading(true);
                const { data, status } = await kbApproveApi(entry.id);
                setLoading(false);
                AlertDiaLog({
                    icon: status === 200 ? 'success' : 'error', title: data.message, text: data.detail,
                    onPassed: () => onRefresh(),
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
            text: 'ระบบจะใช้คำตอบที่คุณกรอกแทนคำตอบเดิมสำหรับ AI',
            onPassed: async (confirm) => {
                if (!confirm) return;
                setLoading(true);
                const { data, status } = await kbRejectApi(entry.id, {
                    admin_answer: adminAnswer, admin_note: adminNote || null,
                });
                setLoading(false);
                AlertDiaLog({
                    icon: status === 200 ? 'success' : 'error', title: data.message, text: data.detail,
                    onPassed: () => { onRefresh(); setMode(null); setAdminAnswer(''); setAdminNote(''); },
                });
            },
        });
    };

    const handleApproveEdited = () => {
        if (!adminAnswer.trim()) {
            AlertDiaLog({ icon: 'warning', title: 'กรุณากรอกคำตอบที่ปรับแก้', onPassed: () => {} });
            return;
        }
        AlertDiaLog({
            icon: 'question', title: 'ยืนยันบันทึกคำตอบที่แก้ไขและอนุมัติ',
            text: 'ระบบจะใช้คำตอบที่คุณกรอกแทนคำตอบเดิม และตั้งสถานะเป็น "อนุมัติแล้ว" ทันที',
            onPassed: async (confirm) => {
                if (!confirm) return;
                setLoading(true);
                const { data, status } = await kbApproveEditedApi(entry.id, {
                    admin_answer: adminAnswer, admin_note: adminNote || null,
                });
                setLoading(false);
                AlertDiaLog({
                    icon: status === 200 ? 'success' : 'error', title: data.message, text: data.detail,
                    onPassed: () => { onRefresh(); setMode(null); setAdminAnswer(''); setAdminNote(''); },
                });
            },
        });
    };

    const handleReset = () => {
        AlertDiaLog({
            icon: 'question', title: 'รีเซ็ตสถานะเป็น รอตรวจสอบ?',
            text: 'สถานะจะกลับเป็น pending และข้อมูลการอนุมัติจะถูกล้าง',
            onPassed: async (confirm) => {
                if (!confirm) return;
                setLoading(true);
                const { data, status } = await kbResetApi(entry.id);
                setLoading(false);
                AlertDiaLog({
                    icon: status === 200 ? 'success' : 'error', title: data.message, text: data.detail,
                    onPassed: () => onRefresh(),
                });
            },
        });
    };

    const handleToggleActive = () => {
        AlertDiaLog({
            icon: 'question',
            title: entry.is_active ? 'ปิดใช้งานรายการนี้?' : 'เปิดใช้งานรายการนี้?',
            text: entry.is_active ? 'ระบบจะไม่นำรายการนี้ไปใช้ตอบลูกค้าอีก' : 'ระบบจะนำรายการนี้กลับไปใช้ตอบลูกค้า (ต้องอนุมัติแล้วด้วย)',
            onPassed: async (confirm) => {
                if (!confirm) return;
                setLoading(true);
                const { data, status } = await kbToggleActiveApi(entry.id);
                setLoading(false);
                AlertDiaLog({
                    icon: status === 200 ? 'success' : 'error', title: data.message, text: data.detail,
                    onPassed: () => onRefresh(),
                });
            },
        });
    };

    const handleDelete = () => {
        AlertDiaLog({
            icon: 'warning', title: 'ลบรายการนี้ถาวร?', text: 'ไม่สามารถกู้คืนได้ภายหลัง',
            onPassed: async (confirm) => {
                if (!confirm) return;
                setLoading(true);
                const { data, status } = await kbDeleteApi(entry.id);
                setLoading(false);
                AlertDiaLog({
                    icon: status === 200 ? 'success' : 'error', title: data.message, text: data.detail,
                    // ลบสำเร็จแล้ว entry นี้ไม่มีในระบบอีกต่อไป — ห้ามเรียก onRefresh() (จะไปดึง id เดิมซ้ำ
                    // ทำให้ backend หาไม่เจอแล้ว throw error) ต้องพากลับไปหน้ารายการแทน
                    onPassed: () => { if (status === 200) onDeleted(); else onRefresh(); },
                });
            },
        });
    };

    return (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%', overflowY: 'auto' }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={0.5}>
                <Chip color={statusColor[entry.admin_status]} size="sm">
                    {statusLabel[entry.admin_status] ?? entry.admin_status}
                </Chip>
                <Chip color={entry.is_active ? 'success' : 'neutral'} size="sm" variant="outlined">
                    {entry.is_active ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}
                </Chip>
                {entry.source && (
                    <Chip color="neutral" size="sm" variant="outlined">
                        {sourceLabel[entry.source] ?? entry.source}
                    </Chip>
                )}
            </Stack>

            {(entry.message_ref || entry.active_conversation_id) && (
                <Typography level="body-xs" color="primary">
                    📍 ในบทสนทนาด้านซ้าย ช่วงที่แรเงาสีฟ้าคือ "ช่วงบทสนทนา" ที่ใช้สร้าง KB นี้
                    {entry.message_ref && ' ส่วนข้อความที่มีกรอบ+ป้าย คือข้อความต้นทางที่แม่นยำที่สุด'}
                </Typography>
            )}

            {/* เนื้อหาคำถาม-คำตอบ (บล็อคที่ถูกเพิ่มเข้า KB) */}
            <Box sx={MessageStyle.Info.aiCard} component="div">
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography level="title-sm">บล็อคที่เพิ่มเข้า KB</Typography>
                    {mode === null && (
                        <Button size="sm" variant="outlined" color="neutral"
                            startDecorator={<Edit sx={{ fontSize: 14 }} />}
                            onClick={handleStartEdit}>
                            แก้ไข
                        </Button>
                    )}
                </Stack>

                {mode === 'edit' ? (
                    <Stack spacing={1.5}>
                        <Box>
                            <Typography level="body-xs" color="neutral" mb={0.5}>คำถาม *</Typography>
                            <Textarea minRows={2} value={question} onChange={(e) => setQuestion(e.target.value)} />
                        </Box>
                        <Box>
                            <Typography level="body-xs" color="neutral" mb={0.5}>คำตอบ *</Typography>
                            <Textarea minRows={4} value={answer} onChange={(e) => setAnswer(e.target.value)} />
                        </Box>
                        <Box>
                            <Typography level="body-xs" color="neutral" mb={0.5}>หมายเหตุ</Typography>
                            <Textarea minRows={2} value={note} onChange={(e) => setNote(e.target.value)} />
                        </Box>
                        <Box>
                            <Typography level="body-xs" color="neutral" mb={0.5}>แท็ก</Typography>
                            <Input value={tagName} placeholder="ไม่ระบุ" onChange={(e) => setTagName(e.target.value)} />
                        </Box>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="sm" variant="outlined" color="neutral" onClick={() => setMode(null)}>ยกเลิก</Button>
                            <Button size="sm" color="primary" onClick={handleSaveEdit} loading={loading}
                                disabled={!question.trim() || !answer.trim()}>
                                บันทึก
                            </Button>
                        </Stack>
                    </Stack>
                ) : (
                    <Stack spacing={1}>
                        <Box sx={{ p: 1.5, borderRadius: 'sm', bgcolor: 'background.level1', border: '1px solid', borderColor: 'divider' }}>
                            <Typography level="body-xs" color="neutral" mb={0.25}>คำถาม</Typography>
                            <Typography level="body-md" fontWeight="md">{entry.question}</Typography>
                        </Box>
                        <Box sx={{ p: 1.5, borderRadius: 'sm', bgcolor: 'background.level1', border: '1px solid', borderColor: 'divider' }}>
                            <Typography level="body-xs" color="neutral" mb={0.25}>คำตอบ</Typography>
                            <Typography level="body-md" sx={{ whiteSpace: 'pre-wrap' }}>{entry.answer}</Typography>
                        </Box>
                        {entry.answer_attachments?.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {entry.answer_attachments.map((a, idx) => (
                                    <Box key={idx} component="a" href={a.url} target="_blank" rel="noopener noreferrer"
                                        sx={{ width: 90, height: 90, borderRadius: 'sm', overflow: 'hidden', border: '1px solid', borderColor: 'divider', display: 'block' }}>
                                        {a.contentType === 'video' ? (
                                            <video src={a.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <img src={a.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        )}
                                    </Box>
                                ))}
                            </Box>
                        )}
                        {entry.note && (
                            <Box>
                                <Typography level="body-xs" color="neutral" mb={0.25}>หมายเหตุ</Typography>
                                <Typography level="body-sm" color="neutral">{entry.note}</Typography>
                            </Box>
                        )}
                        {entry.tag_name && (
                            <Box><Chip size="sm" color="neutral">{entry.tag_name}</Chip></Box>
                        )}
                    </Stack>
                )}
            </Box>

            {/* ข้อมูลการอนุมัติเดิม */}
            {entry.admin_status !== 'pending' && (
                <>
                    <Divider />
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Typography level="body-sm" color="neutral">
                            ดำเนินการโดย: <strong>{entry.approved_by_name ?? '-'}</strong>
                        </Typography>
                        <Typography level="body-sm" color="neutral">
                            เมื่อ: <strong>{entry.approved_at ? convertFullDate(entry.approved_at) : '-'}</strong>
                        </Typography>
                    </Box>
                    {entry.admin_status === 'rejected' && entry.admin_answer && (
                        <Box>
                            <Typography level="title-sm" mb={0.5} color="danger">คำตอบที่แอดมินปรับแก้ (ใช้แทนคำตอบเดิม)</Typography>
                            <Box sx={{ p: 1.5, borderRadius: 'sm', bgcolor: 'danger.softBg', border: '1px solid', borderColor: 'danger.outlinedBorder' }}>
                                <Typography level="body-md" sx={{ whiteSpace: 'pre-wrap' }}>{entry.admin_answer}</Typography>
                            </Box>
                        </Box>
                    )}
                    {entry.admin_note && (
                        <Box>
                            <Typography level="title-sm" mb={0.5}>หมายเหตุการปรับแก้</Typography>
                            <Typography level="body-sm" color="neutral">{entry.admin_note}</Typography>
                        </Box>
                    )}
                </>
            )}

            <Divider />

            <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={0.5}>
                <Typography level="body-xs" color="neutral">
                    รหัสลูกค้า: <strong>{entry.cust_id ?? '-'}</strong>
                </Typography>
                <Typography level="body-xs" color="neutral">
                    เพิ่มโดย: <strong>{entry.created_by_name ?? '-'}</strong>
                </Typography>
                <Typography level="body-xs" color="neutral">
                    สร้างเมื่อ: <strong>{convertFullDate(entry.created_at)}</strong>
                </Typography>
            </Stack>

            {/* ฟอร์มปรับแก้คำตอบ (workflow ปฏิเสธ/แก้ไข) */}
            {mode === 'reject' && (
                <>
                    <Divider />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Typography level="title-sm" color="danger">คำตอบที่ต้องการแก้ไข *</Typography>
                        <Textarea minRows={4} placeholder="กรอกคำตอบที่ถูกต้อง..."
                            value={adminAnswer} onChange={(e) => setAdminAnswer(e.target.value)} color="danger" />
                        <Typography level="title-sm">หมายเหตุ (ไม่บังคับ)</Typography>
                        <Textarea minRows={2} placeholder="เหตุผลที่ปรับแก้..."
                            value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
                        <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" rowGap={1}>
                            <Button size="sm" variant="outlined" color="neutral" onClick={() => setMode(null)}>ยกเลิก</Button>
                            <Button color="danger" size="sm"
                                startDecorator={<Cancel />} onClick={handleReject} loading={loading}>
                                บันทึกคำตอบที่แก้ไข
                            </Button>
                            <Button color="success" size="sm"
                                startDecorator={<CheckCircle />} onClick={handleApproveEdited} loading={loading}>
                                บันทึกคำตอบที่แก้ไขและอนุมัติ
                            </Button>
                        </Stack>
                    </Box>
                </>
            )}

            {mode === null && (
                <>
                    <Divider />
                    <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                        <Button color="success" size="sm"
                            startDecorator={<CheckCircle />} onClick={handleApprove} loading={loading}>
                            อนุมัติ
                        </Button>
                        <Button color="danger" size="sm" variant="soft"
                            startDecorator={<Cancel />} onClick={() => setMode('reject')}>
                            ปรับแก้คำตอบ
                        </Button>
                        {entry.admin_status !== 'pending' && (
                            <Button variant="outlined" color="neutral" size="sm"
                                startDecorator={<RestartAlt />} onClick={handleReset} loading={loading}>
                                รีเซ็ตสถานะ
                            </Button>
                        )}
                        <Button variant="outlined" color={entry.is_active ? 'neutral' : 'success'} size="sm"
                            onClick={handleToggleActive} loading={loading}>
                            {entry.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                        </Button>
                        <Button variant="outlined" color="danger" size="sm"
                            startDecorator={<Delete />} onClick={handleDelete} loading={loading}>
                            ลบ
                        </Button>
                    </Stack>
                </>
            )}
        </Box>
    );
}
