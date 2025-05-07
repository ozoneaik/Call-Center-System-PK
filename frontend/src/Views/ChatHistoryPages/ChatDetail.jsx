import { useEffect, useState } from 'react';
import { Sheet, Typography, Box, Avatar, Button, Stack, Card, Chip, IconButton } from '@mui/joy';
import axiosClient from '../../Axios';
import { AddComment, ArrowBack } from '@mui/icons-material';
import CircularProgress from '@mui/joy/CircularProgress';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CreateCase from './CreateCase';

export default function ChatDetail() {

    const [loading, setLoading] = useState(false);
    const [customer, setCustomer] = useState({});
    const [messages, setMessages] = useState([]);
    const [currentRate, setCurrentRate] = useState({});
    const [openCreateCase, setOpenCreateCase] = useState(false);

    const { custId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchData().finally(() => setLoading(false));
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data, status } = await axiosClient.post(`/chatHistory/${custId}`);
            console.log(data, status);
            setCustomer(data.data.customer);
            setMessages(data.data.chatHistory);
            setCurrentRate(data.data.current_rate);

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    const HeaderComponent = () => (
        <Sheet variant="outlined" sx={HeaderStyle}>
            <Stack direction='row' spacing={2}>
                <IconButton onClick={() => navigate(-1)} variant='outlined' size='sm' color='primary'>
                    <ArrowBack />
                </IconButton>
                <Stack direction='row' spacing={1}>
                    <Avatar size="md" color="primary" src={customer?.avatar} />
                    <Box>
                        <Stack direction='row' spacing={1}>
                            <Typography level="title-md">{customer?.custName}</Typography>
                            <Chip
                                color={{
                                    pending: 'warning',
                                    progress: 'neutral',
                                    success: 'success'
                                }[currentRate.status] ?? 'danger'}
                                variant='outlined' size='sm'
                            >
                                {{
                                    pending: `รอรับเรื่อง ที่ห้อง ${currentRate.roomName}`,
                                    progress: `อยู่ระหว่างดำเนินการ ที่ห้อง ${currentRate.roomName}`,
                                    success: 'ปิดเคสแล้ว'
                                }[currentRate.status] ?? 'ข้อผิดพลาด'}
                            </Chip>
                        </Stack>
                        <Typography level="body-sm">{customer?.description}</Typography>
                    </Box>
                </Stack>
            </Stack>

            <Button
                size='sm' startDecorator={<AddComment />} disabled={currentRate.status !== 'success'} color='success'
                onClick={() => setOpenCreateCase(true)}
            >
                สร้างเคสใหม่
            </Button>

        </Sheet>
    )

    const MessageListComponent = () => (
        <Box sx={MessageListComponentStyle}>
            {messages.map((message, index) => {
                const sender = JSON.parse(message.sender);
                return (
                    <Card
                        invertedColors key={index}
                        sx={{ padding: 1, border: 'none' }}
                    >
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Stack direction='row' spacing={2} alignItems='center'>
                                <Avatar size="sm" color="primary" src={sender.avatar} />
                                <Stack direction='column'>
                                    <Typography fontWeight='bold'>{sender.custName || sender.name}</Typography>
                                    {message.contentType === 'text' || message.contentType === 'location' ? (
                                        <Typography>{message.content}</Typography>
                                    ) : (
                                        <Button component={Link} to={message.content} size='sm' target='_blank'>
                                            ดูสื่อ {{
                                                image: 'รูปภาพ',
                                                video: 'วิดีโอ',
                                                audio: 'เสียง',
                                                file: 'ไฟล์',
                                                sticker: 'สติ๊กเกอร์',
                                            }[message.contentType]}
                                        </Button>
                                    )}

                                </Stack>
                            </Stack>
                            <Chip size='sm' color='warning'>
                                {new Date(message.created_at).toLocaleString('TH-th')}
                            </Chip>
                        </Stack>
                    </Card>
                )
            })}
        </Box>
    )

    return (
        <>
            {openCreateCase && <CreateCase open={openCreateCase} setOpen={setOpenCreateCase} custId={custId} />}
            <Stack direction='row' spacing={0}>
                {loading ?
                    <CircularProgress /> :
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
                        {/* ส่วนหัว */}
                        <HeaderComponent />
                        {/* ส่วนแสดงข้อความ */}
                        <MessageListComponent />
                    </Box >
                }
            </Stack>
        </>
    );
}


const HeaderStyle = {
    p: 2,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid',
    borderColor: 'divider',
    gap: 1
}

const MessageListComponentStyle = {
    flex: 1,
    // p: 2,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    // gap: 2
}

const messsageBoxStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 1
}