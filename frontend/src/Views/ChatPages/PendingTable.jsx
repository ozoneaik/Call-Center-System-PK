import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import { Button, Sheet, Table, Stack, Input, Chip, Typography, Box, Avatar } from "@mui/joy";
import { convertFullDate, convertLocalDate, differentDate } from "../../Components/Options.jsx";
import ChatIcon from "@mui/icons-material/Chat";
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import { endTalkAllPendingApi, receiveApi } from "../../Api/Messages.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import SendIcon from '@mui/icons-material/Send';
import { useState, useEffect } from "react";

export const PendingTable = (props) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { pending } = props;
    const { setFilterPending, filterPending } = props;
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [search, setSearch] = useState('');
    const handleChat = ({ rateId, roomId }) => {
        const options = {
            title: 'ต้องการรับเรื่องหรือไม่',
            text: 'กด "ตกลง" เพื่อยืนยันรับเรื่อง',
            icon: 'info'
        };
        AlertDiaLog({
            ...options,
            onPassed: async (confirm) => {
                if (confirm) {
                    const { data, status } = await receiveApi(rateId, roomId);
                    if (status === 200) {
                        // navigate(`/select/message/${params}/1`);
                    } else AlertDiaLog({ title: data.message, text: data.detail });
                } else console.log('ไม่ได้ confirm');
            }
        });
    };

    const TimeDisplay = ({ startTime }) => {
        const [timeDiff, setTimeDiff] = useState(differentDate(startTime));

        useEffect(() => {
            const interval = setInterval(() => {
                setTimeDiff(differentDate(startTime));
            }, 1000);
            return () => clearInterval(interval);
        }, [startTime]);

        return (
            <Chip color="primary">
                <Typography sx={ChatPageStyle.TableText}>
                    {startTime ? timeDiff : 'ยังไม่เริ่มสนทนา'}
                </Typography>
            </Chip>
        );
    };

    const redirectChat = (select) => {
        const params = `${select.rateRef}/${select.id}/${select.custId}`;
        navigate(`/select/message/${params}/0`, {
            state: { from: location }
        });
    }

    const BtnComponent = ({ rateRef, id, custId, roomId, index }) => {
        let Disable;
        if (user.role === 'admin') {
            Disable = false;
        } else {
            Disable = index !== 0;
        }
        return (
            <Box sx={{ display: 'flex' }}>
                <Button size='sm' variant='outlined' sx={{ mr: 1 }}
                    disabled={Disable} startDecorator={<ChatIcon />}
                    onClick={() => handleChat({ rateId: rateRef, id, custId, roomId })}
                >
                    <Typography>รับเรื่อง</Typography>
                </Button>
            </Box>
        )
    }

    const endTalkAllPending = () => {
        AlertDiaLog({
            icon: 'question',
            title: 'จบการสนทนาตามช่วงเวลา',
            text: `คุณต้องการจบการสนทนาตามช่วงเวลาตั้งแต่ ${startTime} ถึง ${endTime} ที่กำหนดหรือไม่ ?`,
            onPassed: async (confirm) => {
                if (confirm) {
                    const { data, status } = await endTalkAllPendingApi({ roomId: 'ROOM00', list: pending, startTime, endTime });
                    AlertDiaLog({
                        icon: status === 200 ? 'success' : 'error',
                        title: data.message,
                        text: data.detail,
                        onPassed: () => {
                            status === 200 && window.location.reload();
                        }
                    })
                }
            }
        })
    }

    const handleFilter = () => {
        if (!search) {
            setFilterPending(pending);
            return;
        }
        const updateFilter = pending.filter((data) =>
            data.custName.toLowerCase().includes(search.toLowerCase())
        );
        setFilterPending(updateFilter);
    };

    return (
        <>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }} justifyContent='space-between'>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <Typography level="h2" component="h1">
                        รอดำเนินการ&nbsp;
                        <Typography level="body-sm" color="neutral">
                            {pending.length} รายการ
                        </Typography>
                    </Typography>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <Input
                            fullWidth type="search" placeholder="ค้นหาชื่อลูกค้า"
                            value={search} onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button onClick={() => handleFilter()}>ค้นหา</Button>
                    </Stack>
                </Stack>
                {/* <Stack direction={{xs : 'column', md : 'row'}} justifyContent='start' spacing={2} alignItems='center'>
                    {user.role === 'admin' && (
                        <>
                            <Input type="date" onChange={(e) => setStartTime(e.target.value)} />
                            <Typography>ถึง</Typography>
                            <Input type="date" onChange={(e) => setEndTime(e.target.value)} />
                            <Button onClick={() => endTalkAllPending()} disabled={!startTime || !endTime}>
                                <SendIcon />&nbsp;จบการสนทนาตามช่วงเวลา
                            </Button>
                        </>
                    )}
                </Stack> */}
            </Stack>
            <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
                <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
                    <thead>
                        <tr>
                            <th style={{ width: 200 }}>ชื่อลูกค้า</th>
                            <th style={{ width: 150 }}>เมื่อ</th>
                            <th style={{ width: 150 }}>ผ่านมาแล้ว</th>
                            <th style={{ width: 150 }}>จากห้องแชท</th>
                            <th style={{ width: 150 }}>จากพนักงาน</th>
                            <th style={{ width: 150 }}>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            filterPending.length > 0 ? filterPending.map((data, index) => (
                                <tr key={index}>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            {data.avatar && <Avatar size='sm' sx={{ mr: 1 }} src={data.avatar} />}
                                            <Box>
                                                <Typography>{data.custName}</Typography>
                                                <Chip color="success" size="sm">{data.description}</Chip>
                                            </Box>
                                        </div>
                                        <Stack mt={1}>
                                            <Chip color="primary" variant="soft">
                                                <ChatIcon />&nbsp;
                                                {data.latest_message.contentType && data.latest_message.contentType === 'text' ? (
                                                    <>
                                                        {data.latest_message.content} (เวลา {convertLocalDate(data.latest_message.created_at)})
                                                    </>
                                                ) : data.latest_message.contentType === 'image' || data.latest_message.contentType === 'sticker' ? (
                                                    <>
                                                        ส่งสื่อหรือสติกเกอร์ (เวลา {convertLocalDate(data.latest_message.created_at)})
                                                    </>
                                                ) : data.latest_message.contentType === 'location' ? (
                                                    <>
                                                        ส่งที่อยู่ (เวลา {convertLocalDate(data.latest_message.created_at)})
                                                    </>
                                                ) : data.latest_message.contentType === 'audio' ? (
                                                    <>ส่งไฟล์เสียง (เวลา {convertLocalDate(data.latest_message.created_at)})</>
                                                ) : data.latest_message.contentType === 'file' ? (<>แนปไฟล์ pdf</>) : <></>}
                                            </Chip>
                                        </Stack>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            {data.userReply &&
                                                <Avatar color='primary' size='sm' sx={{ mr: 1 }} />}
                                            <Typography>
                                                {convertFullDate(data.updated_at)}
                                            </Typography>
                                        </div>
                                    </td>
                                    <td>
                                        <TimeDisplay startTime={data.created_at} />
                                    </td>
                                    <td>
                                        <Chip color="warning">
                                            <Typography sx={ChatPageStyle.TableText}>
                                                {data.roomName || 'ไม่พบ'}
                                            </Typography>
                                        </Chip>
                                    </td>
                                    <td>
                                        <Chip color="primary">
                                            <Typography sx={ChatPageStyle.TableText}>
                                                {data.from_empCode || 'ไม่พบ'}
                                            </Typography>
                                        </Chip>
                                    </td>
                                    <td>
                                        <BtnComponent
                                            index={index} rateRef={data.rateRef}
                                            id={data.id} custId={data.custId} roomId={data.roomId}
                                        />
                                        <Button onClick={() => redirectChat(data)}>
                                            ดูข้อความ
                                        </Button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center' }}>
                                        <Chip color='danger'>ไม่มีข้อมูล</Chip>
                                    </td>
                                </tr>
                            )
                        }
                    </tbody>
                </Table>
            </Sheet>
        </>
    );
}