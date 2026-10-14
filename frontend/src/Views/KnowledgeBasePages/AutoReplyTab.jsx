import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box, Sheet, Table, Typography, CircularProgress, Chip, Button, Select, Option,
    Stack, Input, IconButton, Switch, Checkbox, Tooltip, Alert,
    Modal, ModalDialog, ModalClose, Divider, Tabs, TabList, Tab, TabPanel,
} from "@mui/joy";
import { Search, ChevronLeft, ChevronRight, LocalOffer, AutoMode, Attachment, InfoOutlined, Visibility, OpenInNew, InsertDriveFile } from "@mui/icons-material";
import { forceHttps } from "../../utils.js";
import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import { convertFullDate } from "../../Components/Options.jsx";
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import { kbAutoReplyListApi, kbSetAutoReplyApi } from "../../Api/KnowledgeBase.js";
import AutoReplySettings from "./AutoReplySettings.jsx";
import AutoReplyLogs from "./AutoReplyLogs.jsx";

const PAGE_SIZE  = 20;
const emptyMeta  = { current_page: 1, per_page: PAGE_SIZE, total: 0, last_page: 1 };
const clampSx    = (lines) => ({
    overflow: 'hidden', textOverflow: 'ellipsis',
    display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical',
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
});

/**
 * แท็บ "จัดการข้อความส่งอัตโนมัติ" — แสดงคำถาม/คำตอบที่อนุมัติแล้ว ให้แอดมินเลือกทีละรายการ (หรือหลายรายการ)
 * ว่าจะให้ AI ส่งคำตอบนี้ให้ลูกค้าอัตโนมัติหรือไม่
 */
