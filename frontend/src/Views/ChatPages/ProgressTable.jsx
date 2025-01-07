import Box from "@mui/joy/Box";
import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import Typography from "@mui/joy/Typography";
import { Button, Divider, Input, Sheet, Stack, Table } from "@mui/joy";
import Avatar from "@mui/joy/Avatar";
import { convertFullDate, convertLocalDate, differentDate } from "../../Components/Options.jsx";
import Chip from "@mui/joy/Chip";
import ChatIcon from "@mui/icons-material/Chat";
import { useEffect, useState } from "react";
import HistoryIcon from '@mui/icons-material/History';
import { Link, useNavigate } from "react-router-dom";
import SendIcon from '@mui/icons-material/Send';
import { endTalkAllProgressApi } from "../../api/Messages.js";
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import { useAuth } from "../../context/AuthContext.jsx";
import CircleIcon from '@mui/icons-material/Circle';

export const ProgressTable = ({roomId, progress, filterProgress, setFilterProgress }) => {
    const [search, setSearch] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();
    const handleChat = (rateId, activeId, custId) => {
        const params = `${rateId}/${activeId}/${custId}`;
        navigate(`/select/message/${params}/1`);
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


    const MessageDetail = ({ data }) => {
        if (data.latest_message.contentType) {
            if (data.latest_message.contentType === 'text') {
                return <>{data.latest_message.content}</>
            } else if (data.latest_message.contentType === 'image' || data.latest_message.contentType === 'sticker') {
                return <>ส่งสื่อหรือสติกเกอร์ </>
            } else if (data.latest_message.contentType === 'location') {
                return <>ส่งที่อยู่ </>
            } else if (data.latest_message.contentType === 'audio') {
                return <>ส่งไฟล์เสียง (เวลา {convertLocalDate(data.latest_message.created_at)})</>
            } else if (data.latest_message.contentType === 'file') {
                return <>ส่งไฟล์ PDF</>
            }
            else {
                return <></>
            }
        } else {
            return <></>
        }
    }


    return (
        <>
            <Box sx={ChatPageStyle.BoxTable}>
                <Stack direction="row" spacing={1}>
                    <Typography level="h2" component="h1">
                        กำลังดำเนินการ&nbsp;
                        <Typography level="body-sm" color="neutral">
                            {progress.length} รายการ
                        </Typography>
                    </Typography>
                    <Input type="search" placeholder="ค้นหาชื่อลูกค้า" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <Button onClick={() => handleFilter()}>ค้นหา</Button>
                </Stack>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    {user.role === 'admin' && (
                        <Button color='warning' variant="outlined" onClick={handleEndTalkAll}>
                            <SendIcon />&nbsp;จบการสนทนาทั้งหมด
                        </Button>
                    )}
                    <Button component={Link} to={'/chatHistory'}>
                        <HistoryIcon />&nbsp;ประวัติแชททั้งหมด
                    </Button>
                </Box>
            </Box>
            <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
                <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
                    <thead>
                        <tr>
                            <th style={{ width: 400 }}>ชื่อลูกค้า</th>
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
                                <td>
                                    <Stack flexDirection='row' alignItems='center' gap={1}>
                                        <div>
                                            {!data.unread && <CircleIcon sx={{ color: 'green' }} />}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            {data.avatar && <Avatar size='sm' sx={{ mr: 1 }} src={data.avatar} />}
                                            <Box>
                                                <Typography fontWeight='bold'>
                                                    {data.custName}
                                                    &nbsp;
                                                    <Typography fontSize={10} color="neutral">
                                                        (รหัสอ้างอิง&nbsp;{data.id})
                                                    </Typography>
                                                </Typography>
                                                <Chip color="success" size="sm">{data.description}</Chip>
                                                <Divider sx={{ my: 1 }} />
                                                <Chip color="primary" variant="soft">
                                                    <ChatIcon fontSize="large" />&nbsp;
                                                    <MessageDetail data={data} />
                                                </Chip>
                                            </Box>
                                        </div>

                                    </Stack>

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
                                    <Chip color='danger'>
                                        <Typography sx={ChatPageStyle.TableText}>
                                            {data.receiveAt ? convertFullDate(data.receiveAt) : 'ยังไม่เริ่มสนทนา'}
                                        </Typography>
                                    </Chip>
                                </td>
                                <td>
                                    <Chip color="warning">
                                        <Typography sx={ChatPageStyle.TableText}>
                                            {data.startTime ? convertFullDate(data.startTime) : 'ยังไม่เริ่มสนทนา'}
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
                                        sx={{ mr: 1 }} startDecorator={<ChatIcon />}>
                                        <Typography>ดูข้อความ</Typography>
                                    </Button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center' }}>
                                    <Chip color='primary'>ไม่มีข้อมูล</Chip>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </Sheet>
        </>

    )
}