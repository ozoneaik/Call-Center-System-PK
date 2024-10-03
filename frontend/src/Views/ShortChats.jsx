import {ChatPageStyle} from "../styles/ChatPageStyle.js";
import {Box, Button, CircularProgress, FormControl, FormLabel, Grid, Input, Sheet, Table} from "@mui/joy";
import BreadcrumbsComponent from "../Components/Breadcrumbs.jsx";
import Typography from "@mui/joy/Typography";
import {useEffect, useState} from "react";
import {shortChatApi} from "../Api/Messages.js";
import SaveIcon from '@mui/icons-material/Save';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DeleteIcon from '@mui/icons-material/Delete';


const BreadcrumbsPath = [{name: 'จัดการข้อความส่งด่วน'}, {name: 'รายละเอียด'}];

export default function ShortChats() {
    const [shortChats, setShortChats] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        setLoading(true);
        const getShortChats = async () => {
            const {data, status} = await shortChatApi();
            console.log(data, status)
            if (status === 200) {
                setShortChats(data.list);
            }
        }
        getShortChats().finally(() => setLoading(false));
    }, [])
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
                                <Typography level="h2" component="h1">เพิ่ม/แก้ไขข้อความส่งด่วน</Typography>
                            </Box>
                            <form>
                                <FormControl sx={{mb: 2}}>
                                    <FormLabel>ข้อความส่งด่วน</FormLabel>
                                    <Input type="text" placeholder="ex.มีอะไรให้ช่วยมั้ยครับ ?"/>
                                </FormControl>
                                <Button type="submit" startDecorator={<SaveIcon/>}>บันทึก</Button>
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
                                    <th>อันดับ</th>
                                    <th>ชื่อ</th>
                                    <th>จัดการ</th>
                                </tr>
                                </thead>
                                <tbody>
                                {
                                    !loading ? (
                                        shortChats.length > 0 && (
                                            shortChats.map((shortChat, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>{shortChat.content}</td>
                                                    <td>
                                                        <Button sx={{mr: 1}} size='sm'>
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