import Typography from "@mui/joy/Typography";
import {
    Button,
    Checkbox,
    Modal,
    ModalClose,
    Sheet,
    Stack,
    Textarea,
    Select,
    Option,
    Box,
    Alert,
} from "@mui/joy";
import DoneIcon from "@mui/icons-material/Done";
import { useMemo, useState, useCallback, useRef } from "react";
import { endTalkApi } from "../../../Api/Messages.js";
import { AlertDiaLog } from "../../../Dialogs/Alert.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useMediaQuery } from "@mui/material";

const ModalEndTalk = (props) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { rateId, activeId, showModalEndTalk, setShowModalEndTalk, tags } = props;
    const [selectedTagId, setSelectedTagId] = useState(null);
    const [assessment, setAssessment] = useState(true);
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const isProcessingRef = useRef(false);

    const selectedTag = useMemo(
        () => (selectedTagId ? (tags || []).find((t) => Number(t.id) === Number(selectedTagId)) : null),
        [selectedTagId, tags]
    );

    const requireNote = !!selectedTag?.require_note;
    const canSubmit = !!selectedTagId && (!requireNote || note.trim().length > 0);

    const endTalk = useCallback(async () => {
        if (isProcessingRef.current || loading) {
            return;
        }
        if (!selectedTagId) {
            return AlertDiaLog({
                icon: "warning",
                title: "เลือกแท็ก",
                text: "กรุณาเลือกแท็กก่อนทำรายการ"
            });
        }

        if (requireNote && !note.trim()) {
            return AlertDiaLog({
                icon: "warning",
                title: "กรอกหมายเหตุ",
                text: "แท็กนี้บังคับให้กรอกหมายเหตุ"
            });
        }

        try {
            isProcessingRef.current = true;
            setLoading(true);

            const { data, status } = await endTalkApi({
                rateId,
                activeConversationId: activeId,
                tagId: selectedTagId,
                Assessment: assessment,
                note: note,
            });

            setShowModalEndTalk(false);

            AlertDiaLog({
                title: data?.message || (status === 200 ? "สำเร็จ" : "ไม่สำเร็จ"),
                text: data?.detail || "",
                icon: status === 200 ? "success" : "error",
                showConfirmButton: true,
                onPassed: (ok) => {
                    if (ok && status === 200) navigate(-1);
                },
            });
        } catch (error) {
            console.error('Error ending talk:', error);
            AlertDiaLog({
                title: "เกิดข้อผิดพลาด",
                text: "ไม่สามารถจบการสนทนาได้ กรุณาลองใหม่อีกครั้ง",
                icon: "error",
            });
        } finally {
            setLoading(false);
            isProcessingRef.current = false;
        }
    }, [selectedTagId, requireNote, note, rateId, activeId, assessment, setShowModalEndTalk, navigate, loading]);

    const handleModalClose = useCallback(() => {
        if (!loading && !isProcessingRef.current) {
            setShowModalEndTalk(false);
        }
    }, [loading, setShowModalEndTalk]);

    return (
        <Modal
            aria-labelledby="modal-title"
            aria-describedby="modal-desc"
            open={showModalEndTalk}
            onClose={handleModalClose}
            sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
        >
            <Sheet
                variant="outlined"
                sx={{ maxWidth: 520, borderRadius: "md", p: 3, boxShadow: "lg", width: "100%" }}
            >
                <ModalClose variant="plain" sx={{ m: 1 }} />
                <Typography component="h2" id="modal-title" level="h4" sx={{ fontWeight: "lg", mb: 1 }}>
                    จบการสนทนา{" "}
                    <Typography fontSize={12} textColor="#ccc">
                        รหัสอ้างอิง R{rateId}_AC{activeId}
                    </Typography>
                </Typography>
                <Stack spacing={2}>
                    <Typography id="modal-desc" textColor="text.tertiary">
                        ระบุ Tag
                    </Typography>
                    <Select
                        placeholder="เลือกแท็ก…"
                        value={selectedTagId ?? null}
                        onChange={(_, v) => setSelectedTagId(v ?? null)}
                        sx={{ mb: 1 }}
                        slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                    >
                        {(tags || []).map((tag) => (
                            <Option key={tag.id} value={tag.id}>
                                {tag.tagName}
                                {tag.require_note ? "— ต้องมีหมายเหตุ" : ""}
                            </Option>
                        ))}
                    </Select>
                    <Checkbox
                        disabled={user.role !== "admin"}
                        label="ส่งแบบประเมินไปหาลูกค้า (เฉพาะผู้ดูแลระบบ)"
                        defaultChecked
                        onChange={(e) => setAssessment(e.target.checked)}
                    />
                    <Alert color='warning'>
                        หายังคุยกับลูกค้ายังดำเนินการต่อ เพื่อการสนทนาที่ต่อเนื่องแนะนำให้กดปุ่ม <br />
                        พักการสนทนาชั่วคราว แทน
                    </Alert>
                    <Box>
                        <Typography level="body-sm" sx={{ mb: 0.5, fontWeight: 600 }}>
                            หมายเหตุ
                            {requireNote && (
                                <Typography component="span" color="danger" sx={{ ml: 0.5 }}>
                                    *จำเป็น
                                </Typography>
                            )}
                        </Typography>
                        <Textarea
                            minRows={4}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={
                                requireNote
                                    ? "แท็กนี้ต้องกรอกหมายเหตุ"
                                    : "เพิ่มหมายเหตุสำหรับการจบสนทนา (ถ้ามี)"
                            }
                            error={requireNote && !note.trim()}
                        />
                        {requireNote && !note.trim() && (
                            <Typography level="body-xs" color="danger" sx={{ mt: 0.5 }}>
                                กรุณากรอกหมายเหตุสำหรับแท็กนี้
                            </Typography>
                        )}
                    </Box>
                    <Typography>
                        กด "ตกลง" เพื่อจบการสนทนา (หากต้องการส่งต่อกรุณาใช้ปุ่ม "ส่งต่อไปยัง" แทน)
                    </Typography>
                </Stack>
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
                    <Button
                        variant="plain"
                        color="neutral"
                        onClick={handleModalClose}
                        disabled={loading}
                    >
                        ยกเลิก
                    </Button>
                    <Button
                        loading={loading}
                        disabled={!canSubmit || isProcessingRef.current}
                        onClick={endTalk}
                    >
                        ตกลง
                    </Button>
                </Box>
            </Sheet>
        </Modal>
    );
};

export const EndTalk = (props) => {
    const { disable, rateId, activeId, tags } = props;
    const [showModalEndTalk, setShowModalEndTalk] = useState(false);
    const isNarrow = useMediaQuery("(max-width: 1000px)");
    const buttonRef = useRef(null); 

    const handleButtonClick = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setTimeout(() => {
            setShowModalEndTalk(true);
        }, 10);
    }, []);

    return (
        <>
            {showModalEndTalk && (
                <ModalEndTalk
                    rateId={rateId}
                    activeId={activeId}
                    showModalEndTalk={showModalEndTalk}
                    setShowModalEndTalk={setShowModalEndTalk}
                    tags={tags}
                />
            )}
            <Button
                ref={buttonRef}
                color="success"
                disabled={disable}
                variant="solid"
                size="sm"
                fullWidth={isNarrow}
                onClick={handleButtonClick}
                startDecorator={<DoneIcon />}
                sx={{
                    pointerEvents: disable ? 'none' : 'auto',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                {!isNarrow && "จบการสนทนา"}
            </Button>
        </>
    );
};