import { useEffect, useRef, useState } from "react";
import {
    Box, Sheet, IconButton, Textarea, Button, Divider, Modal, ModalDialog, ModalClose, FormControl, FormLabel,
    Chip, Link, CircularProgress, Dropdown, Menu, MenuButton, MenuItem, ListItemDecorator,
} from "@mui/joy";
import Typography from "@mui/joy/Typography";
import AddIcon from "@mui/icons-material/Add";
import BookmarkAddOutlinedIcon from "@mui/icons-material/BookmarkAddOutlined";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ContentPasteGoIcon from "@mui/icons-material/ContentPasteGo";
import { MessageStyle } from "../../../styles/MessageStyle.js";
import { AlertDiaLog } from "../../../Dialogs/Alert.js";
import { getAiSuggestionsApi, storeAiKbEntryApi, sendBrochurePageApi } from "../../../Api/AiAssistant.js";
import { sendApi } from "../../../Api/Messages.js";

// แหล่งที่มาของคำตอบ: 'kb' = ดึงจากคลังความรู้ที่อนุมัติแล้ว, 'web' = ค้นจากเว็บไซต์/อินเทอร์เน็ต, 'ai' = AI ตอบสดแบบเรียลไทม์
const SOURCE_CONFIG = {
    kb: {
        label: 'จากคลังความรู้ (KB)',
        color: 'success',
        icon: <StorageRoundedIcon fontSize="small" />,
    },
    web: {
        label: 'จากเว็บไซต์',
        color: 'primary',
        icon: <LanguageRoundedIcon fontSize="small" />,
    },
    ai: {
        label: 'AI ตอบสดจากข้อความล่าสุด',
        color: 'warning',
        icon: <AutoAwesomeIcon fontSize="small" />,
    },
};

