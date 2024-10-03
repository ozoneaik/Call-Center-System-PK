import {ChatPageStyle} from "../styles/ChatPageStyle.js";
import {Box, CircularProgress, Sheet, Table} from "@mui/joy";
import BreadcrumbsComponent from "../Components/Breadcrumbs.jsx";
import {useEffect, useState} from "react";
import {chatRoomListApi, deleteUserApi, usersListApi} from "../Api/Messages.js";
import Avatar from "@mui/joy/Avatar";
import Typography from "@mui/joy/Typography";
import {convertFullDate, getRandomColor} from "../Components/Options.jsx";
import EditNoteIcon from "@mui/icons-material/EditNote";
import Button from "@mui/joy/Button";
import DeleteIcon from '@mui/icons-material/Delete';
import Chip from "@mui/joy/Chip";
import {AlertDiaLog} from "../Dialogs/Alert.js";
import {useAuth} from "../context/AuthContext.jsx";
import ModalDialog from "../Components/ModalDialog.jsx";


const BreadcrumbsPath = [{name: 'จัดการผู้ใช้'}, {name: 'รายละเอียด'}]

export default function Users() {
    const {user} = useAuth();
    const [users, setUsers] = useState([]);
    const [selected, setSelected] = useState({});
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [chatRooms, setChatRooms] = useState([]);

    const getUsers = async () => {
        setLoading(true);
        const {data, status} = await usersListApi();
        status === 200 && setUsers(data.users);
    };

    const getChatRooms = async () => {
        const {data,status} = await chatRoomListApi();
        status === 200 && setChatRooms(data.chatRooms);
    }

    useEffect(() => {
        getUsers().finally(() => {
            getChatRooms().finally(() => {
                setLoading(false);
            })
        });
    }, []);

    const handleDelete = (name, empCode) => {
        AlertDiaLog({
            onPassed: async (confirm) => {
                if (!confirm) return;
                const {data, status} = await deleteUserApi(empCode);
                AlertDiaLog({
                    icon: status === 200 && 'success',
                    title: data.message,
                    text: data.detail,
                    onPassed: (confirm) => {
                        confirm && getUsers().finally(() => {
                            setLoading(false);
                        });
                    }
                });
            },
            icon: 'question',
            title: `ลบผู้ใช้`,
            text: `กด ตกลง เพื่อยันยันการลบผู้ใช้ ${name} ${empCode}`,
        })
    }

    return (
        <>
            {open && (<ModalDialog open={open} setOpen={setOpen} event={'user'} selected={selected} chatRooms={chatRooms}/>)}
            <Sheet sx={ChatPageStyle.Layout}>
                <Box component="main" sx={ChatPageStyle.MainContent}>
                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                        <BreadcrumbsComponent list={BreadcrumbsPath}/>
                    </Box>
                    <Box sx={ChatPageStyle.BoxTable}>
                        <Typography level="h2" component="h1">จัดการผู้ใช้</Typography>
                        <Button size='sm'>+ เพิ่มผู้ใช้</Button>
                    </Box>
                    <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
                        <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
                            <thead>
                            <tr>
                                <th style={{width: 200}}>รหัสผู้ใช้</th>
                                <th style={{width: 200}}>ชื่อ</th>
                                <th style={{width: 200}}>สิทธิ์ (ประจำอยู่ห้อง)</th>
                                <th style={{width: 200}}>สร้างเมื่อ</th>
                                <th style={{width: 200}}>จัดการ</th>
                            </tr>
                            </thead>
                            <tbody>
                            {
                                !loading ? (
                                    users.length > 0 ? users.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.empCode}</td>
                                            <td>
                                                <div style={{display: "flex", alignItems: "center"}}>
                                                    <Avatar size='sm' sx={{mr: 1}} src={item.avatar}/>
                                                    <Typography>{item.name}</Typography>
                                                </div>
                                            </td>
                                            <td>
                                                <Chip color={getRandomColor()}>{item.role}</Chip>
                                                &nbsp;
                                                ({item.roomName})
                                            </td>
                                            <td>
                                                <Chip color={getRandomColor()}>
                                                    {convertFullDate(item.created_at)}
                                                </Chip>
                                            </td>
                                            <td>
                                                <Button
                                                    size='sm' sx={{mr: 1}}
                                                    disabled={item.role === 'BOT'}
                                                    onClick={() => {
                                                        setOpen(true);
                                                        setSelected(item);
                                                    }}
                                                >
                                                    <EditNoteIcon/>
                                                </Button>
                                                <Button
                                                    disabled={(user.empCode === item.empCode) || (item.role === 'BOT')}
                                                    onClick={() => handleDelete(item.name, item.empCode)} size='sm'
                                                    color='danger'>
                                                    <DeleteIcon/>
                                                </Button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5}>ไม่มีข้อมูล</td>
                                        </tr>
                                    )
                                ) : (
                                    <tr>
                                        <td colSpan={5} style={{textAlign: 'center'}}>
                                            <CircularProgress/>
                                        </td>
                                    </tr>
                                )
                            }
                            </tbody>
                        </Table>
                    </Sheet>
                </Box>
            </Sheet>
        </>
    )
}