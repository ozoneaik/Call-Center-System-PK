import { useEffect, useMemo, useState } from "react";
import {
    Box, Sheet, Table, Typography, CircularProgress, Chip,
    Button, Select, Option, Stack, Input, IconButton,
} from "@mui/joy";
import { Search, Visibility, ChevronLeft, ChevronRight, SmartToy, HourglassEmpty } from "@mui/icons-material";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import { convertFullDate } from "../../Components/Options.jsx";
import { kbListApi, kbStatsApi } from "../../Api/KnowledgeBase.js";
import ReviewModal from "./ReviewModal.jsx";

const BreadcrumbsPath = [{ name: 'Knowledge Base' }, { name: 'จัดการ' }];
const statusColor   = { pending: 'warning', approved: 'success', rejected: 'danger' };
const statusLabel   = { pending: 'รอตรวจสอบ', approved: 'อนุมัติแล้ว', rejected: 'ปรับแก้แล้ว' };
const platformLabel = { line: 'LINE', facebook: 'Facebook', tiktok: 'TikTok' };
const PAGE_SIZE     = 20;

function AiCell({ topic, answer }) {
    if (!topic) {
        return (
            <Chip
                size="sm"
                variant="soft"
                color="neutral"
                startDecorator={<HourglassEmpty sx={{ fontSize: 12 }} />}
                sx={{ fontStyle: 'italic' }}
            >
                รอ AI วิเคราะห์
            </Chip>
        );
    }
    const shortAnswer = answer
        ? (answer.length > 70 ? answer.slice(0, 70) + '…' : answer)
        : null;
    return (
        <Box>
            <Stack direction="row" spacing={0.5} alignItems="flex-start" mb={0.3}>
                <SmartToy sx={{ fontSize: 13, color: 'primary.400', mt: '2px', flexShrink: 0 }} />
                <Typography level="body-sm" fontWeight="md" sx={{
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                    {topic}
                </Typography>
            </Stack>
            {shortAnswer && (
                <Typography level="body-xs" color="neutral" sx={{
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    pl: '17px',
                }}>
                    {shortAnswer}
                </Typography>
            )}
        </Box>
    );
}

function firstCustomerMsg(chatData) {
    if (!Array.isArray(chatData)) return '-';
    const msg = chatData.find(m => m.role === 'customer' && m.content);
    if (!msg) return '-';
    const text = (msg.contentType === 'text' || !msg.contentType) ? msg.content : `[${msg.contentType}]`;
    return text.length > 80 ? text.slice(0, 80) + '…' : text;
}

function firstCustomerName(chatData) {
    if (!Array.isArray(chatData)) return '-';
    const msg = chatData.find(m => m.role === 'customer');
    return msg?.sender_name || '-';
}

export default function KnowledgeBasePage() {
    const [entries,      setEntries]      = useState([]);
    const [filtered,     setFiltered]     = useState([]);
    const [stats,        setStats]        = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
    const [loading,      setLoading]      = useState(false);
    const [statusFilter, setStatus]       = useState('all');
    const [aiFilter,     setAiFilter]     = useState('all');
    const [search,       setSearch]       = useState('');
    const [page,         setPage]         = useState(1);
    const [selectedIdx,  setSelectedIdx]  = useState(null);
    const [modalOpen,    setModalOpen]    = useState(false);

    const fetchStats = async () => {
        const { data, status } = await kbStatsApi();
        if (status === 200) setStats(data);
    };

    const fetchList = async (status = 'all') => {
        setLoading(true);
        const { data, status: s } = await kbListApi(status === 'all' ? '' : status);
        if (s === 200) {
            setEntries(data.list);
            setFiltered(data.list);
        }
        setPage(1);
        setLoading(false);
    };

    useEffect(() => {
        fetchStats();
        fetchList(statusFilter);
    }, [statusFilter]);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(
            entries.filter(e => {
                if (aiFilter === 'analyzed' && !e.ai_topic) return false;
                if (aiFilter === 'pending'  &&  e.ai_topic) return false;
                if (!q) return true;
                return (
                    firstCustomerMsg(e.chat_data).toLowerCase().includes(q) ||
                    (e.ai_topic  ?? '').toLowerCase().includes(q) ||
                    (e.ai_answer ?? '').toLowerCase().includes(q) ||
                    (e.platform  ?? '').toLowerCase().includes(q) ||
                    (e.cust_id   ?? '').toLowerCase().includes(q)
                );
            })
        );
        setPage(1);
    }, [search, aiFilter, entries]);

    const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated   = useMemo(
        () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [filtered, page]
    );

    const openReview = (globalIdx) => {
        setSelectedIdx(globalIdx);
        setModalOpen(true);
    };

    const handleNavigate = (dir) => {
        setSelectedIdx(prev => {
            const next = prev + dir;
            if (next < 0 || next >= filtered.length) return prev;
            const nextPage = Math.floor(next / PAGE_SIZE) + 1;
            if (nextPage !== page) setPage(nextPage);
            return next;
        });
    };

    const handleRefresh = () => {
        fetchStats();
        fetchList(statusFilter);
        setModalOpen(false);
    };

    const selectedEntry = selectedIdx !== null ? filtered[selectedIdx] : null;

    return (
        <>
            <ReviewModal
                open={modalOpen}
                entry={selectedEntry}
                entries={filtered}
                currentIndex={selectedIdx ?? 0}
                onClose={() => setModalOpen(false)}
                onRefresh={handleRefresh}
                onNavigate={handleNavigate}
            />

            <Sheet sx={ChatPageStyle.Layout}>
                <Box component="main" sx={ChatPageStyle.MainContent}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <BreadcrumbsComponent list={BreadcrumbsPath} />
                    </Box>

                    <Box sx={ChatPageStyle.BoxTable}>
                        <Typography level="h2" component="h1">จัดการ Knowledge Base</Typography>
                    </Box>

                    {/* Stats bar */}
                    <Stack direction="row" spacing={1} mb={1.5} flexWrap="wrap">
                        <Chip color="neutral"  size="sm" variant="soft">ทั้งหมด {stats.total}</Chip>
                        <Chip color="warning"  size="sm" variant="soft">รอตรวจสอบ {stats.pending}</Chip>
                        <Chip color="success"  size="sm" variant="soft">อนุมัติแล้ว {stats.approved}</Chip>
                        <Chip color="danger"   size="sm" variant="soft">ปรับแก้แล้ว {stats.rejected}</Chip>
                    </Stack>

                    {/* Filter bar */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={1} flexWrap="wrap">
                        <Select size="sm" value={statusFilter}
                            onChange={(_, v) => { setStatus(v); setSearch(''); }}
                            sx={{ minWidth: 150 }}>
                            <Option value="all">สถานะ: ทั้งหมด</Option>
                            <Option value="pending">รอตรวจสอบ</Option>
                            <Option value="approved">อนุมัติแล้ว</Option>
                            <Option value="rejected">ปรับแก้แล้ว</Option>
                        </Select>
                        <Select size="sm" value={aiFilter}
                            onChange={(_, v) => { setAiFilter(v); setPage(1); }}
                            sx={{ minWidth: 160 }}
                            startDecorator={<SmartToy sx={{ fontSize: 14 }} />}>
                            <Option value="all">AI: ทั้งหมด</Option>
                            <Option value="analyzed">วิเคราะห์แล้ว</Option>
                            <Option value="pending">รอ AI วิเคราะห์</Option>
                        </Select>
                        <Input size="sm" startDecorator={<Search />}
                            placeholder="ค้นหาหัวข้อ AI / แพลตฟอร์ม / รหัสลูกค้า..."
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            sx={{ flexGrow: 1, maxWidth: 360 }}
                        />
                    </Stack>

                    <Sheet variant="outlined" sx={{ ...ChatPageStyle.BoxSheet, overflowX: 'auto' }}>
                        <Table stickyHeader hoverRow sx={{ ...ChatPageStyle.Table, tableLayout: 'fixed', minWidth: 860 }}>
                            <colgroup>
                                <col style={{ width: 40 }} />
                                <col style={{ width: 105 }} />
                                <col style={{ width: 80 }} />
                                <col style={{ width: 180 }} />
                                <col />
                                <col style={{ width: 120 }} />
                                <col style={{ width: 96 }} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>สถานะ</th>
                                    <th>แพลตฟอร์ม</th>
                                    <th>ลูกค้า</th>
                                    <th>
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                            <SmartToy sx={{ fontSize: 14 }} />
                                            <span>AI วิเคราะห์</span>
                                        </Stack>
                                    </th>
                                    <th>สร้างเมื่อ</th>
                                    <th>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!loading ? (
                                    paginated.length > 0 ? paginated.map((item, idx) => {
                                        const globalIdx = (page - 1) * PAGE_SIZE + idx;
                                        return (
                                            <tr key={item.id}>
                                                <td>
                                                    <Typography level="body-xs" color="neutral">
                                                        {(page - 1) * PAGE_SIZE + idx + 1}
                                                    </Typography>
                                                </td>
                                                <td>
                                                    <Chip size="sm" color={statusColor[item.admin_status]}>
                                                        {statusLabel[item.admin_status]}
                                                    </Chip>
                                                </td>
                                                <td>
                                                    {item.platform
                                                        ? <Chip size="sm" color="neutral">{platformLabel[item.platform] ?? item.platform}</Chip>
                                                        : <Typography level="body-xs" color="neutral">-</Typography>
                                                    }
                                                </td>
                                                <td>
                                                    <Typography level="body-sm" noWrap>
                                                        {firstCustomerName(item.chat_data)}
                                                    </Typography>
                                                    <Typography level="body-xs" color="neutral"
                                                        sx={{ fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {item.cust_id ?? '-'}
                                                    </Typography>
                                                </td>
                                                <td>
                                                    <AiCell topic={item.ai_topic} answer={item.ai_answer} />
                                                </td>
                                                <td>
                                                    <Typography level="body-xs" color="neutral">
                                                        {convertFullDate(item.created_at)}
                                                    </Typography>
                                                </td>
                                                <td>
                                                    <Button size="sm" variant="outlined"
                                                        startDecorator={<Visibility />}
                                                        onClick={() => openReview(globalIdx)}>
                                                        ตรวจสอบ
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign: 'center' }}>
                                                <Typography level="body-sm" color="neutral">ไม่มีข้อมูล</Typography>
                                            </td>
                                        </tr>
                                    )
                                ) : (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center' }}>
                                            <CircularProgress />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Sheet>

                    {/* Pagination */}
                    {!loading && filtered.length > PAGE_SIZE && (
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" mt={1.5}>
                            <IconButton size="sm" variant="outlined" color="neutral"
                                disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                                <ChevronLeft />
                            </IconButton>
                            <Typography level="body-sm">
                                หน้า {page} / {totalPages}
                                <Typography level="body-xs" color="neutral" sx={{ ml: 1 }}>
                                    ({filtered.length} รายการ)
                                </Typography>
                            </Typography>
                            <IconButton size="sm" variant="outlined" color="neutral"
                                disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                                <ChevronRight />
                            </IconButton>
                        </Stack>
                    )}
                </Box>
            </Sheet>
        </>
    );
}
