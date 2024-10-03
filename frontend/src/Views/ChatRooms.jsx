import { ChatPageStyle } from "../styles/ChatPageStyle.js";
import {Sheet, Box, Grid, Table, Button, FormControl, FormLabel, Input, CircularProgress} from "@mui/joy";
import BreadcrumbsComponent from "../Components/Breadcrumbs.jsx";
import Typography from "@mui/joy/Typography";
import {useEffect, useState} from "react";
import {chatRoomListApi} from "../Api/Messages.js";
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SaveIcon from '@mui/icons-material/Save';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DeleteIcon from "@mui/icons-material/Delete";


const BreadcrumbsPath = [{ name: 'จัดการห้องแชท' }, { name: 'รายละเอียด' }];

export default function ChatRooms() {
    const [chatRooms, setChatRooms] = useState([]);
    const [latestId, setLatestId] = useState(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        setLoading(true);
        const getChatRooms = async () => {
            const {data,status} = await chatRoomListApi();
            console.log(data,status)
            if (status === 200 ){
                setChatRooms(data.chatRooms);
                let index = data.chatRooms.length;
                console.log(data.chatRooms[index-1].roomId);
                setLatestId(data.chatRooms[index-1].roomId);
            }
        }
        getChatRooms().finally(()=>setLoading(false));
    },[])

    const generateRoomId = () => {
        let numberPart = parseInt(latestId.replace("ROOM", "")) + 1;
        let newRoomId = "ROOM" + numberPart.toString().padStart(2, "0");
        setLatestId(newRoomId);
    };
    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{ display: 'flex', alignItems: 'center'}}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                </Box>
                <Grid container spacing={2}>

                    {/* Add/Edit Form */}
                    <Grid xs={12} sm={4}>
                        <Box sx={{ bgcolor: 'background.surface', borderRadius: 'sm' }}>
                            <Box sx={ChatPageStyle.BoxTable}>
                                <Typography level="h2" component="h1">เพิ่ม/แก้ไขห้องแชท</Typography>
                            </Box>
                            <form>
                                <FormControl sx={{ mb: 2 }}>
                                    <FormLabel>ไอดีห้อง</FormLabel>
                                    <Input
                                        readOnly
                                        defaultValue={latestId}
                                        placeholder="กดปุ่ม generate เพื่อสร้างไอดี"
                                        endDecorator={<Button onClick={()=>generateRoomId()}><AutoFixHighIcon/></Button>}
                                    />
                                </FormControl>
                                <FormControl sx={{ mb: 2 }}>
                                    <FormLabel>ชื่อห้อง</FormLabel>
                                    <Input type="text" placeholder="ex.ห้องประสานงาน" />
                                </FormControl>
                                <Button type="submit" startDecorator={<SaveIcon/>}>บันทึก</Button>
                            </form>
                        </Box>
                    </Grid>

                    {/* Chat Room List Table */}
                    <Grid xs={12} sm={8}>
                        <Box sx={{ bgcolor: 'background.surface', borderRadius: 'sm' }}>
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
                                                        <Button size='sm' sx={{mr:1}}>
                                                            <EditNoteIcon/>
                                                        </Button>
                                                        <Button size='sm' color='danger'>
                                                            <DeleteIcon/>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )
                                    ) : (
                                        <tr>
                                            <td colSpan={3} style={{textAlign: "center" }}>
                                                <CircularProgress color="primary" size="md" />
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