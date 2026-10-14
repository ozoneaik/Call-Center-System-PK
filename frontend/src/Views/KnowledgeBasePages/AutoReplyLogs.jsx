import { useEffect, useState } from "react";
import { Sheet, Table, Typography, CircularProgress, Chip, Select, Option, Stack, IconButton, Tooltip, Button } from "@mui/joy";
import { ChevronLeft, ChevronRight, Refresh } from "@mui/icons-material";
import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import { convertFullDate } from "../../Components/Options.jsx";
import { kbAutoReplyLogsApi } from "../../Api/KnowledgeBase.js";

const PAGE_SIZE = 20;

// ผลการตัดสินใจของระบบ (ตรงกับ KbAutoReplyLog::decision)
export const DECISIONS = {
    sent:            { label: 'ส่งแล้ว',              color: 'success' },
    would_send:      { label: 'จะส่ง (ทดลอง)',        color: 'warning' },
    send_failed:     { label: 'ส่งไม่สำเร็จ',          color: 'danger' },
    below_threshold: { label: 'คะแนนไม่ถึงเกณฑ์',     color: 'neutral' },
    ambiguous:       { label: 'ไม่แน่ใจ (คะแนนใกล้กัน)', color: 'neutral' },
    no_candidate:    { label: 'ไม่พบรายการ',          color: 'neutral' },
    skipped:         { label: 'ข้าม',                  color: 'neutral' },
    error:           { label: 'ผิดพลาด',               color: 'danger' },
};

const score = (v) => (v === null || v === undefined ? '-' : Number(v).toFixed(3));

/**
 * บันทึกการตัดสินใจของระบบ AI ตอบอัตโนมัติ — ใช้ตรวจย้อนหลังและปรับเกณฑ์คะแนนระหว่างโหมดทดลอง
 */
