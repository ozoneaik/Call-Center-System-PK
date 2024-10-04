import {ChatPageStyle} from "../styles/ChatPageStyle.js";
import {Box, Button, CircularProgress, FormControl, FormLabel, Grid, Input, Sheet, Table} from "@mui/joy";
import BreadcrumbsComponent from "../Components/Breadcrumbs.jsx";
import Typography from "@mui/joy/Typography";
import {useEffect, useState} from "react";
import {chatRoomListApi, deleteChatRoomsApi, storeOrUpdateChatRoomsApi} from "../Api/Messages.js";
import SaveIcon from '@mui/icons-material/Save';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DeleteIcon from "@mui/icons-material/Delete";
import {AlertDiaLog} from "../Dialogs/Alert.js";


const BreadcrumbsPath = [{name: 'จัดการห้องแชท'}, {name: 'รายละเอียด'}];

export default function ChatRooms() {
    const [chatRooms, setChatRooms] = useState([]);
    const [selected, setSelected] = useState({});
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        getChatRooms().finally(() => setLoading(false));
    }, []);

    const getChatRooms = async () => {
        setLoading(true);
        const {data, status} = await chatRoomListApi();
        console.log(data, status)
        status === 200 && setChatRooms(data.chatRooms);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        AlertDiaLog({
            icon: 'question',
            title: 'ยืนยันการสร้าง/อัพเดทข้อมูล',
            text: 'กด ตกลง เพื่อยืนยัน',
            onPassed: async (confirm) => {
                if (confirm) {
                    const {data, status} = await storeOrUpdateChatRoomsApi(selected);
                    AlertDiaLog({
                        icon: status === 200 && 'success',
                        title: data.message,
                        text: data.detail,
                        onPassed: () => {
                            if (status === 200) {
                                setSelected({});
                                getChatRooms().finally(() => setLoading(false));
                            } else console.log('ไม่มีการ refresh ข้อมูล');
                        }
                    });
                } else console.log('ยกเลิกการสร้าง/อัพเดท');
            }
        });
    }

    const handleDelete = (roomId) => {
        AlertDiaLog({
            icon: 'question',
            title: 'ลบ',
            text: 'กด ตกลง เพื่อยืนยัน',
            onPassed: async (confirm) => {
                if (confirm) {
                    const {data, status} = await deleteChatRoomsApi(roomId);
                    AlertDiaLog({
                        icon: status === 200 && 'success',
                        title: data.message,
                        text: data.detail,
                        onPassed: () => {
                            if (status === 200) {
                                setSelected({});
                                getChatRooms().finally(() => setLoading(false));
                            } else console.log('ไม่มีการ refresh ข้อมูล');
                        }
                    });
                } else console.log('ยกเลิกการสร้าง/อัพเดท');
            }
        });
    }
    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <BreadcrumbsComponent list={BreadcrumbsPath}/>
                </Box>
                <Grid container spacing={2}>

                    {/* Add/Edit Form */}
                    <Grid xs={12} sm={4}>
                        <Box sx={{bgcolor: 'background.surface', borderRadius: 'sm'}}>
                            <Box sx={ChatPageStyle.BoxTable}>
                                <Typography level="h2" component="h1">เพิ่ม/แก้ไขห้องแชท</Typography>
                            </Box>
                            <form onSubmit={handleSubmit}>
                                {
                                    selected.roomId && (
                                        <>
                                            <FormControl sx={{mb: 2}}>
                                                <FormLabel>รหัสห้อง</FormLabel>
                                                <Input
                                                    onChange={(e) => setSelected(prevState => ({
                                                        ...prevState, roomName: e.target.value
                                                    }))}
                                                    disabled
                                                    value={selected.roomId || ''}
                                                    type="text" placeholder="ex.ห้องประสานงาน"
                                                />
                                            </FormControl>
                                        </>
                                    )
                                }
                                <FormControl sx={{mb: 2}}>
                                    <FormLabel>ชื่อห้อง</FormLabel>
                                    <Input
                                        onChange={(e) => setSelected(prevState => ({
                                            ...prevState,
                                            roomName: e.target.value
                                        }))}
                                        value={selected.roomName || ''}
                                        type="text" placeholder="ex.ห้องประสานงาน"
                                    />
                                </FormControl>
                                <Box sx={{display: 'flex', gap: 1}}>
                                    <Button
                                        color='warning'
                                        disabled={!selected.roomName}
                                        onClick={() => setSelected({})}
                                    >
                                        ล้าง
                                    </Button>
                                    <Button
                                        disabled={!selected.roomName}
                                        type="submit" startDecorator={<SaveIcon/>}>
                                        {selected.roomId ? 'อัพเดท' : 'สร้าง'}
                                    </Button>
                                </Box>
                            </form>
                        </Box>
                    </Grid>

                    {/* Chat Room List Table */}
                    <Grid xs={12} sm={8}>
                        <Box sx={{bgcolor: 'background.surface', borderRadius: 'sm'}}>
                            <Box sx={ChatPageStyle.BoxTable}>
                                <Typography level="h2" component="h1">รายการ</Typography>
                            </Box>
                            <Table aria-label="chat room list">
                                <thead>
                                <tr>
                                    <th>ไอดีห้อง</th>
                                    <th>ชื่อห้อง</th>
                                    <th>จัดการ</th>
                                </tr>
                                </thead>
                                <tbody>
                                {
                                    !loading ? (
                                        chatRooms.length > 0 && (
                                            chatRooms.map((chatRoom, index) => (
                                                <tr key={index}>
                                                    <td>{chatRoom.roomId}</td>
                                                    <td>{chatRoom.roomName}</td>
                                                    <td>
                                                        <Box sx={{display: 'flex', gap: 1}}>
                                                            <Button size='sm' onClick={() => setSelected(chatRoom)}>
                                                                <EditNoteIcon/>
                                                            </Button>
                                                            <Button size='sm' color='danger'
                                                                    onClick={() => handleDelete(chatRoom.roomId)}>
                                                                <DeleteIcon/>
                                                            </Button>
                                                        </Box>
                                                    </td>
                                                </tr>
                                            ))
                                        )
                                    ) : (
                                        <tr>
                                            <td colSpan={3} style={{textAlign: "center"}}>
                                                <CircularProgress color="primary" size="md"/>
                                            </td>
                                        </tr>
                                    )
                                }
                                </tbody>
                            </Table>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </Sheet>
    );
}