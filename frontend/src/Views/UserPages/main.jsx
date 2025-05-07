import {ChatPageStyle} from "../../styles/ChatPageStyle.js";
import {Box, CircularProgress, Sheet, Table} from "@mui/joy";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import {useEffect, useState} from "react";
import {deleteUserApi, usersListApi} from "../../Api/User.js";
import {chatRoomListApi} from "../../Api/ChatRooms.js";
import Avatar from "@mui/joy/Avatar";
import Typography from "@mui/joy/Typography";
import {convertFullDate} from "../../Components/Options.jsx";
import Button from "@mui/joy/Button";
import Chip from "@mui/joy/Chip";
import {AlertDiaLog} from "../../Dialogs/Alert.js";
import {useAuth} from "../../context/AuthContext.jsx";
import ModalDialog from "../../Components/ModalDialog.jsx";
import {CreateUser} from "./CreateUser.jsx";
import { FilterUser } from "./FilterUser.jsx";
import {Close,EditNote,Delete,Add} from '@mui/icons-material';


const BreadcrumbsPath = [{name: 'จัดการผู้ใช้'}, {name: 'รายละเอียด'}]

export default function Users() {
    const {user} = useAuth();
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState([]);
    const [selected, setSelected] = useState({});
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [openCreate, setOpenCreate] = useState(false);
    const [chatRooms, setChatRooms] = useState([]);

    const getUsers = async () => {
        setLoading(true);
        const {data, status} = await usersListApi();
        if (status === 200) {
            setUsers(data.users);
            setFilter(data.users);
        }
    };

    const getChatRooms = async () => {
        const {data, status} = await chatRoomListApi();
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
            icon: 'question',
            title: `ลบผู้ใช้`,
            text: `กด ตกลง เพื่อยันยันการลบผู้ใช้ ${name} ${empCode}`,
            onPassed: async (confirm) => {
                if (!confirm) return;
                const {data, status} = await deleteUserApi(empCode);
                AlertDiaLog({
                    icon: status === 200 && 'success',
                    title: data.message,
                    text: data.detail,
                    onPassed: (confirm) => {
                        confirm && getUsers().finally(() => setLoading(false));
                    }
                });
            }
        });
    };

    const refresh = () => {
        getUsers().finally(() => {
            getChatRooms().finally(() => setLoading(false));
        });
    };

    return (
        <>
            {open && <ModalDialog
                open={open} setOpen={setOpen} event={'user'}
                selected={selected} chatRooms={chatRooms} Refresh={refresh}
            />}
            <Sheet sx={ChatPageStyle.Layout}>
                <Box component="main" sx={ChatPageStyle.MainContent}>
                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                        <BreadcrumbsComponent list={BreadcrumbsPath}/>
                    </Box>
                    <Box sx={ChatPageStyle.BoxTable}>
                        <Typography level="h2" component="h1">จัดการผู้ใช้</Typography>
                        <Button color={!openCreate ? 'primary' : 'danger'} startDecorator={openCreate ? <Close/> : <Add/>} size='sm'
                                onClick={() => setOpenCreate(!openCreate)}>
                            {!openCreate ? 'เพิ่มผู้ใช้' : 'ยกเลิก'}
                        </Button>
                    </Box>
                    {openCreate && <CreateUser open={openCreate} setOpen={setOpenCreate} Refresh={refresh}/>}
                    <FilterUser setFilter={setFilter} users={users}/>
                    <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
                        <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
                            <thead>
                            <tr>
                                <th style={{width: 200}}>รหัสผู้ใช้</th>
                                <th style={{width: 200}}>ชื่อ</th>
                                <th style={{width: 200}}>คำอธิบาย</th>
                                <th style={{width: 200}}>สร้างเมื่อ</th>
                                <th style={{width: 200}}>จัดการ</th>
                            </tr>
                            </thead>
                            <tbody>
                            {!loading ? (
                                filter.length > 0 ? filter.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.empCode}</td>
                                        <td>
                                            <div style={{display: "flex", alignItems: "center"}}>
                                                <Avatar
                                                    size='sm' sx={{mr: 1}} src={item.avatar}
                                                    color='primary' variant='solid'
                                                />
                                                <Typography>{item.name} {item.real_name}</Typography>
                                            </div>
                                        </td>
                                        <td>
                                            {item.description}
                                        </td>
                                        <td>
                                            <Chip color='primary'>
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
                                                <EditNote/>
                                            </Button>
                                            <Button
                                                disabled={(user.empCode === item.empCode) || (item.role === 'BOT')}
                                                onClick={() => handleDelete(item.name, item.empCode)} size='sm'
                                                color='danger'>
                                                <Delete/>
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
                            )}
                            </tbody>
                        </Table>
                    </Sheet>
                </Box>
            </Sheet>
        </>
    )
}