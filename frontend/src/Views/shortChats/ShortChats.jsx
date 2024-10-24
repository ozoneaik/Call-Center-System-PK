import {ChatPageStyle} from "../../styles/ChatPageStyle.js";
import {Box, Button, CircularProgress, Grid, Sheet, Table} from "@mui/joy";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import {useEffect, useState} from "react";
import {shortChatApi, shortChatDeleteApi, storeOrUpdateChatCreateApi} from "../../Api/Messages.js";
import EditNoteIcon from '@mui/icons-material/EditNote';
import DeleteIcon from '@mui/icons-material/Delete';
import {AlertDiaLog} from "../../Dialogs/Alert.js";
import {FormSC} from "./FormSC.jsx";
import {Filter} from "./Filter.jsx";


const BreadcrumbsPath = [{name: 'จัดการข้อความส่งด่วน'}, {name: 'รายละเอียด'}];

export default function ShortChats() {
    const [shortChats, setShortChats] = useState([]);
    const [groups, setGroups] = useState([]);
    const [models, setModels] = useState([]);
    const [problems, setProblems] = useState([]);
    const [selected, setSelected] = useState({});
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        getShortChats().finally(() => setLoading(false));
    }, []);

    const getShortChats = async () => {
        setLoading(true);
        const {data, status} = await shortChatApi();
        console.log(data, status)
        if (status === 200) {
            setShortChats(data.test);
            setGroups(data.groups);
            setModels(data.models);
            setProblems(data.problems)
        } else console.log(status);
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

    const handleSubmit = (dataForm) => {
        AlertDiaLog({
            icon: 'question',
            title: 'ยืนยันการสร้าง/อัพเดทข้อมูล',
            text: 'กด ตกลง เพื่อยืนยัน',
            onPassed: async (confirm) => {
                if (confirm) {
                    const {data, status} = await storeOrUpdateChatCreateApi(dataForm);
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
                    <Grid xs={12} sm={3}>
                        <FormSC
                            selected={selected}
                            setSelected={setSelected}
                            Groups={groups}
                            Models={models}
                            Problems={problems}
                            onSubmit={(dataForm) => handleSubmit(dataForm)
                            }/>
                    </Grid>
                    {/* Chat Room List Table */}
                    <Grid xs={12} sm={9}>
                        <Filter Groups={groups}
                                Models={models}
                                Problems={problems}/>
                        <Sheet sx={[ChatPageStyle.Layout]}>
                            <Box component="main" sx={{
                                height: 'calc(100dvh - 190px)', flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                minWidth: 0,
                                gap: 1,
                            }}>
                                <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
                                    <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
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
                                                        <td style={{
                                                            width: 200,
                                                            overflow: "hidden",
                                                            display: "-webkit-box",
                                                            WebkitBoxOrient: "vertical",
                                                            WebkitLineClamp: 3,
                                                            textOverflow: "ellipsis",
                                                            height: "auto",
                                                        }}>{shortChat.content}</td>
                                                        <td>{shortChat.groups}</td>
                                                        <td>{shortChat.models}</td>
                                                        <td>{shortChat.problems}</td>
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
                                </Sheet>
                            </Box>
                        </Sheet>
                    </Grid>
                </Grid>
            </Box>
        </Sheet>
    );
}