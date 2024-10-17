import {ChatPageStyle} from "../../styles/ChatPageStyle.js";
import {Box, Button, CircularProgress, Grid, Sheet, Table} from "@mui/joy";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import Typography from "@mui/joy/Typography";
import {useEffect, useState} from "react";
import {shortChatApi, shortChatDeleteApi, storeOrUpdateChatCreateApi} from "../../Api/Messages.js";
import EditNoteIcon from '@mui/icons-material/EditNote';
import DeleteIcon from '@mui/icons-material/Delete';
import {AlertDiaLog} from "../../Dialogs/Alert.js";
import {FormSC} from "./FormSC.jsx";


const BreadcrumbsPath = [{name: 'จัดการข้อความส่งด่วน'}, {name: 'รายละเอียด'}];

export default function ShortChats() {
    const [shortChats, setShortChats] = useState([]);
    const [selected, setSelected] = useState({});
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        getShortChats().finally(() => setLoading(false));
    }, []);

    const getShortChats = async () => {
        setLoading(true);
        const {data, status} = await shortChatApi();
        console.log(data, status)
        status === 200 && setShortChats(data.list);
    }

    const clickEdit = (select) => {
        setSelected(select);
    }

    const handleDelete = (id) => {
        AlertDiaLog({
            icon: 'question',
            title: 'ลบข้อมูล',
            text: 'กด ตกลง เพื่อยืนยันการลบ',
            onPassed: async (confirm) => {
                if (confirm) {
                    const {data, status} = await shortChatDeleteApi(id);
                    AlertDiaLog({
                        icon: status === 200 && 'success',
                        title: data.message,
                        text: data.detail,
                        onPassed: (confirm) => {
                            confirm && getShortChats().finally(() => setLoading(false));
                        }
                    });
                } else console.log('ยกเลิกการลบ');
            }
        });
    }

    const handleSubmit = () => {
        AlertDiaLog({
            icon: 'question',
            title: 'ยืนยันการสร้าง/อัพเดทข้อมูล',
            text: 'กด ตกลง เพื่อยืนยัน',
            onPassed: async (confirm) => {
                if (confirm) {
                    const {data, status} = await storeOrUpdateChatCreateApi(selected);
                    AlertDiaLog({
                        icon: status === 200 && 'success',
                        title: data.message,
                        text: data.detail,
                        onPassed: () => {
                            if (status === 200) {
                                getShortChats().finally(() => setLoading(false));
                                setSelected({})
                            } else console.log('status is not 200')
                        }
                    });
                } else console.log('ยกเลิกการสร้าง');
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
                    <FormSC selected={selected} setSelected={setSelected} onSubmit={() => handleSubmit()}/>

                    {/* Chat Room List Table */}
                    <Grid xs={12} sm={8}>
                        <Box sx={{bgcolor: 'background.surface', borderRadius: 'sm'}}>
                            <Box sx={ChatPageStyle.BoxTable}>
                                <Typography level="h2" component="h1">รายการ</Typography>
                            </Box>
                            <Table aria-label="chat room list">
                                <thead>
                                <tr>
                                    <th style={{width: 100}}>อันดับ</th>
                                    <th>ชื่อ</th>
                                    <th>หมดหมู่</th>
                                    <th>รุ่น</th>
                                    <th>ปัญหา</th>
                                    <th>จัดการ</th>
                                </tr>
                                </thead>
                                <tbody>
                                {!loading ? (
                                    shortChats.length > 0 && (
                                        shortChats.map((shortChat, index) => (
                                            <tr key={index}>
                                                <td>{index + 1}</td>
                                                <td>{shortChat.content}</td>
                                                <td>{shortChat.group}</td>
                                                <td>{shortChat.model}</td>
                                                <td>{shortChat.problem}</td>
                                                <td>
                                                    <Box sx={{display: 'flex', gap: 1}}>
                                                        <Button size='sm' onClick={() => clickEdit(shortChat)}>
                                                            <EditNoteIcon/>
                                                        </Button>
                                                        <Button size='sm' color='danger'
                                                                onClick={() => handleDelete(shortChat.id)}>
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
                                )}
                                </tbody>
                            </Table>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </Sheet>
    );
}