// จัดรูปแบบวัน-เวลาที่ AI ตอบกลับ ให้อ่านง่าย (การ์ดที่เพิ่งตอบสด ๆ กับที่โหลดจากประวัติ ใช้ format เดียวกัน)
const formatSuggestionDateTime = (iso) => {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// ปรับ popup ให้ใหญ่และอ่านง่ายขึ้น สำหรับผู้ใช้ที่สายตาไม่ดี
// จำกัดความสูงไว้ที่ 90vh + จัดเป็น flex column เพื่อให้เนื้อหาที่ยาวมาก ๆ เลื่อนดูได้เอง
// โดยปุ่มบันทึก/ยกเลิกอยู่ล่างสุดแบบตายตัว ไม่ถูกดันตกจอ
const DIALOG_BOX_SX = {
    maxWidth: 680,
    width: '95vw',
    maxHeight: '90vh',
    p: { xs: 2.5, sm: 4 },
    display: 'flex',
    flexDirection: 'column',
};
// กล่องเนื้อหาที่เลื่อนได้ (ฟอร์มด้านใน) ส่วนหัวข้อกับปุ่มด้านล่างไม่เลื่อนตาม
const DIALOG_SCROLL_SX = { overflowY: 'auto', flex: 1, minHeight: 0, pr: 0.5 };
// จำกัดจำนวนบรรทัดสูงสุดของ Textarea คำตอบ ไม่ให้ยืดจนกินพื้นที่กล่องเลื่อนไปหมด
const ANSWER_TEXTAREA_SX = { fontSize: 'lg' };

// พรีวิวไฟล์รูป/วิดีโอที่แนบไว้กับร่างคำตอบ — ใช้ URL.createObjectURL ชั่วคราวแค่ตอนแสดงผลใน dialog นี้
function AttachedFilePreview({ file, onRemove }) {
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    return (
        <Box sx={{ position: 'relative', width: 90, height: 90, borderRadius: 'sm', overflow: 'hidden', border: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
            {isVideo ? (
                <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <img src={url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            <IconButton
                size="sm" variant="solid" color="danger"
                sx={{ position: 'absolute', top: 2, right: 2, '--IconButton-size': '22px', minHeight: 0 }}
                onClick={onRemove}
            >
                <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
        </Box>
    );
}

function EditDraftDialog({
    open, onClose, question, answer, setQuestion, setAnswer, files, setFiles,
    onSaveAndUse, onSaveUseAndKb, onSaveAndSendNow, sendingNow,
}) {
    const fileInputRef = useRef(null);

    const handleFilesSelected = (e) => {
        const picked = Array.from(e.target.files || []);
        if (picked.length) setFiles((prev) => [...prev, ...picked]);
        // เคลียร์ค่า input เอง ไม่งั้นเลือกไฟล์เดิมซ้ำครั้งที่สองจะไม่ยิง onChange (ค่า input ไม่เปลี่ยน)
        e.target.value = '';
    };

    const handleRemoveFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

    return (
        <Modal open={open} onClose={onClose}>
            <ModalDialog size="lg" sx={DIALOG_BOX_SX}>
                <ModalClose sx={{ '--IconButton-size': '40px' }} />
                <Typography level="title-lg" sx={{ mb: 2, flexShrink: 0 }}>แก้ไขร่างคำตอบ</Typography>

                <Box sx={DIALOG_SCROLL_SX}>
                    <FormControl size="lg" sx={{ mb: 2 }}>
                        <FormLabel sx={{ fontSize: 'lg', mb: 1 }}>คำถาม</FormLabel>
                        <Textarea
                            size="lg"
                            minRows={3}
                            maxRows={8}
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="คำถามของลูกค้า"
                            sx={{ fontSize: 'lg' }}
                        />
                    </FormControl>

                    <FormControl size="lg" sx={{ mb: 2 }}>
                        <FormLabel sx={{ fontSize: 'lg', mb: 1 }}>คำตอบ</FormLabel>
                        <Textarea
                            size="lg"
                            minRows={5}
                            maxRows={16}
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="ร่างคำตอบ"
                            sx={ANSWER_TEXTAREA_SX}
                        />
                    </FormControl>

                    <FormControl size="lg">
                        <FormLabel sx={{ fontSize: 'lg', mb: 1 }}>แนบรูปภาพ/วิดีโอ (ถ้ามี)</FormLabel>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleFilesSelected}
                        />
                        <Button
                            size="sm"
                            variant="outlined"
                            color="neutral"
                            startDecorator={<AttachFileIcon fontSize="small" />}
                            onClick={() => fileInputRef.current?.click()}
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            เลือกไฟล์
                        </Button>

                        {files.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                                {files.map((file, idx) => (
                                    <AttachedFilePreview key={idx} file={file} onRemove={() => handleRemoveFile(idx)} />
                                ))}
                            </Box>
                        )}
                    </FormControl>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 1.5, pt: 2, flexShrink: 0 }}>
                    <Button size="lg" variant="outlined" color="neutral" onClick={onClose} disabled={sendingNow}>
                        ยกเลิก
                    </Button>
                    <Dropdown>
                        <MenuButton
                            size="lg" variant="solid" color="primary"
                            endDecorator={<KeyboardArrowDownIcon />}
                            loading={sendingNow}
                            disabled={sendingNow}
                        >
                            บันทึก
                        </MenuButton>
                        {/* Menu ของ Joy UI portal แยกจาก Modal เอง (ไม่ใช่ลูกใน DOM) จึงไม่ได้ z-index สูงกว่า Modal
                            ให้อัตโนมัติ (Modal ใช้ 1300) ต้องดันขึ้นเองไม่งั้น dropdown จะเรนเดอร์อยู่หลัง
                            ModalDialog มองไม่เห็น/กดไม่โดน (เหมือนปัญหาเดียวกับ Dialogs/Alert.js@raiseAboveModal) */}
                        <Menu placement="top-end" sx={{ zIndex: 1400 }}>
                            <MenuItem onClick={onSaveAndUse}>
                                <ListItemDecorator><ContentPasteGoIcon fontSize="small" /></ListItemDecorator>
                                บันทึก และใช้ร่างคำตอบ
                            </MenuItem>
                            <MenuItem onClick={onSaveUseAndKb}>
                                <ListItemDecorator><BookmarkAddOutlinedIcon fontSize="small" /></ListItemDecorator>
                                บันทึก ใช้ร่างคำตอบ และเข้า KB
                            </MenuItem>
                            <MenuItem
                                color="danger"
                                onClick={onSaveAndSendNow}
                                disabled={sendingNow || (!answer.trim() && files.length === 0)}
                            >
                                <ListItemDecorator><SendRoundedIcon fontSize="small" /></ListItemDecorator>
                                บันทึก ส่งลูกค้า และเข้า KB
                            </MenuItem>
                        </Menu>
                    </Dropdown>
                </Box>
            </ModalDialog>
        </Modal>
    );
}

function AddToKbDialog({ open, onClose, question, answer, note, setQuestion, setAnswer, setNote, files, setFiles, onSave, saving }) {
    const fileInputRef = useRef(null);

    const handleFilesSelected = (e) => {
        const picked = Array.from(e.target.files || []);
        if (picked.length) setFiles((prev) => [...prev, ...picked]);
        e.target.value = '';
    };

    const handleRemoveFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

    return (
        <Modal open={open} onClose={onClose}>
            <ModalDialog size="lg" sx={DIALOG_BOX_SX}>
                <ModalClose sx={{ '--IconButton-size': '40px' }} />
                <Typography level="title-lg" sx={{ mb: 2, flexShrink: 0 }}>บันทึกเข้าคลังความรู้ (KB)</Typography>

                <Box sx={DIALOG_SCROLL_SX}>
                    <FormControl size="lg" sx={{ mb: 2 }}>
                        <FormLabel sx={{ fontSize: 'lg', mb: 1 }}>คำถาม</FormLabel>
                        <Textarea
                            size="lg"
                            minRows={3}
                            maxRows={8}
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="คำถามของลูกค้า"
                            sx={{ fontSize: 'lg' }}
                        />
                    </FormControl>

                    <FormControl size="lg" sx={{ mb: 2 }}>
                        <FormLabel sx={{ fontSize: 'lg', mb: 1 }}>คำตอบ</FormLabel>
                        <Textarea
                            size="lg"
                            minRows={4}
                            maxRows={16}
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="คำตอบที่จะบันทึกเข้า KB"
                            sx={ANSWER_TEXTAREA_SX}
                        />
                    </FormControl>

                    <FormControl size="lg">
                        <FormLabel sx={{ fontSize: 'lg', mb: 1 }}>หมายเหตุ</FormLabel>
                        <Textarea
                            size="lg"
                            minRows={3}
                            maxRows={8}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                            sx={{ fontSize: 'lg' }}
                        />
                    </FormControl>

                    <FormControl size="lg" sx={{ mt: 2 }}>
                        <FormLabel sx={{ fontSize: 'lg', mb: 1 }}>แนบรูปภาพ/วิดีโอ (ถ้ามี)</FormLabel>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleFilesSelected}
                        />
                        <Button
                            size="sm"
                            variant="outlined"
                            color="neutral"
                            startDecorator={<AttachFileIcon fontSize="small" />}
                            onClick={() => fileInputRef.current?.click()}
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            เลือกไฟล์
                        </Button>

                        {files.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                                {files.map((file, idx) => (
                                    <AttachedFilePreview key={idx} file={file} onRemove={() => handleRemoveFile(idx)} />
                                ))}
                            </Box>
                        )}
                    </FormControl>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pt: 2, flexShrink: 0 }}>
                    <Button size="lg" variant="outlined" color="neutral" onClick={onClose} disabled={saving}>
                        ยกเลิก
                    </Button>
                    <Button size="lg" variant="solid" color="primary" onClick={onSave} loading={saving} disabled={saving}>
                        บันทึก
                    </Button>
                </Box>
            </ModalDialog>
        </Modal>
    );
}