export default function AutoReplyLogs({ onOpenChat }) {
    const [list,     setList]     = useState([]);
    const [meta,     setMeta]     = useState({ current_page: 1, last_page: 1, total: 0 });
    const [summary,  setSummary]  = useState({});
    const [decision, setDecision] = useState('all');
    const [loading,  setLoading]  = useState(false);

    const fetchLogs = async (page = 1) => {
        setLoading(true);
        const { data, status } = await kbAutoReplyLogsApi({ decision, page, perPage: PAGE_SIZE });
        if (status === 200) {
            setList(data.list);
            setMeta(data.meta);
            setSummary(data.summary_7d ?? {});
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [decision]);

    return (
        <>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={1} alignItems={{ sm: 'center' }} flexWrap="wrap" useFlexGap>
                <Select size="sm" value={decision} onChange={(_, v) => setDecision(v)} sx={{ minWidth: 200 }}>
                    <Option value="all">ผลการตัดสินใจ: ทั้งหมด</Option>
                    {Object.entries(DECISIONS).map(([k, d]) => <Option key={k} value={k}>{d.label}</Option>)}
                </Select>
                <Button size="sm" variant="plain" color="neutral" startDecorator={<Refresh />} onClick={() => fetchLogs(meta.current_page)}>
                    รีเฟรช
                </Button>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ ml: { sm: 'auto' } }}>
                    <Typography level="body-xs" color="neutral" sx={{ alignSelf: 'center' }}>7 วันล่าสุด:</Typography>
                    {Object.entries(summary).length === 0
                        ? <Typography level="body-xs" color="neutral" sx={{ alignSelf: 'center' }}>ยังไม่มีข้อมูล</Typography>
                        : Object.entries(summary).map(([k, c]) => (
                            <Chip key={k} size="sm" variant="soft" color={DECISIONS[k]?.color ?? 'neutral'}>
                                {DECISIONS[k]?.label ?? k} {c}
                            </Chip>
                        ))}
                </Stack>
            </Stack>

            <Sheet variant="outlined" sx={{ ...ChatPageStyle.BoxSheet, overflowX: 'auto' }}>
                <Table stickyHeader hoverRow sx={{ ...ChatPageStyle.Table, tableLayout: 'fixed', minWidth: 1000 }}>
                    <colgroup>
                        <col style={{ width: 120 }} />
                        <col />
                        <col />
                        <col />
                        <col style={{ width: 110 }} />
                        <col style={{ width: 150 }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>เวลา</th>
                            <th>ข้อความลูกค้า</th>
                            <th>AI สรุปคำถาม</th>
                            <th>รายการ KB ที่ใกล้ที่สุด</th>
                            <th>คะแนน</th>
                            <th>ผล</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center' }}><CircularProgress /></td></tr>
                        ) : list.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center' }}>
                                <Typography level="body-sm" color="neutral">ยังไม่มีบันทึก — เปิดโหมด "ทดลอง" แล้วรอลูกค้าทักเข้ามา</Typography>
                            </td></tr>
                        ) : list.map((r) => {
                            const d = DECISIONS[r.decision] ?? { label: r.decision, color: 'neutral' };
                            return (
                                <tr key={r.id}>
                                    <td>
                                        <Typography level="body-xs">{convertFullDate(r.created_at)}</Typography>
                                        <Typography level="body-xs" color="neutral">{r.platform ?? '-'} · {r.room_id ?? '-'}</Typography>
                                    </td>
                                    <td>
                                        <Typography level="body-sm" sx={clamp(3)} title={r.customer_message}>{r.customer_message}</Typography>
                                        {r.cust_id && onOpenChat && (
                                            <Typography level="body-xs" sx={{ cursor: 'pointer', color: 'primary.500' }} onClick={() => onOpenChat(r.cust_id)}>
                                                ดูแชท
                                            </Typography>
                                        )}
                                    </td>
                                    <td>
                                        <Typography level="body-xs" sx={clamp(3)} title={r.ai_summary}>{r.ai_summary ?? '-'}</Typography>
                                        {r.ai_query && <Typography level="body-xs" color="neutral" sx={clamp(1)}>ค้น: {r.ai_query}</Typography>}
                                    </td>
                                    <td>
                                        {r.matched_entry_id ? (
                                            <Typography level="body-xs" sx={clamp(3)} title={r.matched_question}>
                                                #{r.matched_entry_id} {r.matched_question}
                                            </Typography>
                                        ) : <Typography level="body-xs" color="neutral">-</Typography>}
                                    </td>
                                    <td>
                                        <Tooltip arrow size="sm" title={`อันดับ 2: ${r.second_entry_id ? `#${r.second_entry_id} ` : ''}${score(r.second_score)} · จับคู่จาก ${r.matched_by ?? '-'}`}>
                                            <Typography level="body-sm" fontWeight="lg">{score(r.matched_score)}</Typography>
                                        </Tooltip>
                                        <Typography level="body-xs" color="neutral">2nd {score(r.second_score)}</Typography>
                                    </td>
                                    <td>
                                        <Chip size="sm" variant="soft" color={d.color}>{d.label}</Chip>
                                        {r.reason && (
                                            <Typography level="body-xs" color="neutral" sx={{ ...clamp(2), mt: 0.25 }} title={r.reason}>{r.reason}</Typography>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </Sheet>

            {!loading && meta.last_page > 1 && (
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" mt={1.5}>
                    <IconButton size="sm" variant="outlined" color="neutral" disabled={meta.current_page <= 1} onClick={() => fetchLogs(meta.current_page - 1)}>
                        <ChevronLeft />
                    </IconButton>
                    <Typography level="body-sm">หน้า {meta.current_page} / {meta.last_page} ({meta.total} รายการ)</Typography>
                    <IconButton size="sm" variant="outlined" color="neutral" disabled={meta.current_page >= meta.last_page} onClick={() => fetchLogs(meta.current_page + 1)}>
                        <ChevronRight />
                    </IconButton>
                </Stack>
            )}
        </>
    );
}

function clamp(lines) {
    return {
        overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
        WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', wordBreak: 'break-word',
    };
}
