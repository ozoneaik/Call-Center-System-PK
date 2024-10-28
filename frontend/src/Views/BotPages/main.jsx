import {ChatPageStyle} from "../../styles/ChatPageStyle.js";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import {Box, Card, CircularProgress, Sheet, Table} from "@mui/joy";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import {useEffect, useState} from "react";
import {botListApi, deleteBotApi} from "../../Api/BotMenu.js";
import {convertFullDate} from "../../Components/Options.jsx";
import {AlertDiaLog} from "../../Dialogs/Alert.js";
import {FormCreateOrUpdateBot} from "./form.jsx";
import Grid from "@mui/material/Grid2";
import IconButton from "@mui/joy/IconButton";

const BreadcrumbsPath = [{name: 'จัดการเมนูบอท'}, {name: 'รายละเอียด'}];
export default function BotPage() {
    const [loading, setLoading] = useState(true);
    const [bots, setBots] = useState([{menuName: '', roomId: ''}]);
    const [chatRooms, setChatRooms] = useState([]);
    const [selected, setSelected] = useState(null);
    const [showForm, setShowForm] = useState(false);
    useEffect(() => {
        fetchData().finally(() => setLoading(false))
    }, []);

    const fetchData = async () => {
        const {data, status} = await botListApi();
        status === 200 ? setBots(data.list) : setBots([]);
        status === 200 ? setChatRooms(data.chatRooms) : setChatRooms([]);
    }

    const Delete = (id) => {
        AlertDiaLog({
            icon: 'question',
            title: 'ลบเมนู Bot',
            text: `คุณต้องการลบเมนูบอทหรือไม่ (รหัสอ้างอิง BOT_ID_${id})`,
            onPassed: async (confirm) => {
                if (confirm) {
                    const {data, status} = await deleteBotApi(id);
                    AlertDiaLog({
                        icon: status === 200 && 'success',
                        title: data.message,
                        text: data.detail,
                    })
                    if (status === 200) {
                        setBots((prevBots) => prevBots.filter((bot) => bot.id !== data.botMenu.id));
                    } else console.log('ไม่สามารถลบ bot ได้');
                } else console.log('ยกเลิกการลบ bot');
            }
        })
    }
    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <BreadcrumbsComponent list={BreadcrumbsPath}/>
                </Box>
                <Box sx={ChatPageStyle.BoxTable}>
                    <Typography level="h2" component="h1">จัดการเมนูบอท</Typography>
                    <Button size='sm' color={showForm ? 'danger' : 'primary'} onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'x' : '+ เพิ่มเมนูบอท'}
                    </Button>
                </Box>
                {showForm && (
                    <Sheet variant="outlined" sx={[ChatPageStyle.BoxSheet, {border: "none"}]}>
                        <FormCreateOrUpdateBot
                            setBots={setBots}
                            selected={selected}
                            setSelected={setSelected}
                            chatRooms={chatRooms}
                        />
                    </Sheet>
                )}
                <Sheet variant="outlined" sx={[ChatPageStyle.BoxSheet,{border : "none"}]}>
                    <Grid container spacing={2}>
                        {bots.length > 0 && bots.map((bot, index) => (
                            <Grid size={{xs: 12, md: 3}} key={index}>
                                <Card variant="outlined">
                                    <div>
                                        <Typography level="title-lg">{bot.botTokenId}</Typography>
                                        <Typography level="body-sm">April 24 to May 02, 2021</Typography>
                                        <IconButton
                                            aria-label="bookmark Bahamas Islands"
                                            variant="plain"
                                            color="neutral"
                                            size="sm"
                                            sx={{position: 'absolute', top: '0.875rem', right: '0.5rem'}}
                                        >
                                            +
                                        </IconButton>
                                    </div>
                                </Card>
                            </Grid>
                        ))}


                    </Grid>
                    {/*<Table stickyHeader hoverRow sx={ChatPageStyle.Table}>*/}
                    {/*    <thead>*/}
                    {/*    <tr>*/}
                    {/*        <th>ลำดับ</th>*/}
                    {/*        <th>ชื่อเมนู</th>*/}
                    {/*        <th>ส่งไปยังห้อง</th>*/}
                    {/*        <th>สร้างเมื่อ</th>*/}
                    {/*        <th>อัพเดทเมื่อ</th>*/}
                    {/*        <th>จัดการ</th>*/}
                    {/*    </tr>*/}
                    {/*    </thead>*/}
                    {/*    <tbody>*/}
                    {/*    {!loading ? bots.length > 0 && bots.map((bot, index) => (*/}
                    {/*        <tr key={index}>*/}
                    {/*            <td>{index + 1}</td>*/}
                    {/*            <td>{bot.menuName}</td>*/}
                    {/*            <td>{bot.roomName}</td>*/}
                    {/*            <td>{convertFullDate(bot.created_at)}</td>*/}
                    {/*            <td>{convertFullDate(bot.updated_at)}</td>*/}
                    {/*            <td>*/}
                    {/*                <Box sx={{display: 'flex', gap: 1}}>*/}
                    {/*                    <Button size='sm' onClick={() => {*/}
                    {/*                        setSelected(bot);*/}
                    {/*                        setShowForm(true)*/}
                    {/*                    }}*/}
                    {/*                            disabled={bot.roomId === 'ROOM00'}>*/}
                    {/*                        จัดการ*/}
                    {/*                    </Button>*/}
                    {/*                    <Button color='danger' size='sm' onClick={() => Delete(bot.id)}*/}
                    {/*                            disabled={bot.roomId === 'ROOM00'}>*/}
                    {/*                        ลบ*/}
                    {/*                    </Button>*/}
                    {/*                </Box>*/}
                    {/*            </td>*/}
                    {/*        </tr>*/}
                    {/*    )) : (*/}
                    {/*        <tr>*/}
                    {/*            <td colSpan={6}>*/}
                    {/*                <CircularProgress/>*/}
                    {/*            </td>*/}
                    {/*        </tr>*/}
                    {/*    )}*/}
                    {/*    </tbody>*/}
                    {/*</Table>*/}
                </Sheet>
            </Box>
        </Sheet>
    )
}