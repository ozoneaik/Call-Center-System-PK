import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { Chip, CircularProgress, Stack, Table, useTheme } from "@mui/joy";
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useMemo, useState } from "react";
import { chatHistoryApi } from "../../Api/Messages.js";
import { convertFullDate } from "../../Components/Options.jsx";
import Button from "@mui/joy/Button";
import Avatar from "@mui/joy/Avatar";
import HistoryIcon from "@mui/icons-material/History";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import Divider from "@mui/joy/Divider";
import Grid from "@mui/joy/Grid";
import { useNavigate, useSearchParams } from "react-router-dom";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import { FilterChatHistory } from "./FilterChatHistory.jsx";
import axiosClient from "../../Axios.js";

const BreadcrumbsPath = [{ name: 'ประวัติการสนทนาทั้งหมด' }];

// นิยามคอลัมภ์ที่กดหัวตารางเพื่อ sort ได้ พร้อมฟังก์ชันดึงค่าที่จะใช้เทียบตอน sort
const SORTABLE_COLUMNS = [
    { key: 'custName', label: 'ชื่อลูกค้า', getValue: (item) => item.custName || '' },
    { key: 'description', label: 'คำอธิบาย', getValue: (item) => item.description || '' },
    { key: 'matched_note', label: 'หมายเหตุที่ค้นพบ', getValue: (item) => item.matched_note || '' },
    { key: 'created_at', label: 'ทักครั้งแรกเมื่อ', getValue: (item) => item.created_at || '' },
    { key: 'updated_at', label: 'อัปเดตล่าสุดเมื่อ', getValue: (item) => item.updated_at || '' },
    { key: 'latest_staff_name', label: 'พนักงานที่คุยล่าสุด', getValue: (item) => item.latest_staff_name || '' },
    { key: 'is_closed', label: 'สถานะเคส', getValue: (item) => (item.is_closed ? 1 : 0) },
    { key: 'tag_name', label: 'Tag ที่ปิดงาน', getValue: (item) => item.tag_name || '' },
];

