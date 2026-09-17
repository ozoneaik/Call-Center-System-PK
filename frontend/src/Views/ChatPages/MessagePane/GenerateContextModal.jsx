import { useEffect, useState } from "react";
import {
    Box, Checkbox, Button, Modal, ModalDialog, ModalClose, Divider,
} from "@mui/joy";
import Typography from "@mui/joy/Typography";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

// key เดียวกับที่ใช้ทั่วทั้งฟีเจอร์นี้ (MessagePane/main.jsx, Info/main.jsx) — id ของ ChatHistory ถ้ามี
// ไม่งั้น fallback เป็น created_at (เผื่อข้อความที่มาจาก notification สด ๆ ยังไม่มี id)
const keyOf = (m) => m?.id ?? m?.created_at;

// ป้ายชื่อผู้พูดต่อบรรทัด — ลูกค้า (ไม่มี empCode) หรือแอดมิน/พนักงาน (มี empCode, ไม่ใช่ BOT เพราะกรองออกไปแล้ว
// ตั้งแต่ตอนสร้าง candidates ใน MessagePane/main.jsx)
const senderLabel = (sender) => {
    if (!sender?.empCode) return 'ลูกค้า';
    return sender.real_name || sender.name || 'แอดมิน';
};

// Popup ให้แอดมินเลือก context (ข้อความ/รูป) ที่จะส่งให้ AI เอง ก่อนกด Generate AI จริง — เปิดจาก
// MessagePane/main.jsx@handleGenerateAi โดย candidates ที่ส่งเข้ามาตัดข้อความจาก BOT ออกไปแล้ว
// (เห็นเฉพาะข้อความจากลูกค้ากับแอดมินจริง ๆ) ทุกอันถูกเลือกไว้ให้เป็นค่าเริ่มต้น ยกเลิกเป็นรายข้อความได้
export default function GenerateContextModal({ open, onClose, candidates = [], onConfirm, confirming = false }) {
    const [selectedKeys, setSelectedKeys] = useState(() => new Set());

    // ทุกครั้งที่เปิด popup ใหม่ (หรือ candidates เปลี่ยนไปเพราะกดที่ข้อความอื่น) ให้เลือกทุกอันเป็นค่าเริ่มต้น
    useEffect(() => {
        if (open) {
            setSelectedKeys(new Set(candidates.map((c) => String(keyOf(c)))));
        }
    }, [open, candidates]);

    const toggle = (key) => {
        setSelectedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const selectedCount = selectedKeys.size;

    // เลือกทั้งหมด/ยกเลิกทั้งหมด — สลับตามสถานะปัจจุบัน (ถ้าเลือกครบอยู่แล้วกดแล้วยกเลิกทั้งหมด ไม่งั้นเลือกทั้งหมด)
    const allKeys = candidates.map((c) => String(keyOf(c)));
    const allSelected = allKeys.length > 0 && allKeys.every((key) => selectedKeys.has(key));
    const someSelected = selectedCount > 0 && !allSelected;
    const toggleAll = () => {
        setSelectedKeys(allSelected ? new Set() : new Set(allKeys));
    };

    const handleConfirm = () => {
        const selected = candidates.filter((c) => selectedKeys.has(String(keyOf(c))));

        const lines = selected
            .filter((c) => c.contentType === 'text')
            .map((c) => String(c.content ?? '').trim())
            .filter((c) => c !== '');

        // เอารูปล่าสุด (ใบท้ายสุดที่เลือกไว้) เผื่อเลือกไว้หลายรูป — ตรงกับ logic ฝั่ง backend (auto-query เดิม)
        const imageCandidates = selected.filter((c) => c.contentType === 'image' && String(c.content ?? '').trim() !== '');
        const imageUrl = imageCandidates.length > 0
            ? String(imageCandidates[imageCandidates.length - 1].content).trim()
            : null;

        onConfirm?.(lines, imageUrl);
    };

    return (
        <Modal open={open} onClose={confirming ? undefined : onClose}>
            <ModalDialog
                size="lg"
                sx={{
                    maxWidth: 560, width: '95vw', maxHeight: '85vh', p: { xs: 2.5, sm: 3 },
                    display: 'flex', flexDirection: 'column',
                }}
            >
                {!confirming && <ModalClose sx={{ '--IconButton-size': '40px' }} />}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexShrink: 0 }}>
                    <AutoAwesomeIcon color="primary" fontSize="small" />
                    <Typography level="title-lg">เลือกบริบทที่จะส่งให้ AI</Typography>
                </Box>
                <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 1.5, flexShrink: 0 }}>
                    เลือกได้เฉพาะข้อความ/รูปของลูกค้าและแอดมิน (ข้อความจาก BOT ถูกกรองออกให้แล้ว)
                </Typography>

                {candidates.length > 0 && (
                    <Box
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 1, pb: 1, mb: 1,
                            borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0,
                        }}
                    >
                        <Checkbox
                            checked={allSelected}
                            indeterminate={someSelected}
                            onChange={toggleAll}
                            label="เลือกทั้งหมด"
                        />
                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                            ({selectedCount}/{candidates.length})
                        </Typography>
                    </Box>
                )}

                <Box sx={{ overflowY: 'auto', flex: 1, minHeight: 0, pr: 0.5 }}>
                    {candidates.length === 0 ? (
                        <Typography level="body-sm" sx={{ color: 'text.tertiary', textAlign: 'center', py: 3 }}>
                            ไม่มีข้อความให้เลือก (อาจมีแต่ข้อความจาก BOT ในช่วงนี้)
                        </Typography>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {candidates.map((c) => {
                                const key = String(keyOf(c));
                                const isImage = c.contentType === 'image';
                                return (
                                    <Box
                                        key={key}
                                        sx={{
                                            display: 'flex', gap: 1.5, p: 1, borderRadius: 'sm',
                                            bgcolor: 'background.level1', alignItems: 'flex-start',
                                        }}
                                    >
                                        <Checkbox
                                            checked={selectedKeys.has(key)}
                                            onChange={() => toggle(key)}
                                            sx={{ mt: 0.25 }}
                                        />
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography level="body-xs" sx={{ fontWeight: 600, color: 'text.tertiary' }}>
                                                {senderLabel(c.sender)}
                                            </Typography>
                                            {isImage ? (
                                                <Box sx={{ mt: 0.5 }}>
                                                    <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.5 }}>
                                                        (รูปภาพ)
                                                    </Typography>
                                                    <img
                                                        src={c.content}
                                                        alt="context"
                                                        style={{ maxWidth: 120, maxHeight: 90, borderRadius: 4, display: 'block' }}
                                                    />
                                                </Box>
                                            ) : (
                                                <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                    {c.content}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Box>

                <Divider sx={{ my: 1.5, flexShrink: 0 }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, flexShrink: 0 }}>
                    <Button size="lg" variant="outlined" color="neutral" onClick={onClose} disabled={confirming}>
                        ยกเลิก
                    </Button>
                    <Button
                        size="lg"
                        variant="solid"
                        color="primary"
                        startDecorator={<AutoAwesomeIcon fontSize="small" />}
                        onClick={handleConfirm}
                        loading={confirming}
                        disabled={confirming}
                    >
                        Generate AI ({selectedCount} ข้อความที่เลือก)
                    </Button>
                </Box>
            </ModalDialog>
        </Modal>
    );
}
