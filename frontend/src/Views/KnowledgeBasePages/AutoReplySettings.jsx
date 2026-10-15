import { useEffect, useState } from "react";
import {
    Box, Sheet, Typography, Button, Stack, Slider, ToggleButtonGroup, Chip, Input, Divider, CircularProgress, FormHelperText,
    Select, Option,
} from "@mui/joy";
import { PowerSettingsNew, Science, RocketLaunch, Search, CheckCircle, Cancel, MeetingRoom } from "@mui/icons-material";
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import { kbAutoReplySettingsApi, kbUpdateAutoReplySettingsApi, kbAutoReplyTestApi } from "../../Api/KnowledgeBase.js";

const MODES = {
    off:    { label: 'ปิด',      color: 'neutral', icon: <PowerSettingsNew />, desc: 'ระบบไม่พิจารณาตอบอัตโนมัติเลย' },
    shadow: { label: 'ทดลอง',   color: 'warning', icon: <Science />,          desc: 'บันทึกว่า "ถ้าส่ง จะส่งคำตอบไหน" ในแท็บบันทึกการตัดสินใจ แต่ไม่ส่งถึงลูกค้า' },
    live:   { label: 'ส่งจริง', color: 'success', icon: <RocketLaunch />,     desc: 'ส่งคำตอบให้ลูกค้าทันทีเมื่อผ่านเกณฑ์' },
};

/**
 * การ์ดตั้งค่าระบบ AI ตอบอัตโนมัติ — โหมด, เกณฑ์คะแนน และช่องทดลองพิมพ์คำถาม
 */