function SuggestionCard({ suggestion, onUseDraft, activeId, custId, fallbackMessageRef }) {
    const [question, setQuestion] = useState(suggestion.question || '');
    const [draft, setDraft] = useState(suggestion.content);

    const [editOpen, setEditOpen] = useState(false);
    const [editQuestion, setEditQuestion] = useState('');
    const [editAnswer, setEditAnswer] = useState('');
    // ไฟล์รูป/วิดีโอที่แนบไว้กับร่างคำตอบนี้แล้ว (คอมมิทจาก dialog แก้ไข) — ยังไม่อัปโหลดจริงจนกว่าจะกดส่งข้อความ
    const [attachedFiles, setAttachedFiles] = useState([]);
    // ไฟล์ชั่วคราวระหว่างแก้ไขอยู่ใน dialog (ยังไม่ commit จนกว่าจะกดบันทึก)
    const [editFiles, setEditFiles] = useState([]);

    const [kbOpen, setKbOpen] = useState(false);
    const [kbQuestion, setKbQuestion] = useState('');
    const [kbAnswer, setKbAnswer] = useState('');
    const [kbNote, setKbNote] = useState('');
    const [kbFiles, setKbFiles] = useState([]);
    const [savingKb, setSavingKb] = useState(false);

    // ส่งรูปหน้าแคตตาล็อก (attachment_url) ให้ลูกค้าโดยตรงจากการ์ด
    const [sendingBrochure, setSendingBrochure] = useState(false);
    // ส่งร่างคำตอบที่แก้ไขให้ลูกค้าทันทีจาก dialog แก้ไข (ข้ามขั้นตอนแปะช่องพิมพ์+กดส่งเอง)
    const [sendingNow, setSendingNow] = useState(false);

    const handleSendBrochure = async () => {
        if (sendingBrochure || !suggestion.attachment_url) return;
        setSendingBrochure(true);
        try {
            const { data, status } = await sendBrochurePageApi({
                imageUrl: suggestion.attachment_url,
                custId,
                activeId,
            });
            if (status === 200) {
                AlertDiaLog({
                    icon: 'success',
                    title: 'ส่งรูปสำเร็จ',
                    text: data.message || 'ส่งรูปหน้าแคตตาล็อกให้ลูกค้าเรียบร้อยแล้ว',
                });
            } else {
                AlertDiaLog({
                    icon: 'error',
                    title: 'ส่งรูปไม่สำเร็จ',
                    text: data?.message || data?.error || 'เกิดข้อผิดพลาดในการส่งรูป',
                });
            }
        } finally {
            setSendingBrochure(false);
        }
    };

    const openEditDialog = () => {
        setEditQuestion(question);
        setEditAnswer(draft);
        setEditFiles(attachedFiles); // โหลดไฟล์ที่เคยแนบไว้มาแก้ต่อได้ (ลบ/เพิ่มเติมได้ใน dialog)
        setEditOpen(true);
    };

    // บันทึกร่างที่แก้ไข (รวมไฟล์แนบ) + นำไปแปะในช่องพิมพ์ข้อความให้ทันที (เหมือนลาก-วางไฟล์เอง)
    // รอแอดมินกดปุ่มส่งจริงในกล่องแชทเอง — ไม่ได้อัปโหลด/ส่งให้ลูกค้าทันที ณ จุดนี้
    const saveEditAndUse = () => {
        setQuestion(editQuestion);
        setDraft(editAnswer);
        setAttachedFiles(editFiles);
        setEditOpen(false);
        onUseDraft(editAnswer, editFiles);
    };

    // เหมือน saveEditAndUse แต่เปิด dialog "เพิ่มเข้า KB" ต่อทันทีด้วย พร้อมค่าที่เพิ่งแก้ไข (รวมไฟล์แนบ)
    // ยังให้กรอกหมายเหตุ + กดยืนยันอีกทีใน AddToKbDialog เหมือนทางเข้าอื่น ๆ ของ "เพิ่มเข้า KB"
    const saveEditUseAndKb = () => {
        setQuestion(editQuestion);
        setDraft(editAnswer);
        setAttachedFiles(editFiles);
        setEditOpen(false);
        onUseDraft(editAnswer, editFiles);
        setKbQuestion(editQuestion);
        setKbAnswer(editAnswer);
        setKbNote('');
        setKbFiles(editFiles);
        setKbOpen(true);
    };

    // ส่งร่างที่แก้ไข (รวมไฟล์แนบ) ให้ลูกค้าทันที + บันทึกเข้า KB พร้อมกันในคลิกเดียว
    // ข้ามช่องพิมพ์ข้อความและ dialog หมายเหตุของ KB ไปเลย (ไม่ใส่หมายเหตุ) ต้องยืนยันก่อนทุกครั้งเพราะย้อนกลับไม่ได้
    const confirmSendNowAndKb = () => {
        if (sendingNow || (!editAnswer.trim() && editFiles.length === 0)) return;
        AlertDiaLog({
            icon: 'question',
            title: 'ยืนยันบันทึก/ส่งทันทีและบันทึกเข้า KB?',
            text: 'ระบบจะส่งคำตอบนี้ให้ลูกค้าทันที และบันทึกเข้าคลังความรู้ (KB) พร้อมกัน ไม่สามารถเรียกคืนได้ภายหลัง',
            onPassed: async (confirm) => {
                if (!confirm) return;
                setSendingNow(true);
                try {
                    const { data, status } = await sendApi({
                        msg: editAnswer,
                        contentType: 'text',
                        custId,
                        conversationId: activeId,
                        selectedFile: editFiles,
                    });
                    if (status !== 200) {
                        AlertDiaLog({
                            icon: 'error',
                            title: data?.message || 'ส่งข้อความไม่สำเร็จ',
                            text: data?.detail || 'ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง',
                        });
                        return;
                    }

                    // ส่งให้ลูกค้าสำเร็จแล้ว — commit ค่ากลับเข้าการ์ด + ปิด dialog ก่อน แล้วค่อยบันทึกเข้า KB ต่อ
                    setQuestion(editQuestion);
                    setDraft(editAnswer);
                    setAttachedFiles(editFiles);
                    setEditOpen(false);

                    const kbRes = await storeAiKbEntryApi({
                        question: editQuestion,
                        answer: editAnswer,
                        note: null,
                        source: ['kb', 'web', 'ai'].includes(suggestion.source) ? suggestion.source : null,
                        cust_id: custId || null,
                        active_conversation_id: activeId || null,
                        message_ref: suggestion.message_ref ?? fallbackMessageRef ?? null,
                    }, editFiles);

                    if (kbRes.status === 201 || kbRes.status === 200) {
                        AlertDiaLog({
                            icon: 'success',
                            title: 'ส่งข้อความและบันทึกเข้า KB สำเร็จ',
                            text: 'ส่งคำตอบนี้ให้ลูกค้า และบันทึกเข้าคลังความรู้เรียบร้อยแล้ว',
                        });
                    } else {
                        AlertDiaLog({
                            icon: 'warning',
                            title: 'ส่งข้อความสำเร็จ แต่บันทึกเข้า KB ไม่สำเร็จ',
                            text: kbRes.data?.message || 'กรุณาลองบันทึกเข้า KB อีกครั้งภายหลัง',
                        });
                    }
                } catch (error) {
                    AlertDiaLog({
                        icon: 'error',
                        title: 'เกิดข้อผิดพลาด',
                        text: 'ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง',
                    });
                } finally {
                    setSendingNow(false);
                }
            },
        });
    };

    const openKbDialog = () => {
        setKbQuestion(question);
        setKbAnswer(draft);
        setKbNote('');
        setKbFiles(attachedFiles); // ถ้าเคยแนบไฟล์ไว้กับร่างนี้แล้ว ให้ติดมาด้วย ลบ/เพิ่มเติมได้ใน dialog นี้
        setKbOpen(true);
    };

    const saveToKb = async () => {
        if (savingKb) return;
        setSavingKb(true);
        try {
            const { data, status } = await storeAiKbEntryApi({
                question: kbQuestion,
                answer: kbAnswer,
                note: kbNote || null,
                // source เป็นแท็กสั้น ๆ (kb/web/ai) เท่านั้น — ค่าอื่นให้ส่ง null กัน backend ตีกลับ
                source: ['kb', 'web', 'ai'].includes(suggestion.source) ? suggestion.source : null,
                cust_id: custId || null,
                active_conversation_id: activeId || null,
                // อ้างอิงข้อความต้นทาง — การ์ด "AI ตอบสด" มี message_ref ของตัวเองอยู่แล้ว
                // ส่วนการ์ด "จากคลังความรู้ (KB)" ไม่มี message_ref เฉพาะตัว ใช้ข้อความล่าสุดของลูกค้า
                // ที่ใช้ค้นคลังความรู้รอบนี้แทน (fallbackMessageRef จาก AIPanel)
                message_ref: suggestion.message_ref ?? fallbackMessageRef ?? null,
            }, kbFiles);
            // ปิด dialog ก่อนแสดง alert ทุกกรณี ไม่งั้น popup ของ SweetAlert จะไปอยู่หลัง Modal
            setKbOpen(false);
            if (status === 201 || status === 200) {
                AlertDiaLog({
                    icon: 'success',
                    title: 'บันทึกเข้า KB แล้ว',
                    text: data.message || 'บันทึกความรู้นี้เข้าคลังความรู้เรียบร้อยแล้ว',
                });
            } else {
                AlertDiaLog({
                    icon: 'error',
                    title: 'บันทึกไม่สำเร็จ',
                    text: data?.message || 'เกิดข้อผิดพลาดในการบันทึกเข้า KB',
                });
            }
        } finally {
            setSavingKb(false);
        }
    };

    // กันกดรัว: หลังกด "ใช้ร่างคำตอบนี้" ให้ปุ่มโหลด/ปิดใช้งานชั่วคราวก่อนกดซ้ำได้
    const [usingDraft, setUsingDraft] = useState(false);
    const usingDraftTimeoutRef = useRef(null);

    useEffect(() => () => {
        if (usingDraftTimeoutRef.current) clearTimeout(usingDraftTimeoutRef.current);
    }, []);

    const handleUseDraft = () => {
        if (usingDraft) return;
        setUsingDraft(true);
        onUseDraft(draft, attachedFiles);
        usingDraftTimeoutRef.current = setTimeout(() => setUsingDraft(false), 800);
    };

    return (
        <Sheet variant="outlined" sx={MessageStyle.Info.aiCard}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography level="title-sm">AI Assistant</Typography>
                <IconButton size="sm" variant="soft" color="primary">
                    <AddIcon fontSize="small" />
                </IconButton>
            </Box>

            {formatSuggestionDateTime(suggestion.created_at) && (
                <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 1 }}>
                    ตอบเมื่อ {formatSuggestionDateTime(suggestion.created_at)}
                </Typography>
            )}

            {suggestion.source && SOURCE_CONFIG[suggestion.source] && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    <Chip
                        size="sm"
                        variant="soft"
                        color={SOURCE_CONFIG[suggestion.source].color}
                        startDecorator={SOURCE_CONFIG[suggestion.source].icon}
                    >
                        {SOURCE_CONFIG[suggestion.source].label}
                    </Chip>
                    {suggestion.reference && (
                        suggestion.source === 'web' ? (
                            <Link
                                level="body-xs"
                                href={suggestion.reference}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {suggestion.reference}
                            </Link>
                        ) : (
                            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                {suggestion.reference}
                            </Typography>
                        )
                    )}
                </Box>
            )}

            {question && (
                <Box sx={MessageStyle.Info.aiQuestionBox}>
                    <Typography level="body-xs" sx={{ fontWeight: 600, color: 'text.tertiary', mb: 0.25 }}>
                        คำถามของลูกค้า (สรุปโดย AI)
                    </Typography>
                    <Typography level="body-sm" sx={{ fontStyle: 'italic' }}>
                        “{question}”
                    </Typography>
                </Box>
            )}

            <Box sx={MessageStyle.Info.aiDraftBox}>
                <Typography level="body-sm" sx={{ color: '#fff' }}>{draft}</Typography>
            </Box>

            {/* ไฟล์รูป/วิดีโอที่แนบไว้กับร่างคำตอบนี้ (แนบผ่าน "แก้ไขร่างคำตอบ") */}
            {attachedFiles.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {attachedFiles.map((file, idx) => (
                        <AttachedFilePreview key={idx} file={file} onRemove={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))} />
                    ))}
                </Box>
            )}

            {/* รูปหน้าแคตตาล็อก/โบรชัวร์ที่ AI แนบมา (ถ้ามี) — กดรูปเพื่อดูขนาดเต็มในแท็บใหม่ */}
            {suggestion.attachment_url && (
                <Box sx={{ mt: 1.5 }}>
                    <Typography level="body-xs" sx={{ fontWeight: 600, color: 'text.tertiary', mb: 0.5 }}>
                        รูปหน้าแคตตาล็อกที่แนบมา
                    </Typography>
                    <Link href={suggestion.attachment_url} target="_blank" rel="noopener noreferrer">
                        <img
                            src={suggestion.attachment_url}
                            alt="หน้าแคตตาล็อก"
                            style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 6, display: 'block' }}
                        />
                    </Link>
                </Box>
            )}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                <Button size="sm" variant="soft" color="primary" onClick={openEditDialog}>
                    แก้ไขร่างคำตอบ
                </Button>
                <Button
                    size="sm"
                    variant="outlined"
                    color="neutral"
                    startDecorator={<BookmarkAddOutlinedIcon fontSize="small" />}
                    onClick={openKbDialog}
                >
                    เพิ่มเข้า KB
                </Button>
                <Button
                    size="sm"
                    variant="solid"
                    color="primary"
                    loading={usingDraft}
                    disabled={usingDraft}
                    onClick={handleUseDraft}
                >
                    ใช้ร่างคำตอบนี้
                </Button>
                {suggestion.attachment_url && (
                    <Button
                        size="sm"
                        variant="solid"
                        color="success"
                        startDecorator={<SendRoundedIcon fontSize="small" />}
                        loading={sendingBrochure}
                        disabled={sendingBrochure}
                        onClick={handleSendBrochure}
                    >
                        ส่งรูปนี้ให้ลูกค้า
                    </Button>
                )}
            </Box>

            <EditDraftDialog
                open={editOpen}
                onClose={() => setEditOpen(false)}
                question={editQuestion}
                answer={editAnswer}
                setQuestion={setEditQuestion}
                setAnswer={setEditAnswer}
                files={editFiles}
                setFiles={setEditFiles}
                onSaveAndUse={saveEditAndUse}
                onSaveUseAndKb={saveEditUseAndKb}
                onSaveAndSendNow={confirmSendNowAndKb}
                sendingNow={sendingNow}
            />

            <AddToKbDialog
                open={kbOpen}
                onClose={() => setKbOpen(false)}
                question={kbQuestion}
                answer={kbAnswer}
                note={kbNote}
                setQuestion={setKbQuestion}
                setAnswer={setKbAnswer}
                setNote={setKbNote}
                files={kbFiles}
                setFiles={setKbFiles}
                onSave={saveToKb}
                saving={savingKb}
            />
        </Sheet>
    );
}

