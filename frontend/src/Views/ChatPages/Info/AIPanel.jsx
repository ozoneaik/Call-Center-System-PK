import { useEffect, useRef, useState } from "react";
import { Box, Sheet, IconButton, Textarea, Button, Divider, Modal, ModalDialog, ModalClose, FormControl, FormLabel, Chip, Link, CircularProgress } from "@mui/joy";
import Typography from "@mui/joy/Typography";
import AddIcon from "@mui/icons-material/Add";
import BookmarkAddOutlinedIcon from "@mui/icons-material/BookmarkAddOutlined";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { MessageStyle } from "../../../styles/MessageStyle.js";
import { AlertDiaLog } from "../../../Dialogs/Alert.js";
import { getAiSuggestionsApi } from "../../../Api/AiAssistant.js";

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

// ปรับ popup ให้ใหญ่และอ่านง่ายขึ้น สำหรับผู้ใช้ที่สายตาไม่ดี
const DIALOG_BOX_SX = { maxWidth: 680, width: '95vw', p: { xs: 2.5, sm: 4 } };

function EditDraftDialog({ open, onClose, question, answer, setQuestion, setAnswer, onSave }) {
    return (
        <Modal open={open} onClose={onClose}>
            <ModalDialog size="lg" sx={DIALOG_BOX_SX}>
                <ModalClose sx={{ '--IconButton-size': '40px' }} />
                <Typography level="title-lg" sx={{ mb: 2 }}>แก้ไขร่างคำตอบ</Typography>

                <FormControl size="lg" sx={{ mb: 2 }}>
                    <FormLabel sx={{ fontSize: 'lg', mb: 1 }}>คำถาม</FormLabel>
                    <Textarea
                        size="lg"
                        minRows={3}
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="คำถามของลูกค้า"
                        sx={{ fontSize: 'lg' }}
                    />
                </FormControl>

                <FormControl size="lg" sx={{ mb: 3 }}>
                    <FormLabel sx={{ fontSize: 'lg', mb: 1 }}>คำตอบ</FormLabel>
                    <Textarea
                        size="lg"
                        minRows={5}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="ร่างคำตอบ"
                        sx={{ fontSize: 'lg' }}
                    />
                </FormControl>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                    <Button size="lg" variant="outlined" color="neutral" onClick={onClose}>
                        ยกเลิก
                    </Button>
                    <Button size="lg" variant="solid" color="primary" onClick={onSave}>
                        บันทึก
                    </Button>
                </Box>
            </ModalDialog>
        </Modal>
    );
}

function AddToKbDialog({ open, onClose, question, answer, note, setQuestion, setAnswer, setNote, onSave }) {
    return (
        <Modal open={open} onClose={onClose}>
            <ModalDialog size="lg" sx={DIALOG_BOX_SX}>
                <ModalClose sx={{ '--IconButton-size': '40px' }} />
                <Typography level="title-lg" sx={{ mb: 2 }}>บันทึกเข้าคลังความรู้ (KB)</Typography>

                <FormControl size="lg" sx={{ mb: 2 }}>
                    <FormLabel sx={{ fontSize: 'lg', mb: 1 }}>คำถาม</FormLabel>
                    <Textarea
                        size="lg"
                        minRows={3}
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
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="คำตอบที่จะบันทึกเข้า KB"
                        sx={{ fontSize: 'lg' }}
                    />
                </FormControl>

                <FormControl size="lg" sx={{ mb: 3 }}>
                    <FormLabel sx={{ fontSize: 'lg', mb: 1 }}>หมายเหตุ</FormLabel>
                    <Textarea
                        size="lg"
                        minRows={3}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                        sx={{ fontSize: 'lg' }}
                    />
                </FormControl>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                    <Button size="lg" variant="outlined" color="neutral" onClick={onClose}>
                        ยกเลิก
                    </Button>
                    <Button size="lg" variant="solid" color="primary" onClick={onSave}>
                        บันทึก
                    </Button>
                </Box>
            </ModalDialog>
        </Modal>
    );
}

function SuggestionCard({ suggestion, onUseDraft }) {
    const [question, setQuestion] = useState(suggestion.question || '');
    const [draft, setDraft] = useState(suggestion.content);

    const [editOpen, setEditOpen] = useState(false);
    const [editQuestion, setEditQuestion] = useState('');
    const [editAnswer, setEditAnswer] = useState('');

    const [kbOpen, setKbOpen] = useState(false);
    const [kbQuestion, setKbQuestion] = useState('');
    const [kbAnswer, setKbAnswer] = useState('');
    const [kbNote, setKbNote] = useState('');

    const openEditDialog = () => {
        setEditQuestion(question);
        setEditAnswer(draft);
        setEditOpen(true);
    };

    const saveEdit = () => {
        setQuestion(editQuestion);
        setDraft(editAnswer);
        setEditOpen(false);
    };

    const openKbDialog = () => {
        setKbQuestion(question);
        setKbAnswer(draft);
        setKbNote('');
        setKbOpen(true);
    };

    const saveToKb = () => {
        // TODO: ยังไม่มี endpoint สำหรับบันทึก KB จากแชทที่กำลังดำเนินอยู่ รอเชื่อมต่อ backend จริง
        setKbOpen(false);
        AlertDiaLog({
            icon: 'success',
            title: 'บันทึกเข้า KB แล้ว',
            text: 'ตัวอย่างการแสดงผล (ยังไม่เชื่อมต่อ backend จริง)',
        });
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
        onUseDraft(draft);
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
            </Box>

            <EditDraftDialog
                open={editOpen}
                onClose={() => setEditOpen(false)}
                question={editQuestion}
                answer={editAnswer}
                setQuestion={setEditQuestion}
                setAnswer={setEditAnswer}
                onSave={saveEdit}
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
                onSave={saveToKb}
            />
        </Sheet>
    );
}

export default function AIPanel({ activeId, onUseDraft, liveSuggestions = [], liveLoading = false }) {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        let isMounted = true;

        const fetchSuggestions = async () => {
            setLoading(true);
            const { data, status } = await getAiSuggestionsApi(activeId);
            if (!isMounted) return;
            if (status === 200) {
                setSummary(data.summary || '');
                setSuggestions(data.suggestions || []);
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
            {/* คำแนะนำจริงที่ AI สร้างอัตโนมัติทันทีที่ลูกค้าทักเข้ามา (ยิงผ่าน chat-oc-any) */}
            {hasLive && (
                <>
                    {liveLoading && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size="sm" />
                            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                AI กำลังวิเคราะห์ข้อความล่าสุดจากลูกค้า...
                            </Typography>
                        </Box>
                    )}
                    {liveSuggestions.map((s) => (
                        <SuggestionCard key={s.id} suggestion={s} onUseDraft={onUseDraft} />
                    ))}
                    <Divider />
                </>
            )}

            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                ตัวอย่างคำแนะนำอัตโนมัติ (mock รอเชื่อมต่อ AI วิเคราะห์บทสนทนาจริง)
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

                    <Divider />

                    {suggestions.length === 0 ? (
                        <Typography level="body-sm" sx={{ color: 'text.tertiary', textAlign: 'center' }}>
                            ยังไม่มีคำแนะนำจาก AI สำหรับแชทนี้
                        </Typography>
                    ) : (
                        suggestions.map((s) => (
                            <SuggestionCard key={s.id} suggestion={s} onUseDraft={onUseDraft} />
                        ))
                    )}
                </>
            )}
        </Box>
    );
}
