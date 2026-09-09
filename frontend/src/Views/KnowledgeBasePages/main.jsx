import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box, Sheet, Table, Typography, CircularProgress, Chip,
    Button, Select, Option, Stack, Input, IconButton,
} from "@mui/joy";
import { Search, Visibility, ChevronLeft, ChevronRight, LocalOffer } from "@mui/icons-material";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import { convertFullDate } from "../../Components/Options.jsx";
import { kbListApi, kbStatsApi, kbTagsApi } from "../../Api/KnowledgeBase.js";

const BreadcrumbsPath = [{ name: 'Knowledge Base' }, { name: 'จัดการ' }];
const sourceLabel = { kb: 'จาก KB', web: 'เว็บไซต์', ai: 'AI แนะนำ' };
const statusColor = { pending: 'warning', approved: 'success', rejected: 'danger' };
const statusLabel = { pending: 'รอตรวจสอบ', approved: 'อนุมัติแล้ว', rejected: 'ปรับแก้แล้ว' };
const PAGE_SIZE    = 20;
const emptyMeta    = { current_page: 1, per_page: PAGE_SIZE, total: 0, last_page: 1 };

function truncate(text, len) {
    if (!text) return '-';
    return text.length > len ? text.slice(0, len) + '…' : text;
}

export default function KnowledgeBasePage() {
    const navigate = useNavigate();
    const [entries,       setEntries]      = useState([]);
    const [meta,          setMeta]         = useState(emptyMeta);
    const [stats,         setStats]        = useState({ pending: 0, approved: 0, rejected: 0, inactive: 0, total: 0 });
    const [tags,          setTags]         = useState([]);
    const [loading,       setLoading]      = useState(false);
    const [statusFilter,  setStatus]       = useState('all');
    const [tagFilter,     setTagFilter]    = useState('all');
    const [showInactive,  setShowInactive] = useState(false);
    const [search,        setSearch]       = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const fetchStats = async () => {
        const { data, status } = await kbStatsApi();
        if (status === 200) setStats(data);
    };

    const fetchTags = async () => {
        const { data, status } = await kbTagsApi();
        if (status === 200) setTags(data);
    };

    // ดึงข้อมูลทีละหน้าจาก server (กรอง/ค้นหาที่ SQL ไม่ใช่ filter ฝั่ง client)
    const fetchList = async (pageNum = 1) => {
        setLoading(true);
        const { data, status: s } = await kbListApi({
            status: statusFilter, tagName: tagFilter, showInactive, search: debouncedSearch,
            page: pageNum, perPage: PAGE_SIZE,
        });
        let list = [];
        if (s === 200) {
            list = data.list;
            setEntries(list);
            setMeta(data.meta);
        }
        setLoading(false);
        return list;
    };

    useEffect(() => {
        fetchStats();
        fetchTags();
    }, []);

    // ตัวกรองเปลี่ยน -> กลับไปหน้า 1 เสมอ
    useEffect(() => {
        fetchList(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, tagFilter, showInactive, debouncedSearch]);

    // debounce ช่องค้นหา; ล้างค่าให้ทันทีเมื่อลบข้อความ
    useEffect(() => {
        if (search === '') { setDebouncedSearch(''); return; }
        const t = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(t);
    }, [search]);

    // เปิดหน้าจำลองแชท (read-only) ของลูกค้าคนนั้น พร้อมพื้นที่ตรวจสอบ/อนุมัติ KB ในไซด์บาร์
    const openEntry = (id) => navigate(`/knowledge-base/review/${id}`);

    return (
        <>
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
                        <Chip color="neutral"  size="sm" variant="outlined"
                            sx={{ cursor: 'pointer', opacity: showInactive ? 1 : 0.5 }}
                            onClick={() => { setShowInactive(v => !v); setSearch(''); }}>
                            ปิดใช้งานแล้ว {stats.inactive}
                        </Chip>
                    </Stack>

                    {/* Filter bar */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={1} flexWrap="wrap">
                        <Select size="sm" value={statusFilter}
                            onChange={(_, v) => { setStatus(v); setSearch(''); }}
                            sx={{ minWidth: 160 }}>
                            <Option value="all">สถานะ: ทั้งหมด</Option>
                            <Option value="pending">รอตรวจสอบ</Option>
                            <Option value="approved">อนุมัติแล้ว</Option>
                            <Option value="rejected">ปรับแก้แล้ว</Option>
                        </Select>
                        <Select size="sm" value={tagFilter}
                            onChange={(_, v) => setTagFilter(v)}
                            sx={{ minWidth: 150 }}
                            startDecorator={<LocalOffer sx={{ fontSize: 14 }} />}>
                            <Option value="all">Tag: ทั้งหมด</Option>
                            {tags.map(t => <Option key={t} value={t}>{t}</Option>)}
                        </Select>
                        <Input size="sm" startDecorator={<Search />}
                            placeholder="ค้นหาคำถาม / คำตอบ / แท็ก / รหัสลูกค้า..."
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            sx={{ flexGrow: 1, maxWidth: 360 }}
                        />
                    </Stack>

                    <Sheet variant="outlined" sx={{ ...ChatPageStyle.BoxSheet, overflowX: 'auto' }}>
                        <Table stickyHeader hoverRow sx={{ ...ChatPageStyle.Table, tableLayout: 'fixed', minWidth: 860 }}>
                            <colgroup>
                                <col style={{ width: 40 }} />
                                <col style={{ width: 105 }} />
                                <col />
                                <col />
                                <col style={{ width: 100 }} />
                                <col style={{ width: 120 }} />
                                <col style={{ width: 110 }} />
                                <col style={{ width: 96 }} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>สถานะ</th>
                                    <th>คำถาม</th>
                                    <th>คำตอบ</th>
                                    <th>แท็ก</th>
                                    <th>เพิ่มเมื่อ</th>
                                    <th>เพิ่มโดย</th>
                                    <th>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!loading ? (
                                    entries.length > 0 ? entries.map((item, idx) => {
                                        const globalIdx = (meta.current_page - 1) * PAGE_SIZE + idx;
                                        return (
                                            <tr key={item.id}>
                                                <td>
                                                    <Typography level="body-xs" color="neutral">
                                                        {globalIdx + 1}
                                                    </Typography>
                                                </td>
                                                <td>
                                                    <Chip size="sm" color={statusColor[item.admin_status]}>
                                                        {statusLabel[item.admin_status] ?? item.admin_status}
                                                    </Chip>
                                                </td>
                                                <td>
                                                    <Typography level="body-sm" sx={{
                                                        overflow: 'hidden', textOverflow: 'ellipsis',
                                                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                                    }}>
                                                        {item.question}
                                                    </Typography>
                                                </td>
                                                <td>
                                                    <Typography level="body-xs" color="neutral" sx={{
                                                        overflow: 'hidden', textOverflow: 'ellipsis',
                                                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                                    }}>
                                                        {truncate(item.answer, 100)}
                                                    </Typography>
                                                </td>
                                                <td>
                                                    {item.tag_name
                                                        ? <Chip size="sm" color="neutral">{item.tag_name}</Chip>
                                                        : <Typography level="body-xs" color="neutral">-</Typography>
                                                    }
                                                </td>
                                                <td>
                                                    <Typography level="body-xs" color="neutral">
                                                        {convertFullDate(item.created_at)}
                                                    </Typography>
                                                    <Typography level="body-xs" color="neutral">
                                                        {sourceLabel[item.source] ?? item.source ?? '-'}
                                                    </Typography>
                                                </td>
                                                <td>
                                                    <Typography level="body-xs" color="neutral" noWrap>
                                                        {item.created_by_name ?? '-'}
                                                    </Typography>
                                                </td>
                                                <td>
                                                    <Button size="sm" variant="outlined"
                                                        startDecorator={<Visibility />}
                                                        onClick={() => openEntry(item.id)}>
                                                        ตรวจสอบ
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={8} style={{ textAlign: 'center' }}>
                                                <Typography level="body-sm" color="neutral">ไม่มีข้อมูล</Typography>
                                            </td>
                                        </tr>
                                    )
                                ) : (
                                    <tr>
                                        <td colSpan={8} style={{ textAlign: 'center' }}>
                                            <CircularProgress />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Sheet>

                    {/* Pagination */}
                    {!loading && meta.total > PAGE_SIZE && (
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" mt={1.5}>
                            <IconButton size="sm" variant="outlined" color="neutral"
                                disabled={meta.current_page <= 1} onClick={() => fetchList(meta.current_page - 1)}>
                                <ChevronLeft />
                            </IconButton>
                            <Typography level="body-sm">
                                หน้า {meta.current_page} / {meta.last_page}
                                <Typography level="body-xs" color="neutral" sx={{ ml: 1 }}>
                                    ({meta.total} รายการ)
                                </Typography>
                            </Typography>
                            <IconButton size="sm" variant="outlined" color="neutral"
                                disabled={meta.current_page >= meta.last_page} onClick={() => fetchList(meta.current_page + 1)}>
                                <ChevronRight />
                            </IconButton>
                        </Stack>
                    )}
                </Box>
            </Sheet>
        </>
    );
}
