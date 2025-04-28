import { useEffect, useState } from 'react';
import { Sheet, Typography, Box, Avatar, Button, Stack } from '@mui/joy';
import axiosClient from '../../Axios';
import AddCommentIcon from '@mui/icons-material/AddComment';

export default function ChatDetail() {

    const [loading, setLoading] = useState(false);
    const [customer, setCustomer] = useState({});
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        fetchData().finally(() => setLoading(false));
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data, status } = await axiosClient.post(`/chatHistory/${'U21af8c6969cc91a6c00359f33e7f3ba2'}`);
            console.log(data, status);
            setCustomer(data.data.customer);
            setMessages(data.data.chatHistory);

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {/* ส่วนหัว */}
            <Sheet
                variant="outlined"
                sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    gap: 1
                }}
            >
                <Stack direction='row' spacing={1}>
                    <Avatar size="md" color="primary" src={customer?.avatar} />
                    <Box>
                        <Typography level="title-md">{customer?.custName}</Typography>
                        <Typography level="body-sm">{customer?.description}</Typography>
                    </Box>
                </Stack>

                <Button startDecorator={<AddCommentIcon />} color='success'>สร้างเคสใหม่</Button>
            </Sheet>

            {/* ส่วนแสดงข้อความ */}
            <Box
                sx={{
                    flex: 1,
                    p: 2,
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                }}
            >
                {messages.map((message, index) => {
                    const sender = JSON.parse(message.sender);
                    return (
                        <Box
                            key={message.id}
                            sx={{
                                display: 'flex',
                                flexDirection: sender.empCode ? 'row-reverse' : 'row',
                                alignItems: 'flex-start',
                                gap: 1
                            }}
                        >

                            <Avatar variant='solid' size="sm" color={sender?.custId ? "neutral" : "primary"} />
                            {/* <Stack direction='column' spacing={2} sx={{maxWidth: '70%'}}> */}
                            
                                <Box
                                    sx={{
                                        maxWidth: '70%',
                                        p: 2,
                                        borderRadius: 'lg',
                                        bgcolor: sender.empCode ? 'primary.softBg' : 'neutral.softBg',
                                        color: sender.empCode ? 'primary.softBg' : 'neutral.softBg',
                                        position: 'relative',
                                    }}
                                >
                                    <Typography sx={{textAlign : 'end'}}>test</Typography>
                                    <Typography level="body-md" sx={{ whiteSpace: 'pre-wrap' }}>
                                        {message.content}
                                    </Typography>
                                    <Typography
                                        level="body-xs"
                                        sx={{
                                            mt: 1,
                                            display: 'block',
                                            textAlign: sender?.empCode ? 'right' : 'left',
                                            color: sender?.empCode ? 'primary.400' : 'neutral.400'
                                        }}
                                    >
                                        {new Date(message.created_at).toLocaleString('th-TH')}
                                    </Typography>
                                </Box>
                            {/* </Stack> */}

                        </Box>
                    )
                })}
            </Box>

            {/* ส่วนพิมพ์ข้อความ */}
            {/* <Sheet
                variant="outlined"
                sx={{
                    p: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Button fullWidth>เปิดเคสใหม่</Button>
            </Sheet> */}
        </Box>
    );
}