import { useEffect, useState } from "react"
import axiosClient from "../../Axios"
import { 
  Badge, 
  Avatar, 
  Box, 
  Button, 
  Card, 
  CircularProgress, 
  Stack, 
  Typography, 
  Chip,
  Divider,
  Sheet,
  Container,
  Grid
} from "@mui/joy";
import { FilterAlt, Refresh, Chat, QuestionAnswer } from "@mui/icons-material";
import { AlertDiaLog } from "../../Dialogs/Alert";

export default function BotRoom() {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roomList, setRoomList] = useState([]);
    const [isFiltering, setIsFiltering] = useState(false);

    useEffect(() => {
        fetchData();
    }, [])

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data, status } = await axiosClient.get('/bot-room');
            setList(data.data);
            setRoomList(data.roomList);
            console.log(data, status);
        } catch (error) {
            console.error('Error fetching data:', error.response.data.message);
            AlertDiaLog({
                title: 'ข้อผิดพลาด',
                text: error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลได้',
                icon: 'error'
            });
        } finally {
            setLoading(false);
        }
    }

    const formatSender = (sender) => {
        return JSON.parse(sender);
    }

    const handelChangeRoomByOne = (roomId, roomName, rateId) => {
        console.log(roomId, roomName, rateId);
        AlertDiaLog({
            title: 'ยืนยันการเปลี่ยนห้อง',
            text: `คุณต้องการเปลี่ยนห้องไปยัง ${roomName} หรือไม่`,
            icon: 'question',
            onPassed: async (confirm) => {
                confirm && changeBotByone(rateId, roomId);
            }
        })
    }

    const changeBotByone = async (rateId, roomId) => {
        try {
            await axiosClient.post(`/bot-room/${rateId}/${roomId}`);
            setList(list.filter((item) => item.id !== rateId));
        } catch (error) {
            AlertDiaLog({
                title: 'เกิดข้อผิดพลาด',
                text: error.response?.data?.message || 'เกิดข้อผิดพลาดระหว่างการเปลี่ยนห้อง',
                icon: 'error'
            });
        }
    }

    const handleStartFiltering = () => {
        setIsFiltering(true);
        // ตรงนี้จะมีโค้ดสำหรับการกรองข้อมูลในอนาคต
        setTimeout(() => {
            setIsFiltering(false);
            AlertDiaLog({
                title: 'สำเร็จ',
                text: 'กระบวนการกรองเสร็จสิ้น',
                icon: 'success'
            });
        }, 2000);
    }

    const showContent = (content, contentType) => {
        if (contentType === 'text') {
            return (
                <Typography 
                    sx={{ 
                        maxWidth: '100%', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                    }}
                >
                    {content}
                </Typography>
            );
        } else if (contentType === 'image' || contentType === 'sticker') {
            return (
                <Box sx={{ maxWidth: '100%', borderRadius: 'md', overflow: 'hidden' }}>
                    <img src={content} alt="รูปภาพ" style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'cover' }} />
                </Box>
            );
        } else if (contentType === 'video') {
            return (
                <Box sx={{ maxWidth: '100%', borderRadius: 'md', overflow: 'hidden' }}>
                    <video src={content} controls style={{ maxWidth: '100%', maxHeight: '120px' }} />
                </Box>
            );
        } else if (contentType === 'audio') {
            return <audio src={content} controls style={{ width: '100%' }} />;
        } else if (contentType === 'file') {
            return (
                <Button 
                    component="a" 
                    href={content} 
                    download 
                    variant="soft" 
                    color="primary" 
                    size="sm"
                    startDecorator={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"/></svg>}
                >
                    ดาวน์โหลดไฟล์
                </Button>
            );
        } else {
            return <Typography level="body-sm" color="neutral">{content}</Typography>;
        }
    }

    // ฟังก์ชันสำหรับรับ content type มาแสดงเป็นภาษาไทย
    const getContentTypeDisplay = (contentType) => {
        const types = {
            'text': 'ข้อความ',
            'image': 'รูปภาพ',
            'sticker': 'สติกเกอร์',
            'video': 'วิดีโอ',
            'audio': 'เสียง',
            'file': 'ไฟล์',
        };
        return types[contentType] || contentType;
    }

    // ฟังก์ชันสำหรับรับ content type มาแสดงสีของ chip
    const getContentTypeColor = (contentType) => {
        const colors = {
            'text': 'neutral',
            'image': 'success',
            'sticker': 'warning',
            'video': 'danger',
            'audio': 'primary',
            'file': 'info',
        };
        return colors[contentType] || 'neutral';
    }

    return (
        <Sheet maxWidth="false" sx={{ py: 2,background : 'none' }}>
            <Sheet 
                variant="outlined" 
                sx={{ 
                    p: 2, 
                    mb: 3, 
                    borderRadius: 'md',
                    boxShadow: 'sm'
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                    <Typography level="h4" startDecorator={<QuestionAnswer />}>
                        ระบบจัดการห้องแชท
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        <Button 
                            variant="soft" 
                            color="primary" 
                            startDecorator={<Refresh />}
                            onClick={fetchData}
                            disabled={loading}
                        >
                            รีเฟรช
                        </Button>
                        <Button 
                            variant="solid" 
                            color="primary" 
                            startDecorator={<FilterAlt />} 
                            disabled={list.length === 0 || loading || isFiltering}
                            loading={isFiltering}
                            onClick={handleStartFiltering}
                        >
                            เริ่มกระบวนการกรอง
                        </Button>
                    </Stack>
                </Stack>
            </Sheet>

            {loading ? (
                <Stack spacing={2} alignItems="center" sx={{ py: 8 }}>
                    <CircularProgress size="lg" />
                    <Typography level="body-lg">กำลังโหลดข้อมูล...</Typography>
                </Stack>
            ) : (
                <>
                    {list && list.length > 0 ? (
                        <Grid container spacing={2}>
                            {list.map((item, index) => {
                                const sender = formatSender(item.latestMessage.sender);
                                return (
                                    <Grid key={index} xs={12} sm={6} md={4}>
                                        <Card
                                            invertedColors={index % 2 === 0} color="primary"
                                            variant={index % 2 === 0 ? 'solid' : 'outlined'}
                                            sx={{ 
                                                height: '100%', 
                                                display: 'flex', 
                                                flexDirection: 'column',
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: 'md',
                                                },
                                            }}
                                        >
                                            <Stack spacing={2} sx={{ mb: 2 }}>
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Badge
                                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                        badgeContent={
                                                            <Typography
                                                                level="title-sm"
                                                                sx={{
                                                                    bgcolor: 'primary.solidBg',
                                                                    color: 'primary.solidColor',
                                                                    borderRadius: '50%',
                                                                    width: 20,
                                                                    height: 20,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                }}
                                                            >
                                                                {item.id}
                                                            </Typography>
                                                        }
                                                    >
                                                        <Avatar 
                                                            src={sender.avatar} 
                                                            size="lg"
                                                            sx={{ 
                                                                '--Avatar-size': '60px',
                                                                border: '2px solid',
                                                                borderColor: 'background.surface',
                                                            }}
                                                        />
                                                    </Badge>
                                                    <Stack spacing={1} sx={{ flexGrow: 1 }}>
                                                        <Typography level="title-lg" noWrap>
                                                            {item.custName || 'ไม่ระบุชื่อ'}
                                                            
                                                        </Typography>
                                                        <Typography>
                                                            {sender.description}
                                                        </Typography>
                                                        <Chip 
                                                            size="sm" 
                                                            variant="soft" 
                                                            color={getContentTypeColor(item.latestMessage.contentType)}
                                                        >
                                                            {getContentTypeDisplay(item.latestMessage.contentType)}
                                                        </Chip>
                                                    </Stack>
                                                </Stack>
                                                <Divider />
                                                <Box sx={{ minHeight: '80px' }}>
                                                    {showContent(item.latestMessage.content, item.latestMessage.contentType)}
                                                </Box>
                                            </Stack>
                                            <Box sx={{ mt: 'auto' }}>
                                                <Typography level="body-xs" sx={{ mb: 1 }}>
                                                    เลือกย้ายไปยังห้อง:
                                                </Typography>
                                                <Box display="flex" flexWrap="wrap" gap={1}>
                                                    {roomList.map((room, idx) => (
                                                        <Button
                                                            key={idx}
                                                            size="sm"
                                                            variant="soft"
                                                            color="neutral"
                                                            onClick={() => handelChangeRoomByOne(room.roomId, room.roomName, item.id)}
                                                            startDecorator={<Chat fontSize="small" />}
                                                            sx={{ 
                                                                borderRadius: 'md',
                                                                transition: 'all 0.2s',
                                                                '&:hover': {
                                                                    bgcolor: 'primary.softHoverBg',
                                                                    transform: 'scale(1.05)'
                                                                } 
                                                            }}
                                                        >
                                                            {room.roomName}
                                                        </Button>
                                                    ))}
                                                </Box>
                                            </Box>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    ) : (
                        <Sheet 
                            variant="soft" 
                            color="neutral" 
                            sx={{ 
                                p: 6, 
                                borderRadius: 'md', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center'
                            }}
                        >
                            <QuestionAnswer sx={{ fontSize: 64, color: 'neutral.500', mb: 2 }} />
                            <Typography level="h4" sx={{ mb: 1 }}>ไม่มีข้อความในระบบ</Typography>
                            <Typography level="body-md" sx={{ mb: 3, maxWidth: 600 }}>
                                ขณะนี้ไม่มีข้อความใดในระบบที่รอการจัดการ คุณสามารถรีเฟรชเพื่อตรวจสอบข้อความใหม่ได้
                            </Typography>
                            <Button 
                                variant="solid" 
                                color="primary" 
                                startDecorator={<Refresh />}
                                onClick={fetchData}
                            >
                                รีเฟรชข้อมูล
                            </Button>
                        </Sheet>
                    )}
                </>
            )}
        </Sheet>
    )
}