function AutoReplyEntries({ tags = [], onChanged }) {
    const [entries,   setEntries]   = useState([]);
    const [meta,      setMeta]      = useState(emptyMeta);
    const [loading,   setLoading]   = useState(false);
    const [autoFilter, setAutoFilter] = useState('all');
    const [tagFilter, setTagFilter] = useState('all');
    const [search,    setSearch]    = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selected,  setSelected]  = useState([]);
    const [savingIds, setSavingIds] = useState([]);
    const [viewing,   setViewing]   = useState(null); // รายการที่เปิดดูคำตอบเต็มใน modal

    const fetchList = async (pageNum = 1) => {
        setLoading(true);
        const { data, status } = await kbAutoReplyListApi({
            autoReply: autoFilter, tagName: tagFilter, search: debouncedSearch, page: pageNum, perPage: PAGE_SIZE,
        });
        if (status === 200) {
            setEntries(data.list);
            setMeta(data.meta);
        }
        setSelected([]);
        setLoading(false);
    };

    useEffect(() => {
        fetchList(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoFilter, tagFilter, debouncedSearch]);

    useEffect(() => {
        if (search === '') { setDebouncedSearch(''); return; }
        const t = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(t);
    }, [search]);

    // บันทึกค่า auto_reply — อัปเดตหน้าจอทันที (optimistic) แล้วย้อนกลับถ้าบันทึกไม่สำเร็จ
    const saveAutoReply = async (ids, enabled) => {
        const before = entries;
        setSavingIds((prev) => [...prev, ...ids]);
        setEntries((prev) => prev.map((e) => (ids.includes(e.id) ? { ...e, auto_reply: enabled } : e)));

        const { data, status } = await kbSetAutoReplyApi(ids, enabled);
        setSavingIds((prev) => prev.filter((id) => !ids.includes(id)));

        if (status !== 200) {
            setEntries(before);
            AlertDiaLog({ icon: 'error', title: data?.message || 'บันทึกไม่สำเร็จ', text: data?.detail || '' });
            return false;
        }
        onChanged?.();
        if (data?.skipped?.length) {
            AlertDiaLog({
                icon: 'warning',
                title: data.message,
                text: `ข้าม ${data.skipped.length} รายการ เพราะไม่ได้อยู่ในสถานะอนุมัติแล้ว/เปิดใช้งาน`,
            });
            fetchList(meta.current_page);
        }
        return true;
    };

    const toggleOne = (item) => {
        const enabled = !item.auto_reply;
        if (!enabled) { saveAutoReply([item.id], false); return; }
        AlertDiaLog({
            icon: 'question',
            title: 'เปิดให้ AI ตอบอัตโนมัติ?',
            text: 'เมื่อลูกค้าถามคำถามที่ตรงกับรายการนี้ ระบบจะส่งคำตอบนี้ให้ลูกค้าทันทีโดยไม่ผ่านพนักงาน',
            onPassed: (confirm) => { if (confirm) saveAutoReply([item.id], true); },
        });
    };

    const bulkSet = (enabled) => {
        if (selected.length === 0) return;
        AlertDiaLog({
            icon: 'question',
            title: `${enabled ? 'เปิด' : 'ปิด'}ตอบอัตโนมัติ ${selected.length} รายการ?`,
            text: enabled
                ? 'ระบบจะส่งคำตอบของรายการที่เลือกให้ลูกค้าทันทีเมื่อคำถามตรงกัน โดยไม่ผ่านพนักงาน'
                : 'รายการที่เลือกจะกลับไปเป็นคำแนะนำให้พนักงานเท่านั้น',
            onPassed: async (confirm) => {
                if (!confirm) return;
                const ok = await saveAutoReply(selected, enabled);
                if (ok) setSelected([]);
            },
        });
    };

    const pageIds     = entries.map((e) => e.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
    const someSelected = selected.length > 0 && !allSelected;

    return (
        <>
            <Alert color="neutral" variant="soft" size="sm" startDecorator={<InfoOutlined />} sx={{ mb: 1.5 }}>
                แสดงเฉพาะคำถาม/คำตอบที่อนุมัติแล้วและเปิดใช้งานอยู่ — เปิดสวิตช์ "ตอบอัตโนมัติ" ให้รายการที่มั่นใจว่าตอบลูกค้าได้เลย
                (ทำงานตามโหมดของระบบด้านบน · ถ้ารายการถูกรีเซ็ต/ปรับแก้/ปิดใช้งาน ระบบจะปิดตอบอัตโนมัติให้เอง ·
                ถ้ามีหลายรายการที่คำถามคล้ายกัน ควรเปิดแค่รายการเดียว ไม่งั้นระบบจะถือว่าไม่แน่ใจและไม่ส่ง)
            </Alert>

            {/* Filter bar */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={1} flexWrap="wrap" useFlexGap alignItems={{ sm: 'center' }}>
                <Select size="sm" value={autoFilter} onChange={(_, v) => setAutoFilter(v)} sx={{ minWidth: 190 }}
                    startDecorator={<AutoMode sx={{ fontSize: 16 }} />}>
                    <Option value="all">ตอบอัตโนมัติ: ทั้งหมด</Option>
                    <Option value="on">เปิดตอบอัตโนมัติ</Option>
                    <Option value="off">ยังไม่เปิด</Option>
                </Select>
                <Select size="sm" value={tagFilter} onChange={(_, v) => setTagFilter(v)} sx={{ minWidth: 150 }}
                    startDecorator={<LocalOffer sx={{ fontSize: 14 }} />}>
                    <Option value="all">Tag: ทั้งหมด</Option>
                    {tags.map((t) => <Option key={t} value={t}>{t}</Option>)}
                </Select>
                <Input size="sm" startDecorator={<Search />}
                    placeholder="ค้นหาคำถาม / คำตอบ / คำที่ใช้แทนกัน / แท็ก..."
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    sx={{ flexGrow: 1, maxWidth: 360 }}
                />
                {selected.length > 0 && (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: { sm: 'auto' } }}>
                        <Typography level="body-sm">เลือก {selected.length} รายการ</Typography>
                        <Button size="sm" color="success" onClick={() => bulkSet(true)}>เปิดตอบอัตโนมัติ</Button>
                        <Button size="sm" color="neutral" variant="outlined" onClick={() => bulkSet(false)}>ปิด</Button>
                    </Stack>
                )}
            </Stack>

            <Sheet variant="outlined" sx={{ ...ChatPageStyle.BoxSheet, overflowX: 'auto' }}>
                <Table stickyHeader hoverRow sx={{ ...ChatPageStyle.Table, tableLayout: 'fixed', minWidth: 900 }}>
                    <colgroup>
                        <col style={{ width: 44 }} />
                        <col />
                        <col />
                        <col style={{ width: 120 }} />
                        <col style={{ width: 150 }} />
                        <col style={{ width: 130 }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>
                                <Checkbox size="sm" checked={allSelected} indeterminate={someSelected}
                                    disabled={loading || entries.length === 0}
                                    onChange={(e) => setSelected(e.target.checked ? pageIds : [])}
                                    slotProps={{ input: { 'aria-label': 'เลือกทั้งหน้า' } }}
                                />
                            </th>
                            <th>คำถาม</th>
                            <th>คำตอบที่จะส่ง</th>
                            <th>แท็ก</th>
                            <th>อนุมัติโดย</th>
                            <th style={{ textAlign: 'center' }}>ตอบอัตโนมัติ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center' }}><CircularProgress /></td></tr>
                        ) : entries.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center' }}>
                                    <Typography level="body-sm" color="neutral">ไม่มีรายการที่อนุมัติแล้ว</Typography>
                                </td>
                            </tr>
                        ) : entries.map((item) => {
                            // คำตอบที่ใช้จริง: ถ้าแอดมินแก้ไขตอนอนุมัติ ใช้ admin_answer แทน answer
                            const answer = item.admin_answer || item.answer;
                            const attachments = Array.isArray(item.answer_attachments) ? item.answer_attachments.length : 0;
                            const saving = savingIds.includes(item.id);
                            return (
                                <tr key={item.id} style={item.auto_reply ? { background: 'var(--joy-palette-success-softBg)' } : undefined}>
                                    <td>
                                        <Checkbox size="sm" checked={selected.includes(item.id)}
                                            onChange={(e) => setSelected((prev) => e.target.checked
                                                ? [...prev, item.id]
                                                : prev.filter((id) => id !== item.id))}
                                            slotProps={{ input: { 'aria-label': `เลือกรายการ ${item.id}` } }}
                                        />
                                    </td>
                                    <td>
                                        <Typography level="body-sm" sx={clampSx(3)} title={item.question}>{item.question}</Typography>
                                        {item.alt && (
                                            <Typography level="body-xs" color="neutral" sx={{ ...clampSx(1), mt: 0.25 }} title={item.alt}>
                                                คำที่ใช้แทนกัน: {item.alt}
                                            </Typography>
                                        )}
                                    </td>
                                    <td>
                                        <Typography level="body-xs" sx={clampSx(3)} title={answer}>{answer}</Typography>
                                        <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap" useFlexGap alignItems="center">
                                            <Button size="sm" variant="outlined" color="neutral" startDecorator={<Visibility sx={{ fontSize: 16 }} />}
                                                onClick={() => setViewing(item)} sx={{ minHeight: 24, py: 0, px: 1, fontSize: 12 }}>
                                                ดู
                                            </Button>
                                            {item.admin_answer && <Chip size="sm" variant="soft" color="primary">แอดมินแก้ไขคำตอบ</Chip>}
                                            {attachments > 0 && (
                                                <Chip size="sm" variant="soft" color="neutral" startDecorator={<Attachment sx={{ fontSize: 14 }} />}>
                                                    แนบไฟล์ {attachments}
                                                </Chip>
                                            )}
                                        </Stack>
                                    </td>
                                    <td>
                                        {item.tag_name
                                            ? <Chip size="sm" color="neutral" sx={{ maxWidth: '100%' }}>{item.tag_name}</Chip>
                                            : <Typography level="body-xs" color="neutral">-</Typography>}
                                    </td>
                                    <td>
                                        <Typography level="body-xs" noWrap>{item.approved_by_name ?? '-'}</Typography>
                                        <Typography level="body-xs" color="neutral">{item.approved_at ? convertFullDate(item.approved_at) : ''}</Typography>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <Tooltip
                                            arrow size="sm"
                                            title={item.auto_reply_by_name
                                                ? `ตั้งค่าล่าสุดโดย ${item.auto_reply_by_name} · ${convertFullDate(item.auto_reply_at)}`
                                                : 'ยังไม่เคยเปิดตอบอัตโนมัติ'}
                                        >
                                            <Stack alignItems="center" spacing={0.25}>
                                                <Switch
                                                    color={item.auto_reply ? 'success' : 'neutral'}
                                                    checked={!!item.auto_reply}
                                                    disabled={saving}
                                                    onChange={() => toggleOne(item)}
                                                    slotProps={{ input: { 'aria-label': 'ตอบอัตโนมัติ' } }}
                                                />
                                                <Typography level="body-xs" color={item.auto_reply ? 'success' : 'neutral'}>
                                                    {item.auto_reply ? 'AI ตอบเอง' : 'ให้พนักงานตอบ'}
                                                </Typography>
                                            </Stack>
                                        </Tooltip>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </Sheet>

            {!loading && meta.total > PAGE_SIZE && (
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" mt={1.5}>
                    <IconButton size="sm" variant="outlined" color="neutral"
                        disabled={meta.current_page <= 1} onClick={() => fetchList(meta.current_page - 1)}>
                        <ChevronLeft />
                    </IconButton>
                    <Typography level="body-sm">
                        หน้า {meta.current_page} / {meta.last_page}
                        <Typography level="body-xs" color="neutral" sx={{ ml: 1 }}>({meta.total} รายการ)</Typography>
                    </Typography>
                    <IconButton size="sm" variant="outlined" color="neutral"
                        disabled={meta.current_page >= meta.last_page} onClick={() => fetchList(meta.current_page + 1)}>
                        <ChevronRight />
                    </IconButton>
                </Stack>
            )}
            <Box sx={{ height: 8 }} />

            {viewing && (
                <AnswerPreviewModal
                    item={viewing}
                    onClose={() => setViewing(null)}
                    onToggle={() => {
                        const target = entries.find((e) => e.id === viewing.id) ?? viewing;
                        setViewing(null);
                        toggleOne(target);
                    }}
                />
            )}
        </>
    );
}

/**
 * แท็บ "จัดการข้อความส่งอัตโนมัติ": การ์ดตั้งค่าระบบ + รายการที่อนุมัติแล้ว (เปิด/ปิดทีละรายการ) + บันทึกการตัดสินใจ
 */
export default function AutoReplyTab({ tags = [], onChanged }) {
    const navigate = useNavigate();
    const [sub, setSub] = useState('entries');

    return (
        <>
            <AutoReplySettings />
            <Tabs value={sub} onChange={(_, v) => setSub(v)} sx={{ bgcolor: 'transparent' }}>
                <TabList size="sm" variant="plain" sx={{ mb: 1 }}>
                    <Tab value="entries">รายการคำถาม/คำตอบ</Tab>
                    <Tab value="logs">บันทึกการตัดสินใจ</Tab>
                </TabList>
                <TabPanel value="entries" sx={{ p: 0 }}>
                    <AutoReplyEntries tags={tags} onChanged={onChanged} />
                </TabPanel>
                <TabPanel value="logs" sx={{ p: 0 }}>
                    {sub === 'logs' && <AutoReplyLogs onOpenChat={(custId) => navigate(`/chatHistory/detail/${custId}`)} />}
                </TabPanel>
            </Tabs>
        </>
    );
}

// แสดงคำถาม/คำตอบเต็มพร้อมไฟล์แนบ — หน้าตาคล้ายฟองแชทที่ลูกค้าจะได้รับจริง
function AnswerPreviewModal({ item, onClose, onToggle }) {
    const navigate = useNavigate();
    const answer = item.admin_answer || item.answer;
    const attachments = Array.isArray(item.answer_attachments) ? item.answer_attachments : [];

    return (
        <Modal open onClose={onClose}>
            <ModalDialog sx={{ width: { xs: '100%', sm: 640 }, maxWidth: '100%', maxHeight: '90dvh', overflowY: 'auto' }}>
                <ModalClose />
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ pr: 4 }}>
                    <Typography level="title-lg">คำตอบที่จะส่ง</Typography>
                    <Chip size="sm" variant="soft" color={item.auto_reply ? 'success' : 'neutral'}>
                        {item.auto_reply ? 'AI ตอบเอง' : 'ให้พนักงานตอบ'}
                    </Chip>
                    {item.tag_name && <Chip size="sm" color="neutral">{item.tag_name}</Chip>}
                </Stack>

                <Typography level="body-xs" color="neutral" sx={{ mt: 1.5 }}>คำถาม</Typography>
                <Sheet variant="soft" sx={{ p: 1.5, borderRadius: 'md' }}>
                    <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{item.question}</Typography>
                    {item.alt && (
                        <Typography level="body-xs" color="neutral" sx={{ mt: 0.75, wordBreak: 'break-word' }}>
                            คำที่ใช้แทนกัน: {item.alt}
                        </Typography>
                    )}
                </Sheet>

                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                    <Typography level="body-xs" color="neutral">คำตอบที่ลูกค้าจะได้รับ</Typography>
                    {item.admin_answer && <Chip size="sm" variant="soft" color="primary">แอดมินแก้ไขคำตอบ</Chip>}
                </Stack>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    <Sheet variant="solid" color="primary" sx={{ p: 1.5, borderRadius: 'lg', borderTopRightRadius: 4, maxWidth: '90%' }}>
                        <Typography level="body-sm" sx={{ color: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            {answer}
                        </Typography>
                    </Sheet>
                    {attachments.map((a, i) => {
                        const url = forceHttps(a.url);
                        if (a.contentType === 'image') {
                            return (
                                <Box key={i} component="a" href={url} target="_blank" rel="noopener noreferrer">
                                    <Box component="img" src={url} alt={`ไฟล์แนบ ${i + 1}`} loading="lazy"
                                        sx={{ display: 'block', maxWidth: 260, maxHeight: 260, borderRadius: 'lg', objectFit: 'cover' }} />
                                </Box>
                            );
                        }
                        if (a.contentType === 'video') {
                            return <Box key={i} component="video" src={url} controls preload="metadata" sx={{ maxWidth: 320, width: '100%', borderRadius: 'lg' }} />;
                        }
                        return (
                            <Button key={i} component="a" href={url} target="_blank" rel="noopener noreferrer"
                                size="sm" variant="outlined" color="neutral" startDecorator={<InsertDriveFile />}>
                                เปิดไฟล์แนบ {i + 1}
                            </Button>
                        );
                    })}
                </Box>

                {(item.note || item.admin_note) && (
                    <>
                        <Typography level="body-xs" color="neutral" sx={{ mt: 1.5 }}>หมายเหตุ</Typography>
                        <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {item.admin_note || item.note}
                        </Typography>
                    </>
                )}

                <Divider sx={{ my: 1.5 }} />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                    <Typography level="body-xs" color="neutral">
                        อนุมัติโดย {item.approved_by_name ?? '-'}{item.approved_at ? ` · ${convertFullDate(item.approved_at)}` : ''}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Button size="sm" variant="outlined" color="neutral" startDecorator={<OpenInNew />}
                            onClick={() => navigate(`/knowledge-base/review/${item.id}`)}>
                            เปิดหน้าตรวจสอบ
                        </Button>
                        <Button size="sm" color={item.auto_reply ? 'neutral' : 'success'} variant={item.auto_reply ? 'outlined' : 'solid'}
                            onClick={onToggle}>
                            {item.auto_reply ? 'ปิดตอบอัตโนมัติ' : 'เปิดตอบอัตโนมัติ'}
                        </Button>
                    </Stack>
                </Stack>
            </ModalDialog>
        </Modal>
    );
}
