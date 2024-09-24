import {Button, Sheet, Table} from "@mui/joy";
import {useParams} from "react-router-dom";
import {ChatPageStyle} from "../../styles/ChatPageStyle.js";
import {useEffect, useState} from "react";
import {CustomerListNewDm, receiveApi} from "../../api/Messages.js";
import Typography from "@mui/joy/Typography";
import Box from "@mui/joy/Box";
import {AlertDiaLog} from "../../Dialogs/Alert.js";
import BreadcrumbsComponent from "../../components/Breadcrumbs.jsx";
import ChatIcon from '@mui/icons-material/Chat';
import Chip from "@mui/joy/Chip";
import Avatar from "@mui/joy/Avatar";
import {convertLocalDate, getRandomColor} from "../../components/Options.jsx";
import {useNotification} from "../../context/NotiContext.jsx";

const pendingPath = [{name: 'ห้องแชทรวม'}, {name: 'รายละเอียด'}];

export default function MainChat() {
    const {notification} = useNotification();
    const {roomId} = useParams();
    const [progress, setProgress] = useState([]);
    const [pending, setPending] = useState([]);
    useEffect(() => {
        const fetchChats = async () => {
            try {
                const {data, status} = await CustomerListNewDm(roomId);
                if (status === 200) {
                    setProgress(data.progress);
                    setPending(data.pending);
                }
            } catch (error) {
                AlertDiaLog({title: 'เกิดข้อผิดพลาด'})
            }
        }
        fetchChats().then();
    }, [roomId, notification]);

    const handleChat = (custId, title) => {
        if (title === 'รอดำเนินการ') {
            AlertDiaLog({
                title: 'ต้องการรับเรื่องหรือไม่',
                text: 'กด "ตกลง" เพื่อยืนยันรับเรื่อง',
                icon: 'info',
                onPassed: async (confirm) => {
                    if (confirm) {
                        const {data,status} = await receiveApi(custId);
                        if (status === 200) {
                            window.open(`/chat/message/${custId}`, '_blank');
                        }else{
                            AlertDiaLog({text: data.message})
                        }
                    }
                }
            })
        } else window.open(`/chat/message/${custId}`, '_blank');
    }

    const ListTableComponent = ({dataset, title}) => {
        return (
            <>
                <Box sx={ChatPageStyle.BoxTable}>
                    <Typography level="h2" component="h1">
                        {title}
                    </Typography>
                </Box>
                <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
                    <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
                        <thead>
                        <tr>
                            <th>ชื่อลูกค้า</th>
                            <th>พนักงานรับเรื่อง</th>
                            <th>เวลาเรื่ม</th>
                            <th>เวลาที่สนทนา</th>
                            <th>จัดการ</th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                            dataset.length > 0 ? dataset.map((data, index) => (
                                <tr key={index}>
                                    <td>
                                        <div style={{display: "flex", alignItems: "center"}}>
                                            {data.avatar && <Avatar size='sm' sx={{mr: 1}} src={data.avatar}/>}
                                            <Typography>
                                                {data.name}
                                            </Typography>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{display: "flex", alignItems: "center"}}>
                                            {data.userReply &&
                                                <Avatar color={getRandomColor()} size='sm' sx={{mr: 1}}/>}
                                            <Typography>
                                                {data.userReply || '-'}
                                            </Typography>
                                        </div>
                                    </td>
                                    <td>
                                        <Chip color="warning">
                                            <Typography sx={ChatPageStyle.TableText}>
                                                {convertLocalDate(data.created_at)}
                                            </Typography>
                                        </Chip>
                                    </td>
                                    <td>
                                        <Chip color="primary">
                                            <Typography sx={ChatPageStyle.TableText}>
                                                {convertLocalDate(data.updated_at)}
                                            </Typography>
                                        </Chip>
                                    </td>
                                    <td>
                                        <Button size='sm' variant='outlined' sx={{mr: 1}}
                                                disabled={title === 'รอดำเนินการ' && index !== 0}
                                                startDecorator={<ChatIcon/>}
                                                onClick={() => handleChat(data.custId, title)}
                                        >
                                            <Typography>{title === 'รอดำเนินการ' ? 'รับเรื่อง' : 'ดูข้อความ'}</Typography>
                                        </Button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} style={{textAlign: 'center'}}>
                                        <Chip color={getRandomColor()}>ไม่มีข้อมูล</Chip>
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

    return (
        <>
            <Sheet sx={ChatPageStyle.Layout}>
                <Box component="main" sx={ChatPageStyle.MainContent}>
                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                        <BreadcrumbsComponent list={pendingPath}/>
                    </Box>
                    <ListTableComponent dataset={progress} title='กำลังดำเนินการ'/>
                    <ListTableComponent dataset={pending} title='รอดำเนินการ'/>
                </Box>
            </Sheet>
        </>
    )
}