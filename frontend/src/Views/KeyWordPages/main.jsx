import { useEffect, useState } from "react"
import { createKeywordApi, deleteKeywordApi, KeywordListApi, updateKeywordApi } from "../../Api/Keyword";
import { Box, Button, Card, Input, Select, Sheet, Option, Typography, Stack, Checkbox } from "@mui/joy";
import { ChatPageStyle } from "../../styles/ChatPageStyle";
import BreadcrumbsComponent from "../../components/Breadcrumbs";
import { Grid2 } from "@mui/material";
import { AlertDiaLog } from "../../Dialogs/Alert";
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import { ModalUpdateKeyword } from "./ModalUpdateKeyword";

const BreadcrumbsPath = [{ name: 'จัดการ Keyword' }, { name: 'รายละเอียด' }];

export default function KeyWordPage() {
    const [openModal, setOpenModal] = useState(false);
    const [keyword, setKeyWord] = useState([]);
    const [newKeyword, setNewKeyword] = useState({
        id: null,
        name: null,
        redirectTo: null,
        event: false
    });
    const [chatRooms, setChatRooms] = useState([]);
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data, status } = await KeywordListApi();
        console.log(data)
        if (status === 200) {
            setKeyWord(data.keywords);
            setChatRooms(data.chatRooms);
        }
    }

    const createKeyword = async () => {
        const { data, status } = await createKeywordApi({ keyword: newKeyword });
        AlertDiaLog({
            title: status === 200 ? 'สำเร็จ' : 'ไม่สำเร็จ',
            text: data.message,
            icon: status === 200 ? 'success' : 'error',
            onPassed: () => {
                if (status === 200) {
                    setKeyWord([...keyword, data.keyword]);
                    setNewKeyword({ name: null, redirectTo: null,event : false });
                }
            }
        })
    }

    const updateKeyword = async () => {
        console.log(newKeyword);
        const { data, status } = await updateKeywordApi({ keyword: newKeyword, keywordId: newKeyword.id });
        setOpenModal(false);
        status === 200 && setKeyWord(keyword.map(item => item.id === newKeyword.id ? data.keyword : item))
    }

    const deleteKeyword = ({ id }) => {
        AlertDiaLog({
            icon: 'question',
            title: 'ยืนยันการลบ',
            text: 'คุณต้องการลบ Keyword นี้ใช่หรือไม่',
            onPassed: async (confirm) => {
                if (confirm) {
                    const { data, status } = await deleteKeywordApi({ keywordId: id });
                    AlertDiaLog({
                        title: status === 200 ? 'สำเร็จ' : 'ไม่สำเร็จ',
                        text: data.message,
                        icon: status === 200 ? 'success' : 'error',
                        onPassed: () => status === 200 && setKeyWord(keyword.filter(item => item.id !== id))
                    });
                }
            }
        });
    }

    return (
        <Sheet sx={ChatPageStyle.Layout}>
            {
                openModal && <ModalUpdateKeyword
                    open={openModal}
                    setNewKeyword={setNewKeyword}
                    setOpen={setOpenModal}
                    newKeyword={newKeyword}
                    chatRooms={chatRooms}
                    onCLick={() => updateKeyword()}
                />
            }
            <Box sx={ChatPageStyle.MainContent}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                </Box>
                <Grid2 container spacing={2}>
                    <Grid2 size={{ xs: 12, md: 3 }}>
                        <Input placeholder="keyword" onChange={(e) => {
                            setNewKeyword({
                                name: e.target.value,
                                redirectTo: newKeyword.redirectTo,
                                event: newKeyword.event
                            })
                        }} />
                        <Checkbox sx={{ mt: 1 }} label='สำหรับเคสที่ปิดการจบสนทนาไปแล้ว (ex.ขอบคุณ)' checked={newKeyword.event} onChange={(e) => {
                            setNewKeyword({
                                name: newKeyword.name,
                                redirectTo: newKeyword.redirectTo,
                                event: e.target.checked
                            })
                        }} />
                    </Grid2>
                    {!newKeyword.event && (
                        <Grid2 size={{ xs: 12, md: 3 }}>
                            <Select onChange={(e, newValue) => {
                                setNewKeyword({
                                    name: newKeyword.name,
                                    redirectTo: newValue,
                                    event: newKeyword.event
                                })
                            }}>
                                {chatRooms.map((item, index) => (
                                    <Option key={index} value={item.roomId}>{item.roomName}</Option>
                                ))}
                            </Select>
                        </Grid2>
                    )}

                    <Grid2 size={{ xs: 12, md: 3 }}>
                        <Button onClick={() => createKeyword()} disabled={!newKeyword.name}>
                            บันทึก
                        </Button>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 12 }}>

                    </Grid2>
                    <Grid2 size={12}>
                        รายการ
                    </Grid2>
                    {keyword.map((item, index) => (
                        <Grid2 size={{ xs: 12, md: 4, sm: 6, lg: 3 }} key={index}>
                            <Card variant="soft" color="primary">
                                <Typography color="primary" level="h3">
                                    {item.name}&nbsp;
                                    <Typography color="primary" level="body-xs">
                                        (รหัสอ้างอิง : {item.id})
                                    </Typography>
                                </Typography>
                                {item.event ? (
                                    <Typography color="primary" level="body-sm">
                                        {
                                            item.event ? 'สำหรับเคสที่ปิดการจบสนทนาไปแล้ว' : 'สำหรับเคสที่ยังไม่ปิดการจบสนทนา'
                                        }
                                    </Typography>
                                ) : (
                                    <Typography color="primary" level="body-sm">
                                        ส่งไปยังห้อง {'===>'} {item.roomName ? item.roomName : item.redirectTo}
                                    </Typography>
                                )
                                }

                                <Stack direction={{ lg: 'row', sm: 'column', xs: 'column' }} spacing={1}>
                                    <Button color="warning" fullWidth size='sm' onClick={() => {
                                        setNewKeyword({ id: item.id, name: item.name, redirectTo: item.redirectTo })
                                        setOpenModal(true)
                                    }}>
                                        แก้ไข {item.event}
                                    </Button>
                                    <Button color="danger" fullWidth size='sm' onClick={() => deleteKeyword({ id: item.id })}>
                                        <DeleteIcon />
                                    </Button>
                                </Stack>
                            </Card>
                        </Grid2>
                    ))}
                </Grid2>
            </Box>
        </Sheet>
    )
}