import { useEffect, useState } from "react";
import {
    Box, Sheet, Typography, Button, Stack, Slider, ToggleButtonGroup, Chip, Divider, CircularProgress, FormHelperText,
    Select, Option, Checkbox, Textarea,
} from "@mui/joy";
import { PowerSettingsNew, Science, RocketLaunch, Search, CheckCircle, Cancel, MeetingRoom, ExpandMore, ExpandLess, WarningAmber, ToggleOn } from "@mui/icons-material";
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import { kbAutoReplySettingsApi, kbUpdateAutoReplySettingsApi, kbAutoReplyTestApi, kbSetAutoReplyApi } from "../../Api/KnowledgeBase.js";

const MODES = {
    off:    { label: 'ปิด',      color: 'neutral', icon: <PowerSettingsNew />, desc: 'ระบบไม่พิจารณาตอบอัตโนมัติเลย' },
    shadow: { label: 'ทดลอง',   color: 'warning', icon: <Science />,          desc: 'บันทึกว่า "ถ้าส่ง จะส่งคำตอบไหน" ในแท็บบันทึกการตัดสินใจ แต่ไม่ส่งถึงลูกค้า' },
    live:   { label: 'ส่งจริง', color: 'success', icon: <RocketLaunch />,     desc: 'ส่งคำตอบให้ลูกค้าทันทีเมื่อผ่านเกณฑ์' },
};

const OPEN_KEY = 'kb_auto_reply_settings_open';

// สถานะเคสที่เลือกให้บอทตอบได้ (ตรงกับ KbAutoReplySetting::CASE_STATUSES)
const CASE_STATUSES = {
    pending:  { label: 'รอรับเรื่อง',    desc: 'ยังไม่มีพนักงานรับเรื่อง' },
    progress: { label: 'กำลังดำเนินการ', desc: 'พนักงานรับเรื่องแล้ว — บอทจะตอบเฉพาะข้อความที่พนักงานยังไม่ได้ตอบ' },
};

/**
 * การ์ดตั้งค่าระบบ AI ตอบอัตโนมัติ — โหมด, เกณฑ์คะแนน และช่องทดลองพิมพ์คำถาม
 */
