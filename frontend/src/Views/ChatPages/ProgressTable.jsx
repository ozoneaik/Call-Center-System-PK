import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import Typography from "@mui/joy/Typography";
import { Button, Divider, Input, Sheet, Stack, Table, Box, Chip, Avatar } from "@mui/joy";
import { convertFullDate, convertLocalDate, differentDate } from "../../Components/Options.jsx";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { endTalkAllProgressApi } from "../../Api/Messages.js";
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import { useAuth } from "../../context/AuthContext.jsx";;
import { AccessAlarm, DateRange, Search, History, Send, Chat } from '@mui/icons-material';

const IntroChat = ({ data }) => {
    return (
        <Stack direction='row' spacing={2}>
            <Avatar size='sm' sx={{ mr: 1 }} src={data.avatar || ''} />
            < Box >
                <Typography fontWeight='bold'>
                    {data.custName}
                    &nbsp;
                    <Typography fontSize={10} color="neutral">
                        (รหัสอ้างอิง &nbsp;A{data.id}R{data.rateRef})
                    </Typography>
                </Typography>
                <Chip color="success" size="sm">{data.description}</Chip>
                <Divider sx={{ my: 1 }} />
                <Chip color="primary" variant="soft" startDecorator={<Chat fontSize="large" />}>
                    <MessageDetail data={data} />
                </Chip>
            </Box>
        </Stack>
    )
}

const MessageDetail = ({ data }) => {
    if (data.latest_message.contentType) {
        if (data.latest_message.contentType === 'text') return <>{data.latest_message.content}</>
        else if (data.latest_message.contentType === 'image' || data.latest_message.contentType === 'sticker') {
            return <>ส่งรูปภาพหรือสติกเกอร์ </>
        } else if (data.latest_message.contentType === 'video') {
            return <>ส่งวิดีโอ</>
        }
        else if (data.latest_message.contentType === 'location') {
            return <>ส่งที่อยู่ </>
        } else if (data.latest_message.contentType === 'audio') {
            return <>ส่งไฟล์เสียง (เวลา {convertLocalDate(data.latest_message.created_at)})</>
        } else if (data.latest_message.contentType === 'file') return <>ส่งไฟล์ PDF</>
        else return <></>
    } else return <></>
}

export const ProgressTable = ({ roomId, progress, filterProgress, setFilterProgress }) => {
    const [search, setSearch] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const handleChat = (rateId, activeId, custId) => {
        const params = `${rateId}/${activeId}/${custId}`;
        navigate(`/select/message/${params}/1`,{
            state: {from: location}
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
            <Chip color="primary" variant="solid" startDecorator={<AccessAlarm />}>
                <Typography sx={ChatPageStyle.TableText}>
                    {startTime ? timeDiff : 'ยังไม่เริ่มสนทนา'}
                </Typography>
            </Chip>
        );
    };

    const handleEndTalkAll = () => {
        AlertDiaLog({
            title: 'จบการสนทนาทั้งหมด',
            text: 'คุณต้องการจบการสนทนาทั้งหมดที่กำลังดำเนินการอยู่หรือไม่ ?',
            icon: 'question',
            onPassed: async (confirm) => {
                if (confirm) {
                    const { data, status } = await endTalkAllProgressApi({ roomId, list: progress });
                    console.log(data);
                    AlertDiaLog({
                        title: data.message,
                        text: data.detail,
                        icon: status === 200 ? 'success' : 'error',
                        onPassed: () => status === 200 && window.location.reload()
                    });
                } else alert('ไม่ได้ confirm');
            }
        })
    }

    const handleFilter = () => {
        if (!search) {
            setFilterProgress(progress);
            return;
        }
        const updateFilter = progress.filter((data) =>
            data.custName.toLowerCase().includes(search.toLowerCase())
        );
        setFilterProgress(updateFilter);
    };





    return (
        <>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ mb: 2 }} justifyContent='space-between'>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <Typography level="h2" component="h1">
                        กำลังดำเนินการ&nbsp;
                        <Typography level="body-sm" color="neutral">
                            {progress.length} รายการ
                        </Typography>
                    </Typography>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <Input type="search" placeholder="ค้นหาชื่อลูกค้า" value={search} onChange={(e) => setSearch(e.target.value)} />
                        <Button onClick={() => handleFilter()} startDecorator={<Search />}>ค้นหา</Button>
                    </Stack>
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent={{ xs: 'start', lg: 'end' }}>
                    {user.role === 'admin' && (
                        <Button color='warning' onClick={handleEndTalkAll} startDecorator={<Send />}>
                            จบการสนทนาทั้งหมด
                        </Button>
                    )}
                    <Button component={Link} to={'/chatHistory'} color="neutral" startDecorator={<History />}>
                        ประวัติแชททั้งหมด
                    </Button>
                </Stack>
            </Stack>
            <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
                <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
                    <thead>
                        <tr>
                            <th style={{ width: 300 }}>ชื่อลูกค้า</th>
                            <th style={{ width: 200 }}>พนักงานรับเรื่อง</th>
                            <th style={{ width: 200 }}>วันที่รับเรื่อง</th>
                            <th style={{ width: 200 }}>เวลาเรื่ม</th>
                            <th style={{ width: 200 }}>เวลาที่สนทนา</th>
                            <th style={{ width: 150 }}>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filterProgress && filterProgress.length > 0 ? filterProgress.map((data, index) => (
                            <tr key={index}>
                                <td style={{ overflow: 'hidden' }}>
                                    <IntroChat data={data} />
                                </td>
                                <td>
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                        {data.empCode && <Avatar color='primary' size='sm' sx={{ mr: 1 }} />}
                                        <Typography>
                                            {data.empName || '-'}
                                        </Typography>
                                    </div>
                                </td>
                                <td>
                                    <Chip variant="solid" color='success' startDecorator={<DateRange />}>
                                        <Typography sx={ChatPageStyle.TableText}>
                                            {data.receiveAt ? convertFullDate(data.receiveAt) : 'ยังไม่เริ่มสนทนา'}
                                        </Typography>
                                    </Chip>
                                </td>
                                <td>
                                    <Chip variant="solid" color="warning" startDecorator={<DateRange />}>
                                        <Typography sx={ChatPageStyle.TableText}>
                                            เวลาเรื่ม : {data.startTime ? convertFullDate(data.startTime) : 'ยังไม่เริ่มสนทนา'}
                                        </Typography>
                                    </Chip>
                                </td>
                                <td>
                                    <TimeDisplay startTime={data.startTime} />
                                </td>
                                <td>
                                    <Button
                                        onClick={() => handleChat(data.rateRef, data.id, data.custId)}
                                        size='sm' variant='outlined'
                                        sx={{ mr: 1 }} startDecorator={<Chat />}>
                                        <Typography>ดูข้อความ</Typography>
                                    </Button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center' }}>
                                    <Chip variant="solid" color='primary'>ไม่มีข้อมูล</Chip>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </Sheet>
        </>

    )
}