export default function AutoReplySettings() {
    const [saved,   setSaved]   = useState(null);   // ค่าที่บันทึกอยู่ใน server
    const [draft,   setDraft]   = useState(null);   // ค่าที่กำลังแก้
    const [saving,  setSaving]  = useState(false);
    const [testQ,   setTestQ]   = useState('');
    const [testing, setTesting] = useState(false);
    const [testRes, setTestRes] = useState(null);
    const [rooms,   setRooms]   = useState([]);     // ตัวเลือกห้อง [{roomId, roomName}]

    useEffect(() => {
        (async () => {
            const { data, status } = await kbAutoReplySettingsApi();
            if (status === 200) {
                const { rooms: roomList = [], ...settings } = data;
                setRooms(roomList);
                const normalized = { ...settings, room_ids: settings.room_ids ?? [] };
                setSaved(normalized);
                setDraft(normalized);
            }
        })();
    }, []);

    if (!draft) {
        return <Sheet variant="outlined" sx={{ p: 2, borderRadius: 'md', mb: 1.5 }}><CircularProgress size="sm" /></Sheet>;
    }

    const dirty = saved && (draft.mode !== saved.mode
        || Number(draft.min_score) !== Number(saved.min_score)
        || Number(draft.min_margin) !== Number(saved.min_margin)
        || [...draft.room_ids].sort().join() !== [...saved.room_ids].sort().join());

    const doSave = async () => {
        setSaving(true);
        const { data, status } = await kbUpdateAutoReplySettingsApi({
            mode: draft.mode, min_score: Number(draft.min_score), min_margin: Number(draft.min_margin),
            room_ids: draft.room_ids,
        });
        setSaving(false);
        if (status === 200) {
            const normalized = { ...data.settings, room_ids: data.settings.room_ids ?? [] };
            setSaved(normalized);
            setDraft(normalized);
            AlertDiaLog({ icon: 'success', title: data.message, timer: 1500 });
        } else {
            AlertDiaLog({ icon: 'error', title: data?.message || 'บันทึกไม่สำเร็จ', text: data?.detail || '' });
        }
    };

    const save = () => {
        if (draft.mode === 'live' && saved?.mode !== 'live') {
            AlertDiaLog({
                icon: 'warning',
                title: 'เปิดส่งให้ลูกค้าจริง?',
                text: 'ระบบจะส่งคำตอบจาก KB ที่เปิดตอบอัตโนมัติให้ลูกค้าทันทีเมื่อผ่านเกณฑ์ โดยไม่ผ่านพนักงาน<br/>แนะนำให้ใช้โหมด "ทดลอง" และตรวจบันทึกก่อน',
                onPassed: (ok) => { if (ok) doSave(); },
            });
            return;
        }
        doSave();
    };

    const runTest = async () => {
        if (!testQ.trim()) return;
        setTesting(true);
        const { data, status } = await kbAutoReplyTestApi(testQ.trim());
        setTesting(false);
        setTestRes(status === 200 ? data : { error: data?.message || 'ทดสอบไม่สำเร็จ' });
    };

    const mode = MODES[saved?.mode] ?? MODES.off;

    return (
        <Sheet variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 'md', mb: 1.5 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} divider={<Divider orientation="vertical" />}>
                {/* ตั้งค่า */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                        <Typography level="title-md">ระบบ AI ตอบอัตโนมัติ</Typography>
                        <Chip size="sm" variant="solid" color={mode.color} startDecorator={mode.icon}>ตอนนี้: {mode.label}</Chip>
                    </Stack>

                    <ToggleButtonGroup
                        size="sm"
                        value={draft.mode}
                        onChange={(_, v) => v && setDraft((d) => ({ ...d, mode: v }))}
                        sx={{ flexWrap: 'wrap' }}
                    >
                        {Object.entries(MODES).map(([key, m]) => (
                            <Button key={key} value={key} color={draft.mode === key ? m.color : 'neutral'} startDecorator={m.icon}>
                                {m.label}
                            </Button>
                        ))}
                    </ToggleButtonGroup>
                    <FormHelperText sx={{ mt: 0.5 }}>{MODES[draft.mode]?.desc}</FormHelperText>

                    <Box sx={{ mt: 2 }}>
                        <Typography level="body-sm" mb={0.5}>ห้องที่ใช้ระบบนี้</Typography>
                        <Select
                            multiple
                            size="sm"
                            placeholder="ทุกห้อง"
                            startDecorator={<MeetingRoom sx={{ fontSize: 16 }} />}
                            value={draft.room_ids}
                            onChange={(_, v) => setDraft((d) => ({ ...d, room_ids: v ?? [] }))}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                    {selected.map((o) => (
                                        <Chip key={o.value} size="sm" variant="soft" color="primary">{o.label}</Chip>
                                    ))}
                                </Box>
                            )}
                            slotProps={{ listbox: { sx: { maxHeight: 300 } } }}
                            sx={{ minWidth: 0 }}
                        >
                            {rooms.map((r) => (
                                <Option key={r.roomId} value={r.roomId} label={r.roomName || r.roomId}>
                                    {r.roomName || r.roomId}
                                    <Typography level="body-xs" color="neutral" sx={{ ml: 'auto', pl: 1 }}>{r.roomId}</Typography>
                                </Option>
                            ))}
                        </Select>
                        <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                            <FormHelperText sx={{ m: 0 }}>
                                {draft.room_ids.length === 0
                                    ? 'ไม่ได้เลือก = ใช้กับทุกห้อง'
                                    : `ใช้เฉพาะ ${draft.room_ids.length} ห้องที่เลือก (ดูจากห้องที่เคสของลูกค้าอยู่ตอนนั้น)`}
                            </FormHelperText>
                            {draft.room_ids.length > 0 && (
                                <Button size="sm" variant="plain" color="neutral" sx={{ minHeight: 0, py: 0 }}
                                    onClick={() => setDraft((d) => ({ ...d, room_ids: [] }))}>
                                    ล้าง (ทุกห้อง)
                                </Button>
                            )}
                        </Stack>
                    </Box>

                    <Box sx={{ mt: 2, px: 1 }}>
                        <Typography level="body-sm">
                            คะแนนความคล้ายขั้นต่ำ: <b>{Number(draft.min_score).toFixed(2)}</b>
                        </Typography>
                        <Slider
                            size="sm" min={0.3} max={1} step={0.05}
                            value={Number(draft.min_score)}
                            onChange={(_, v) => setDraft((d) => ({ ...d, min_score: v }))}
                            marks={[{ value: 0.3, label: 'หลวม' }, { value: 0.6, label: '0.6' }, { value: 1, label: 'ตรงเป๊ะ' }]}
                        />
                        <Typography level="body-sm" sx={{ mt: 1 }}>
                            อันดับ 1 ต้องชนะอันดับ 2 อย่างน้อย: <b>{Number(draft.min_margin).toFixed(2)}</b>
                        </Typography>
                        <Slider
                            size="sm" min={0} max={0.5} step={0.05}
                            value={Number(draft.min_margin)}
                            onChange={(_, v) => setDraft((d) => ({ ...d, min_margin: v }))}
                        />
                        <FormHelperText>
                            คะแนนเทียบคำถามของลูกค้า (สรุปโดย AI) กับ "คำถาม" และ "คำที่ใช้แทนกัน" ของรายการที่เปิดตอบอัตโนมัติ
                        </FormHelperText>
                    </Box>

                    <Stack direction="row" spacing={1} mt={1.5} alignItems="center">
                        <Button size="sm" onClick={save} loading={saving} disabled={!dirty}>บันทึกการตั้งค่า</Button>
                        {dirty && <Button size="sm" variant="plain" color="neutral" onClick={() => setDraft(saved)}>ยกเลิก</Button>}
                        {saved?.updated_by_name && (
                            <Typography level="body-xs" color="neutral">แก้ไขล่าสุดโดย {saved.updated_by_name}</Typography>
                        )}
                    </Stack>
                </Box>

                {/* ทดลองพิมพ์คำถาม */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography level="title-md" mb={1}>ทดลองพิมพ์คำถาม</Typography>
                    <Stack direction="row" spacing={1}>
                        <Input
                            size="sm" sx={{ flex: 1 }}
                            placeholder='เช่น "ลูกค้าต้องการลงทะเบียนรับประกันสินค้า"'
                            value={testQ}
                            onChange={(e) => setTestQ(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') runTest(); }}
                        />
                        <Button size="sm" variant="outlined" startDecorator={<Search />} loading={testing} onClick={runTest}>ทดสอบ</Button>
                    </Stack>
                    <FormHelperText sx={{ mt: 0.5 }}>
                        ตอนใช้งานจริง ระบบจะใช้คำถามที่ AI สรุปจากบทสนทนา (มักขึ้นต้นว่า "ลูกค้าต้องการ...") ไม่ใช่ข้อความดิบของลูกค้า
                    </FormHelperText>

                    {testRes?.error && <Typography level="body-sm" color="danger" mt={1}>{testRes.error}</Typography>}
                    {testRes && !testRes.error && (
                        <Box mt={1.5}>
                            <Chip
                                variant="soft"
                                color={testRes.would_send ? 'success' : 'neutral'}
                                startDecorator={testRes.would_send ? <CheckCircle /> : <Cancel />}
                            >
                                {testRes.would_send ? 'ผ่านเกณฑ์ — จะตอบอัตโนมัติ' : 'ไม่ผ่านเกณฑ์ — ให้พนักงานตอบ'}
                            </Chip>
                            {!testRes.would_send && (
                                <Typography level="body-sm" color="danger" mt={0.5}>
                                    สาเหตุ: {failReason(testRes)}
                                </Typography>
                            )}
                            {testRes.note && <Typography level="body-xs" color="warning" mt={0.5}>{testRes.note}</Typography>}
                            <TestHit title="รายการที่เปิดตอบอัตโนมัติ" hit={testRes.auto_reply?.top} second={testRes.auto_reply?.second} />
                            {testRes.all_approved?.top && testRes.all_approved.top.id !== testRes.auto_reply?.top?.id && (
                                <TestHit
                                    title="ใกล้เคียงที่สุดจากรายการที่อนุมัติทั้งหมด (ยังไม่ได้เปิดตอบอัตโนมัติ)"
                                    hit={testRes.all_approved.top}
                                />
                            )}
                        </Box>
                    )}
                </Box>
            </Stack>
        </Sheet>
    );
}

// อธิบายว่าทำไมผลทดสอบไม่ผ่าน — ลำดับเดียวกับที่ KbAutoReplyService ตัดสินใจ
function failReason(res) {
    const top = res.auto_reply?.top;
    const second = res.auto_reply?.second;
    const minScore = Number(res.settings?.min_score ?? 0);
    const minMargin = Number(res.settings?.min_margin ?? 0);
    const allTop = res.all_approved?.top;

    if (!top) {
        return allTop
            ? `คำถามนี้ใกล้เคียงรายการ #${allTop.id} (คะแนน ${Number(allTop.score).toFixed(3)}) แต่รายการนั้นยังไม่ได้เปิดสวิตช์ "ตอบอัตโนมัติ" — ไปเปิดได้ที่ตาราง "รายการคำถาม/คำตอบ" ด้านล่าง`
            : 'ยังไม่มีรายการที่เปิดสวิตช์ "ตอบอัตโนมัติ" และไม่พบรายการที่ใกล้เคียง';
    }
    if (Number(top.score) < minScore) {
        return `คะแนน ${Number(top.score).toFixed(3)} ต่ำกว่าเกณฑ์ขั้นต่ำ ${minScore.toFixed(2)}`;
    }
    if (second && Number(top.score) - Number(second.score) < minMargin) {
        return `อันดับ 1 (#${top.id}) กับอันดับ 2 (#${second.id}) คะแนนห่างกันแค่ ${(Number(top.score) - Number(second.score)).toFixed(3)} น้อยกว่า ${minMargin.toFixed(2)} — ระบบไม่แน่ใจว่าควรตอบรายการไหน`;
    }
    return 'ไม่ผ่านเงื่อนไข';
}

function TestHit({ title, hit, second }) {
    return (
        <Box mt={1}>
            <Typography level="body-xs" color="neutral">{title}</Typography>
            {hit ? (
                <Typography level="body-sm" sx={{ wordBreak: 'break-word' }}>
                    #{hit.id} {hit.question} — <b>{Number(hit.score).toFixed(3)}</b>
                    {second && (
                        <Typography level="body-xs" color="neutral"> (อันดับ 2: #{second.id} {Number(second.score).toFixed(3)})</Typography>
                    )}
                </Typography>
            ) : (
                <Typography level="body-sm" color="neutral">ไม่พบรายการที่ใกล้เคียง</Typography>
            )}
        </Box>
    );
}
