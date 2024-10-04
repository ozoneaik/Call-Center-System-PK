import {ChatPageStyle} from "../styles/ChatPageStyle.js";
import {Box, Button, CircularProgress, FormControl, FormLabel, Grid, Input, Sheet, Table} from "@mui/joy";
import BreadcrumbsComponent from "../Components/Breadcrumbs.jsx";
import Typography from "@mui/joy/Typography";
import {useEffect, useState} from "react";
import {shortChatApi, shortChatDeleteApi, storeOrUpdateChatCreateApi} from "../Api/Messages.js";
import SaveIcon from '@mui/icons-material/Save';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DeleteIcon from '@mui/icons-material/Delete';
import {AlertDiaLog} from "../Dialogs/Alert.js";


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

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(selected)
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
                            }else console.log('status is not 200')
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
                    <Grid xs={12} sm={4}>
                        <Box sx={{bgcolor: 'background.surface', borderRadius: 'sm'}}>
                            <Box sx={ChatPageStyle.BoxTable}>
                                <Typography level="h2" component="h1">เพิ่ม/แก้ไขข้อความส่งด่วน</Typography>
                            </Box>
                            <form onSubmit={handleSubmit}>
                                <FormControl sx={{mb: 2}}>
                                    <FormLabel>ข้อความส่งด่วน</FormLabel>
                                    <Input
                                        onChange={(e) => setSelected(prevState => ({
                                            ...prevState, content: e.target.value
                                        }))}
                                        value={selected.content || ''} type="text"
                                        placeholder="ex.มีอะไรให้ช่วยมั้ยครับ ?"
                                    />
                                </FormControl>
                                <Box sx={{display: 'flex', gap: 1}}>
                                    <Button
                                        color='warning' disabled={!selected.content}
                                        onClick={() => setSelected({})}
                                    >
                                        ล้าง
                                    </Button>
                                    <Button
                                        disabled={!selected.content} type="submit"
                                        startDecorator={<SaveIcon/>}
                                    >
                                        {!selected.id ? 'บันทึก' : 'อัพเดท'}
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
                                    <th style={{width: 100}}>อันดับ</th>
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