export default function AutoReplySettings({ onEntriesChanged }) {
    const [saved,   setSaved]   = useState(null);   // ค่าที่บันทึกอยู่ใน server
    const [draft,   setDraft]   = useState(null);   // ค่าที่กำลังแก้
    const [saving,  setSaving]  = useState(false);
    const [testQ,   setTestQ]   = useState('');
    const [testing, setTesting] = useState(false);
    const [useAi,   setUseAi]   = useState(true);
    // hook ทุกตัวต้องอยู่ก่อน early return (if (!draft) ...) ไม่งั้นจำนวน hook แต่ละรอบ render ไม่เท่ากัน
    const [enablingId, setEnablingId] = useState(null);  // ทดสอบผ่าน AI แบบเดียวกับตอนใช้งานจริง
    const [testRes, setTestRes] = useState(null);
    const [rooms,   setRooms]   = useState([]);     // ตัวเลือกห้อง [{roomId, roomName}]
    // พับ/กางการ์ด — จำค่าไว้ในเบราว์เซอร์ (ค่าเริ่มต้น: กาง)
    const [open, setOpen] = useState(() => {
        try { return localStorage.getItem(OPEN_KEY) !== '0'; } catch { return true; }
    });
    const toggleOpen = () => setOpen((v) => {
        try { localStorage.setItem(OPEN_KEY, v ? '0' : '1'); } catch { /* ไม่มี storage ก็ไม่เป็นไร */ }
        return !v;
    });

    useEffect(() => {
        (async () => {
            const { data, status } = await kbAutoReplySettingsApi();
            if (status === 200) {
                const { rooms: roomList = [], ...settings } = data;
                setRooms(roomList);
                const normalized = { ...settings, room_ids: settings.room_ids ?? [], case_statuses: settings.case_statuses ?? ['pending'] };
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
        || [...draft.room_ids].sort().join() !== [...saved.room_ids].sort().join()
        || [...draft.case_statuses].sort().join() !== [...saved.case_statuses].sort().join());

    const doSave = async () => {
        setSaving(true);
        const { data, status } = await kbUpdateAutoReplySettingsApi({
            mode: draft.mode, min_score: Number(draft.min_score), min_margin: Number(draft.min_margin),
            room_ids: draft.room_ids,
            case_statuses: draft.case_statuses,
        });
        setSaving(false);
        if (status === 200) {
            const normalized = { ...data.settings, room_ids: data.settings.room_ids ?? [], case_statuses: data.settings.case_statuses ?? ['pending'] };
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

    // เปิดตอบอัตโนมัติให้รายการที่ทดสอบเจอ แล้วทดสอบซ้ำให้เห็นผลใหม่ทันที
    const enableEntry = (hit) => {
        AlertDiaLog({
            icon: 'question',
            title: `เปิดตอบอัตโนมัติรายการ #${hit.id}?`,
            text: 'เมื่อลูกค้าถามคำถามที่ตรงกับรายการนี้ ระบบจะส่งคำตอบนี้ให้ลูกค้าทันทีโดยไม่ผ่านพนักงาน',
            onPassed: async (ok) => {
                if (!ok) return;
                setEnablingId(hit.id);
                const { data, status } = await kbSetAutoReplyApi([hit.id], true);
                setEnablingId(null);
                if (status !== 200) {
                    AlertDiaLog({ icon: 'error', title: data?.message || 'เปิดไม่สำเร็จ', text: data?.detail || '' });
                    return;
                }
                onEntriesChanged?.();
                runTest();
            },
        });
    };

    const runTest = async () => {
        if (!testQ.trim()) return;
        setTesting(true);
        setTestRes(null);
        const { data, status } = await kbAutoReplyTestApi(testQ.trim(), useAi);
        setTesting(false);
        setTestRes(status === 200 ? data : { error: data?.message || 'ทดสอบไม่สำเร็จ' });
    };

    const mode = MODES[saved?.mode] ?? MODES.off;
    const savedRooms = saved?.room_ids ?? [];
    const savedRoomLabel = savedRooms.length === 0
        ? 'ทุกห้อง'
        : savedRooms.length <= 2
            ? savedRooms.map((id) => rooms.find((r) => r.roomId === id)?.roomName || id).join(', ')
            : `${savedRooms.length} ห้อง`;

    return (
        <Sheet variant="outlined" sx={{ p: { xs: 1.25, sm: 1.5 }, borderRadius: 'md', mb: 1.5, flexShrink: 0 }}>
            {/* แถบหัว: สรุปค่าปัจจุบัน กดเพื่อพับ/กาง */}
            <Stack
                direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap
                onClick={toggleOpen}
                sx={{ cursor: 'pointer', userSelect: 'none' }}
            >
                <Typography level="title-md">ระบบ AI ตอบอัตโนมัติ</Typography>
                <Chip size="sm" variant="solid" color={mode.color} startDecorator={mode.icon}>{mode.label}</Chip>
                <Chip size="sm" variant="soft" color="neutral" startDecorator={<MeetingRoom sx={{ fontSize: 14 }} />}>
                    {savedRoomLabel}
                </Chip>
                <Chip size="sm" variant="soft" color="neutral">
                    เคส: {(saved?.case_statuses ?? ['pending']).map((st) => CASE_STATUSES[st]?.label ?? st).join(' + ')}
                </Chip>
                <Chip size="sm" variant="soft" color="neutral">
                    เกณฑ์ {Number(saved?.min_score ?? 0).toFixed(2)} · ห่างอันดับ 2 ≥ {Number(saved?.min_margin ?? 0).toFixed(2)}
                </Chip>
                {dirty && <Chip size="sm" variant="soft" color="warning">ยังไม่ได้บันทึก</Chip>}
                <Button
                    size="sm" variant="plain" color="neutral"
                    endDecorator={open ? <ExpandLess /> : <ExpandMore />}
                    sx={{ ml: 'auto' }}
                    onClick={(e) => { e.stopPropagation(); toggleOpen(); }}
                >
                    {open ? 'ซ่อนการตั้งค่า' : 'ตั้งค่า / ทดสอบ'}
                </Button>
            </Stack>

            {open && (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mt={1.5} divider={<Divider orientation="vertical" />}>
                {/* ตั้งค่า */}
                <Box sx={{ flex: 1, minWidth: 0 }}>

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

                    <Box sx={{ mt: 2 }}>
                        <Typography level="body-sm" mb={0.5}>ให้บอทตอบเมื่อเคสอยู่ในสถานะ</Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }}>
                            {Object.entries(CASE_STATUSES).map(([key, st]) => {
                                const checked = draft.case_statuses.includes(key);
                                const onlyOne = checked && draft.case_statuses.length === 1;
                                return (
                                    <Checkbox
                                        key={key}
                                        size="sm"
                                        label={st.label}
                                        checked={checked}
                                        // ต้องเลือกอย่างน้อย 1 สถานะ (ถ้าไม่อยากให้ทำงานให้ใช้โหมด "ปิด")
                                        disabled={onlyOne}
                                        onChange={(e) => setDraft((d) => ({
                                            ...d,
                                            case_statuses: e.target.checked
                                                ? [...d.case_statuses, key]
                                                : d.case_statuses.filter((x) => x !== key),
                                        }))}
                                    />
                                );
                            })}
                        </Stack>
                        <FormHelperText sx={{ mt: 0.5 }}>
                            {draft.case_statuses.includes('progress')
                                ? CASE_STATUSES.progress.desc
                                : 'บอทตอบเฉพาะตอนยังไม่มีพนักงานรับเรื่อง เมื่อพนักงานรับเรื่องแล้วบอทจะหยุด'}
                        </FormHelperText>
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
                        {/* <Typography level="body-sm" sx={{ mt: 1 }}>
                            อันดับ 1 ต้องชนะอันดับ 2 อย่างน้อย: <b>{Number(draft.min_margin).toFixed(2)}</b>
                        </Typography> */}
                        {/* <Slider
                            size="sm" min={0} max={0.5} step={0.05}
                            value={Number(draft.min_margin)}
                            onChange={(_, v) => setDraft((d) => ({ ...d, min_margin: v }))}
                        /> */}
                        {/* <FormHelperText>
                            คะแนนเทียบคำถามของลูกค้า (สรุปโดย AI) กับ "คำถาม" และ "คำที่ใช้แทนกัน" ของรายการที่เปิดตอบอัตโนมัติ
                        </FormHelperText> */}
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
                        <Textarea
                            size="sm" sx={{ flex: 1 }} minRows={useAi ? 2 : 1} maxRows={6}
                            placeholder={useAi
                                ? 'พิมพ์แบบที่ลูกค้าพิมพ์ เช่น "ปั้มน้ำแรงดันตก สายสั่น เปลี่ยนอะไหล่ตัวไหนบ้างคะ"'
                                : 'เช่น "ลูกค้าต้องการลงทะเบียนรับประกันสินค้า"'}
                            value={testQ}
                            onChange={(e) => setTestQ(e.target.value)}
                            // Enter = ทดสอบ, Shift+Enter = ขึ้นบรรทัดใหม่ (ใช้จำลองหลายข้อความตอนทดสอบผ่าน AI)
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); runTest(); } }}
                        />
                        <Button size="sm" variant="outlined" startDecorator={<Search />} loading={testing} onClick={runTest}
                            sx={{ alignSelf: 'flex-start' }}>
                            ทดสอบ
                        </Button>
                    </Stack>
                    <Checkbox
                        size="sm" sx={{ mt: 1 }}
                        checked={useAi}
                        onChange={(e) => { setUseAi(e.target.checked); setTestRes(null); }}
                        label="ทดสอบผ่าน AI (เหมือนตอนใช้งานจริง ใช้เวลา ~5-10 วินาที)"
                    />
                    <FormHelperText sx={{ mt: 0.5 }}>
                        {useAi
                            ? 'ให้ AI สรุปข้อความก่อนแล้วค่อยค้น KB เหมือนตอนลูกค้าทักจริง — 1 บรรทัด = 1 ข้อความของลูกค้า (Shift+Enter เพื่อขึ้นบรรทัดใหม่)'
                            : 'เทียบข้อความที่พิมพ์กับ KB ตรงๆ ไม่ผ่าน AI — เหมาะกับลองคำที่ AI สรุปมา (มักขึ้นต้นว่า "ลูกค้าต้องการ...")'}
                    </FormHelperText>
                    {testing && useAi && (
                        <Typography level="body-xs" color="neutral" mt={1}>กำลังให้ AI สรุปคำถาม...</Typography>
                    )}

                    {testRes?.error && <Typography level="body-sm" color="danger" mt={1}>{testRes.error}</Typography>}
                    {testRes && !testRes.error && (
                        <Box mt={1.5}>
                            {testRes.ai && (
                                <Sheet variant="soft" color={testRes.ai.error ? 'danger' : 'primary'} sx={{ p: 1, borderRadius: 'sm', mb: 1 }}>
                                    {testRes.ai.error ? (
                                        <Typography level="body-xs">เรียก AI ไม่สำเร็จ ({testRes.ai.error}) — ค้นจากข้อความที่พิมพ์แทน</Typography>
                                    ) : (
                                        <>
                                            <Typography level="body-xs" fontWeight="lg">AI สรุปคำถาม</Typography>
                                            <Typography level="body-sm" sx={{ wordBreak: 'break-word' }}>{testRes.ai.summary || '-'}</Typography>
                                            <Typography level="body-xs" color="neutral" sx={{ wordBreak: 'break-word' }}>
                                                คำค้น: {testRes.ai.query_used || '-'}
                                            </Typography>
                                        </>
                                    )}
                                </Sheet>
                            )}
                            <TestResult res={testRes} onEnable={enableEntry} enablingId={enablingId} />
                        </Box>
                    )}
                </Box>
            </Stack>
            )}
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

// ผลทดสอบ: ป้ายสถานะ + การ์ดรายการที่ใกล้ที่สุด (ไฮไลต์รายการที่ "ตรงแต่ยังไม่ได้เปิดสวิตช์" ให้เห็นชัด)
function TestResult({ res, onEnable, enablingId }) {
    const minScore = Number(res.settings?.min_score ?? 0);
    const top = res.auto_reply?.top;
    const allTop = res.all_approved?.top;

    // รายการที่อนุมัติแล้วซึ่งผ่านเกณฑ์และดีกว่ารายการที่เปิดอยู่ แต่ยังไม่ได้เปิดสวิตช์ — สาเหตุที่พบบ่อยที่สุดของ "ไม่ผ่าน"
    const blockedHit = !res.would_send && allTop && !allTop.auto_reply
        && Number(allTop.score) >= minScore
        && (!top || Number(allTop.score) > Number(top.score))
        ? allTop : null;

    const status = res.would_send
        ? { color: 'success', icon: <CheckCircle />, text: 'ผ่านเกณฑ์ — จะตอบอัตโนมัติ' }
        : blockedHit
            ? { color: 'warning', icon: <WarningAmber />, text: 'พบคำตอบที่ตรง แต่ยังไม่ได้เปิดตอบอัตโนมัติ' }
            : { color: 'neutral', icon: <Cancel />, text: 'ไม่ผ่านเกณฑ์ — ให้พนักงานตอบ' };

    return (
        <>
            <Chip variant="soft" color={status.color} startDecorator={status.icon}>{status.text}</Chip>
            {!res.would_send && !blockedHit && (
                <Typography level="body-sm" color="danger" mt={0.5}>สาเหตุ: {failReason(res)}</Typography>
            )}
            {res.note && <Typography level="body-xs" color="warning" mt={0.5}>{res.note}</Typography>}

            {blockedHit && (
                <HitCard
                    title="ตรงที่สุด — ยังไม่ได้เปิดตอบอัตโนมัติ"
                    hit={blockedHit} minScore={minScore} color="warning" highlight
                    action={
                        <Button size="sm" color="warning" startDecorator={<ToggleOn />}
                            loading={enablingId === blockedHit.id} onClick={() => onEnable(blockedHit)}>
                            เปิดตอบอัตโนมัติรายการนี้
                        </Button>
                    }
                />
            )}

            <HitCard
                title="ใกล้ที่สุดในรายการที่เปิดตอบอัตโนมัติ"
                hit={top} second={res.auto_reply?.second} minScore={minScore}
                color={res.would_send ? 'success' : 'neutral'} highlight={res.would_send}
                emptyText="ยังไม่มีรายการที่เปิดตอบอัตโนมัติที่ใกล้เคียง"
            />

            {!blockedHit && allTop && allTop.id !== top?.id && (
                <HitCard
                    title={`ใกล้ที่สุดจากรายการที่อนุมัติทั้งหมด${allTop.auto_reply ? '' : ' (ยังไม่ได้เปิดตอบอัตโนมัติ)'}`}
                    hit={allTop} minScore={minScore} color="neutral"
                />
            )}
        </>
    );
}

function HitCard({ title, hit, second, minScore, color, highlight = false, action, emptyText = 'ไม่พบรายการที่ใกล้เคียง' }) {
    const passes = hit && Number(hit.score) >= minScore;
    return (
        <Sheet
            variant={highlight ? 'soft' : 'outlined'}
            color={highlight ? color : 'neutral'}
            sx={{ mt: 1, p: 1.25, borderRadius: 'sm', ...(highlight && { borderLeft: '4px solid', borderColor: `${color}.500` }) }}
        >
            <Typography level="body-xs" color="neutral" mb={0.25}>{title}</Typography>
            {hit ? (
                <>
                    <Typography level="body-sm" sx={{ wordBreak: 'break-word' }}>
                        <b>#{hit.id}</b> {hit.question}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" mt={0.75} flexWrap="wrap" useFlexGap>
                        <Chip size="sm" variant="solid" color={passes ? 'success' : 'neutral'}>
                            คะแนน {Number(hit.score).toFixed(3)} {passes ? '≥' : '<'} เกณฑ์ {minScore.toFixed(2)}
                        </Chip>
                        {second && (
                            <Typography level="body-xs" color="neutral">อันดับ 2: #{second.id} ({Number(second.score).toFixed(3)})</Typography>
                        )}
                        {action && <Box sx={{ ml: 'auto' }}>{action}</Box>}
                    </Stack>
                </>
            ) : (
                <Typography level="body-sm" color="neutral">{emptyText}</Typography>
            )}
        </Sheet>
    );
}