// จำนวนการ์ด "AI วิเคราะห์การสนทนา" (liveSuggestions) ที่โชว์ต่อหน้า — กดปุ่ม "ดูเพิ่มเติม" เพื่อโชว์เพิ่มทีละเท่านี้
const LIVE_SUGGESTIONS_PAGE_SIZE = 5;

export default function AIPanel({ activeId, custId, onUseDraft, liveSuggestions = [], liveLoading = false }) {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    // message_ref ของข้อความล่าสุดของลูกค้าที่ backend ใช้ค้นคลังความรู้รอบนี้ — ใช้เป็น fallback
    // ตอนกด "เพิ่มเข้า KB" จากการ์ดในกลุ่มนี้ (การ์ดจาก KB เองไม่มี message_ref เฉพาะตัว)
    const [latestMessageRef, setLatestMessageRef] = useState(null);
    // จำนวนการ์ดวิเคราะห์ AI ที่โชว์อยู่ตอนนี้ (paginate ฝั่ง client เพราะโหลดประวัติมาครบอยู่แล้ว)
    const [visibleLiveCount, setVisibleLiveCount] = useState(LIVE_SUGGESTIONS_PAGE_SIZE);
    // จำนวนการ์ดคำแนะนำจาก KB ที่โชว์อยู่ตอนนี้ — แยก state จาก live เพราะเป็นคนละ list กัน
    const [visibleKbCount, setVisibleKbCount] = useState(LIVE_SUGGESTIONS_PAGE_SIZE);

    // สลับห้องแชท ให้รีเซ็ตกลับไปโชว์แค่ 5 อันล่าสุดใหม่ทุกครั้ง (ทั้ง live และ KB)
    useEffect(() => {
        setVisibleLiveCount(LIVE_SUGGESTIONS_PAGE_SIZE);
        setVisibleKbCount(LIVE_SUGGESTIONS_PAGE_SIZE);
    }, [activeId]);

    useEffect(() => {
        let isMounted = true;

        const fetchSuggestions = async () => {
            setLoading(true);
            const { data, status } = await getAiSuggestionsApi(activeId);
            if (!isMounted) return;
            if (status === 200) {
                setSummary(data.summary || '');
                setSuggestions(data.suggestions || []);
                setLatestMessageRef(data.latest_customer_message_ref || null);
            }
            setLoading(false);
        };

        if (activeId) {
            fetchSuggestions();
        } else {
            setLoading(false);
        }

        return () => {
            isMounted = false;
        };
    }, [activeId]);

    const hasLive = liveLoading || liveSuggestions.length > 0;

    return (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, height: '100%', overflowY: 'auto' }}>
            {/* คำแนะนำจริงที่ AI สร้างอัตโนมัติทันทีที่ลูกค้าทักเข้ามา (ยิงผ่าน chat-oc-any) — ใส่กรอบสีส้ม (warning)
                แยกให้เห็นชัดว่าเป็นคนละ section กับคำแนะนำจาก KB ด้านล่าง (กันสับสนว่าเป็น list เดียวกัน) */}
            {hasLive && (
                <Sheet variant="soft" color="warning" sx={{ p: 1.5, borderRadius: 'md', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AutoAwesomeIcon fontSize="small" color="warning" />
                        <Typography level="title-sm">AI ตอบสดจากข้อความล่าสุด</Typography>
                    </Box>

                    {liveLoading && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size="sm" />
                            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                AI กำลังวิเคราะห์ข้อความล่าสุดจากลูกค้า...
                            </Typography>
                        </Box>
                    )}
                    {liveSuggestions.slice(0, visibleLiveCount).map((s) => (
                        <SuggestionCard key={s.id} suggestion={s} onUseDraft={onUseDraft} activeId={activeId} custId={custId} />
                    ))}
                    {liveSuggestions.length > visibleLiveCount && (
                        <Button
                            size="sm"
                            variant="soft"
                            color="warning"
                            onClick={() => setVisibleLiveCount((c) => c + LIVE_SUGGESTIONS_PAGE_SIZE)}
                        >
                            ดูเพิ่มเติม ({liveSuggestions.length - visibleLiveCount})
                        </Button>
                    )}
                </Sheet>
            )}

            {/* คำแนะนำจากคลังความรู้ (KB) — ใส่กรอบสีเขียว (success) แยกจาก section ด้านบน */}
            <Sheet variant="soft" color="success" sx={{ p: 1.5, borderRadius: 'md', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StorageRoundedIcon fontSize="small" color="success" />
                    <Typography level="title-sm">คำแนะนำจากคลังความรู้ (KB)</Typography>
                </Box>
                <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: -1 }}>
                    จับคู่จากข้อความล่าสุดของลูกค้า
                </Typography>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size="sm" />
                    </Box>
                ) : (
                    <>
                        {/* สรุปคำถามของลูกค้าในแชท: ช่องหลักด้านบนสุด ก่อนร่างคำตอบที่แนะนำ */}
                        {summary && (
                            <Sheet variant="soft" color="primary" sx={MessageStyle.Info.aiSummaryCard}>
                                <Typography level="title-sm" sx={{ mb: 0.5 }}>สรุปคำถามของลูกค้า</Typography>
                                <Typography level="body-sm">{summary}</Typography>
                            </Sheet>
                        )}

                        {suggestions.length === 0 ? (
                            <Typography level="body-sm" sx={{ color: 'text.tertiary', textAlign: 'center' }}>
                                ไม่พบคำตอบที่ใกล้เคียงในคลังความรู้
                            </Typography>
                        ) : (
                            <>
                                {suggestions.slice(0, visibleKbCount).map((s) => (
                                    <SuggestionCard
                                        key={s.id} suggestion={s} onUseDraft={onUseDraft}
                                        activeId={activeId} custId={custId} fallbackMessageRef={latestMessageRef}
                                    />
                                ))}
                                {suggestions.length > visibleKbCount && (
                                    <Button
                                        size="sm"
                                        variant="soft"
                                        color="success"
                                        onClick={() => setVisibleKbCount((c) => c + LIVE_SUGGESTIONS_PAGE_SIZE)}
                                    >
                                        ดูเพิ่มเติม ({suggestions.length - visibleKbCount})
                                    </Button>
                                )}
                            </>
                        )}
                    </>
                )}
            </Sheet>
        </Box>
    );
}