export default function ChatHistory() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [list, setList] = useState([]);
    const [to, setTo] = useState(0);
    const [total, setTotal] = useState(0);
    const [searchParams] = useSearchParams();
    const page_url = searchParams.get('page') ?? 1;
    const [links, setLinks] = useState([]);
    const [platforms, setPlatform] = useState([]);
    const [orderBy, setOrderBy] = useState(null);
    const [order, setOrder] = useState('asc');

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data, status } = await chatHistoryApi({ page: page_url });
            console.log(data, status);
            if (status === 200) {
                setList(data.list.data);
                setTo(data.list.to);
                setTotal(data.list.total);
                setLinks(data.list.links);
                setPlatform(data.platforms);
            }
        } catch (error) {
            console.error("Error fetching chat history:", error);
        }
    };

    useEffect(() => {
        fetchData().finally(() => setLoading(false));
    }, [page_url]);

    // กดหัวคอลัมภ์เพื่อ sort: กดคอลัมภ์เดิมซ้ำ = สลับ asc/desc, กดคอลัมภ์ใหม่ = เริ่มที่ asc
    const handleSort = (key) => {
        if (orderBy === key) {
            setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setOrderBy(key);
            setOrder('asc');
        }
    };

    const renderSortIcon = (key) => {
        if (orderBy !== key) return <UnfoldMoreIcon sx={{ fontSize: 16, opacity: 0.4 }} />;
        return order === 'asc'
            ? <ArrowDropUpIcon sx={{ fontSize: 18 }} />
            : <ArrowDropDownIcon sx={{ fontSize: 18 }} />;
    };

    // sort เฉพาะฝั่ง client จากข้อมูลที่โหลดมาในหน้าปัจจุบัน (backend คืนมาเรียงตาม created_at desc เสมอ)
    const sortedList = useMemo(() => {
        if (!orderBy) return list;
        const column = SORTABLE_COLUMNS.find((c) => c.key === orderBy);
        if (!column) return list;

        const sorted = [...list].sort((a, b) => {
            const va = column.getValue(a);
            const vb = column.getValue(b);
            if (typeof va === 'number' && typeof vb === 'number') return va - vb;
            return String(va).localeCompare(String(vb), 'th');
        });

        return order === 'asc' ? sorted : sorted.reverse();
    }, [list, orderBy, order]);

    const renderCaseStatusChip = (item) => (
        <Chip size="sm" variant="soft" color={item.is_closed ? 'success' : 'warning'}>
            {item.is_closed ? 'ปิดงานแล้ว' : 'กำลังสนทนาอยู่'}
        </Chip>
    );

    const redirectChat = (select) => {
        // const params = `${select.rateRef}/${select.id}/${select.custId}`;
        // navigate(`/select/message/${params}/0`);

        navigate('/chatHistory/detail/' + select.custId);
    };

    const handleSearch = async (formData) => {
        console.log(formData);
        setLoading(true);
        try {
            const { data, status } = await axiosClient.get('/chatHistory', {
                params: formData,
            });
            console.log(data, status);
            if (status === 200) {
                setList(data.list.data);
                setTo(data.list.to);
                setTotal(data.list.total);
                setLinks(data.list.links);
                setPlatform(data.platforms);
            }
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false);
        }
    }

    return (
        <Sheet sx={{
            flex: 1,
            width: '100%',
            mx: 'auto',
            pt: { xs: 'var(--Header-height)', md: 2 },
            display: 'grid',
            gridTemplateColumns: {
                xs: '1fr',
            },
            backgroundColor: 'background.surface',
        }}>
            <Box component="main" sx={{
                px: { xs: 2, md: 4 },
                pb: { xs: 4, sm: 4, md: 5 },
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                height: '100dvh',
                gap: 2,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                </Box>

                <FilterChatHistory {...{ platforms }} onPassed={(formData) => handleSearch(formData)} />

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                        <CircularProgress size="lg" />
                    </Box>
                ) : isMobile ? (
                    // Mobile card view
                    <Box sx={{ mb: 2, height: '100dvh', overflowY: 'auto' }}>
                        {list.length > 0 ? (
                            <Grid container spacing={2}>
                                {list.map((item, index) => (
                                    <Grid xs={12} key={index}>
                                        <Card
                                            variant="outlined"
                                            sx={{
                                                boxShadow: 'sm',
                                                transition: 'transform 0.3s, box-shadow 0.3s',
                                                ':hover': {
                                                    boxShadow: 'md',
                                                    transform: 'translateY(-2px)'
                                                }
                                            }}
                                        >
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        {/* <Avatar size="sm" /> */}
                                                        <Avatar size="sm" src={item.avatar} />
                                                        <Typography level="title-md" fontWeight="bold">
                                                            {item.custName}
                                                        </Typography>
                                                    </Stack>
                                                    {renderCaseStatusChip(item)}
                                                </Box>

                                                <Typography level="body-sm" sx={{ mb: 1, color: 'text.tertiary' }}>
                                                    {item.description}
                                                </Typography>

                                                {item.tag_name && (
                                                    <Typography level="body-xs" sx={{ mb: 1, color: 'text.secondary' }}>
                                                        🏷️ Tag ปิดงาน: {item.tag_name}
                                                    </Typography>
                                                )}

                                                {item.matched_note && (
                                                    <Box sx={{
                                                        mb: 1,
                                                        p: 1,
                                                        bgcolor: 'warning.50',
                                                        borderRadius: 'sm',
                                                        borderLeft: '3px solid',
                                                        borderColor: 'warning.400'
                                                    }}>
                                                        <Typography level="body-xs" sx={{ color: 'warning.700', fontWeight: 'md' }}>
                                                            📌 พบคำในหมายเหตุ: {item.matched_note}
                                                        </Typography>
                                                    </Box>
                                                )}

                                                <Divider sx={{ my: 1 }} />

                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Box>
                                                        <Typography level="body-xs" color="neutral">
                                                            ทักครั้งแรกเมื่อ:
                                                        </Typography>
                                                        <Typography level="body-sm">
                                                            {convertFullDate(item.created_at)}
                                                        </Typography>
                                                    </Box>
                                                    <Button
                                                        size="sm"
                                                        variant="solid"
                                                        color="primary"
                                                        onClick={() => redirectChat(item)}
                                                        startDecorator={<HistoryIcon />}
                                                        sx={{ borderRadius: '20px' }}
                                                    >
                                                        ดูประวัติ
                                                    </Button>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography level="body-lg">ไม่พบข้อมูลการสนทนา</Typography>
                            </Box>
                        )}
                    </Box>
                ) : (
                    // Desktop table view
                    <Sheet
                        variant="outlined"
                        sx={{
                            borderRadius: 'md',
                            flexShrink: 1,
                            overflowX: 'auto',
                            minHeight: '300px',
                            maxHeight: 'calc(100vh - 240px)',
                            boxShadow: 'sm',
                            '--TableCell-headBackground': 'var(--joy-palette-primary-softBg)',
                        }}
                    >
                        <Table stickyHeader hoverRow sx={{ '& thead th': { fontWeight: 'bold' } }}>
                            <thead>
                                <tr>
                                    {SORTABLE_COLUMNS.map((column) => (
                                        <th
                                            key={column.key}
                                            onClick={() => handleSort(column.key)}
                                            style={{ cursor: 'pointer', userSelect: 'none' }}
                                        >
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <span>{column.label}</span>
                                                {renderSortIcon(column.key)}
                                            </Stack>
                                        </th>
                                    ))}
                                    <th style={{ width: '80px', textAlign: 'center' }}>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedList.length > 0 ? sortedList.map((item, index) => (
                                    <tr key={index}>
                                        <td>
                                            <Stack direction='row' spacing={1} alignItems='center'>
                                                {/* <Avatar size="sm" /> */}
                                                <Avatar size="sm" src={item.avatar} />
                                                <Typography fontWeight="md">
                                                    {item.custName}
                                                </Typography>
                                            </Stack>
                                        </td>
                                        <td>
                                            <Typography noWrap sx={{ maxWidth: '250px' }}>
                                                {item.description}
                                            </Typography>
                                        </td>
                                        <td>
                                            <Typography sx={{
                                                // ลบ noWrap และ maxWidth ออก เพื่อให้ข้อความตัดขึ้นบรรทัดใหม่ได้เต็มที่
                                                color: item.matched_note ? 'warning.700' : 'text.secondary',
                                                fontWeight: item.matched_note ? 'bold' : 'normal',
                                                whiteSpace: 'pre-line'
                                            }}>
                                                {item.matched_note || '-'}
                                            </Typography>
                                        </td>
                                        <td>{convertFullDate(item.created_at)}</td>
                                        <td>{convertFullDate(item.updated_at)}</td>
                                        {/* <td>{item.name || '-'}</td> */}
                                        <td>{item.latest_staff_name || '-'}</td>
                                        <td>{renderCaseStatusChip(item)}</td>
                                        <td>{item.tag_name || '-'}</td>
                                        <td>
                                            <Button
                                                size="sm"
                                                variant="soft"
                                                color="primary"
                                                onClick={() => redirectChat(item)}
                                                sx={{ borderRadius: '20px' }}
                                            >
                                                <HistoryIcon />
                                            </Button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={SORTABLE_COLUMNS.length + 1}>
                                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                                <Typography level="body-lg">ไม่พบข้อมูลการสนทนา</Typography>
                                            </Box>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Sheet>
                )}

                {/* Pagination */}
                <Stack direction={isMobile ? 'column-reverse' : 'row'} justifyContent={'space-between'} alignItems={'center'} spacing={2}>
                    <Typography>{to} รายการ จากรายการทั้งหมด {total} รายการ</Typography>
                    <Stack direction="row" spacing={1}>
                        {links.map((link, index) => {
                            return (
                                <Button
                                    key={index} onClick={() => {
                                        link.url ? navigate(`/chatHistory?page=${link.label}`) : null
                                    }}
                                    variant={link.active ? 'solid' : 'soft'} color="primary"
                                >
                                    {index === 0 ? 'ก่อนหน้า' : index === links.length - 1 ? 'ถัดไป' : link.label}
                                </Button>
                            )
                        })}
                    </Stack>
                </Stack>
            </Box>
        </Sheet>
    );
}