import { useEffect, useState } from 'react';
import { Sheet, Typography, Box, Avatar, Button, Stack } from '@mui/joy';
import axiosClient from '../../Axios';
import AddCommentIcon from '@mui/icons-material/AddComment';
import CircularProgress from '@mui/joy/CircularProgress';

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

    const HeaderComponent = () => (
        <Sheet variant="outlined" sx={HeaderStyle}>
            <Stack direction='row' spacing={1}>
                <Avatar size="md" color="primary" src={customer?.avatar} />
                <Box>
                    <Typography level="title-md">{customer?.custName}</Typography>
                    <Typography level="body-sm">{customer?.description}</Typography>
                </Box>
            </Stack>
            <Button startDecorator={<AddCommentIcon />} color='success'>สร้างเคสใหม่</Button>
        </Sheet>
    )

    const MessageListComponent = () => (
        <Box sx={MessageListComponentStyle}>
            {messages.map((message, index) => {
                const sender = JSON.parse(message.sender);
                return (
                    <Box key={message.id} sx={[messsageBoxStyle, { flexDirection: sender.empCode ? 'row-reverse' : 'row' }]}>
                        <Avatar variant='solid' size="sm" color={sender?.custId ? "neutral" : "primary"} />
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
                            <Typography sx={{ textAlign: 'end' }}>test</Typography>
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
    )

    return (
        <Stack direction='row' spacing={0}>
            {loading ?
                <CircularProgress /> :
                <>
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                        {/* ส่วนหัว */}
                        <HeaderComponent />
                        {/* ส่วนแสดงข้อความ */}
                        <MessageListComponent />
                    </Box >
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                        {/* ส่วนหัว */}
                        <HeaderComponent />
                        {/* ส่วนแสดงข้อความ */}
                        <>get</>
                    </Box >
                </>}

        </Stack>


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
    p: 2,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 2
}

const messsageBoxStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 1
}