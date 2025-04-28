import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { CircularProgress, Stack, Table, useTheme } from "@mui/joy";
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useState } from "react";
import { chatHistoryApi } from "../../Api/Messages.js";
import { convertFullDate } from "../../Components/Options.jsx";
import Button from "@mui/joy/Button";
import Avatar from "@mui/joy/Avatar";
import HistoryIcon from "@mui/icons-material/History";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import Divider from "@mui/joy/Divider";
import Grid from "@mui/joy/Grid";
import { useNavigate, useSearchParams } from "react-router-dom";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import { FilterChatHistory } from "./FilterChatHistory.jsx";

const BreadcrumbsPath = [{ name: 'ห้องแชทล่าสุด' }];

export default function ChatHistory() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [list, setList] = useState([]);
    const [to, setTo] = useState(0);
    const [total, setTotal] = useState(0);
    const [searchParams] = useSearchParams();
    const page_url = searchParams.get('page');
    const [links, setLinks] = useState([]);

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
            }
        } catch (error) {
            console.error("Error fetching chat history:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page_url]);

    const redirectChat = (select) => {
        const params = `${select.rateRef}/${select.id}/${select.custId}`;
        navigate(`/select/message/${params}/0`);
    };

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
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                </Box>

                <Typography level="h3" fontWeight="lg" sx={{ mb: 2 }} startDecorator={<HistoryIcon />}>
                    ประวัติการสนทนาทั้งหมด
                </Typography>

                <FilterChatHistory/>

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
                                                        <Avatar size="sm" />
                                                        <Typography level="title-md" fontWeight="bold">
                                                            {item.custName}
                                                        </Typography>
                                                    </Stack>
                                                </Box>

                                                <Typography level="body-sm" sx={{ mb: 1, color: 'text.tertiary' }}>
                                                    {item.description}
                                                </Typography>

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
                                    <th>ชื่อลูกค้า</th>
                                    <th>คำอธิบาย</th>
                                    <th>ทักครั้งแรกเมื่อ</th>
                                    <th>พนักงานที่คุยล่าสุด</th>
                                    <th style={{ width: '80px', textAlign: 'center' }}>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.length > 0 ? list.map((item, index) => (
                                    <tr key={index}>
                                        <td>
                                            <Stack direction='row' spacing={1} alignItems='center'>
                                                <Avatar size="sm" />
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
                                        <td>{convertFullDate(item.created_at)}</td>
                                        <td>{item.name || '-'}</td>
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
                                        <td colSpan={6}>
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