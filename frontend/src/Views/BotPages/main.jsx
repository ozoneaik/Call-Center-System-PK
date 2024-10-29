import {ChatPageStyle} from "../../styles/ChatPageStyle.js";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import {Box, Card, CardActions, CardContent, CircularProgress, Sheet} from "@mui/joy";
import Typography from "@mui/joy/Typography";
import {useEffect, useState} from "react";
import {botListApi} from "../../Api/BotMenu.js";
import {FormCreateOrUpdateBot} from "./form.jsx";
import Grid from "@mui/material/Grid2";
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import Button from "@mui/joy/Button";

const BreadcrumbsPath = [{name: 'จัดการเมนูบอท'}, {name: 'รายละเอียด'}];
export default function BotPage() {
    const [loading, setLoading] = useState(true);
    const [bots, setBots] = useState([]);
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
    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <BreadcrumbsComponent list={BreadcrumbsPath}/>
                </Box>
                <Box sx={ChatPageStyle.BoxTable}>
                    <Typography level="h2" component="h1">จัดการเมนูบอท</Typography>
                </Box>
                {showForm && (
                    <Sheet variant="outlined" sx={[ChatPageStyle.BoxSheet, {border: "none"}]}>
                        <FormCreateOrUpdateBot
                            showForm={showForm} setShowForm={setShowForm}
                            setBots={setBots} chatRooms={chatRooms}
                            selected={selected} setSelected={setSelected}
                        />
                    </Sheet>
                )}
                <Sheet variant="outlined" sx={[ChatPageStyle.BoxSheet, {border: "none"}]}>
                    <Grid container spacing={2}>
                        {!loading ? bots.length > 0 && bots.map((bot, index) => (
                            <Grid size={{md: 6, lg: 3, xs: 12}} key={index}>
                                <Card variant="soft" invertedColors color='primary'>
                                    <CardContent orientation="horizontal">
                                        <CardContent>
                                            <Typography level="h5" fontWeight='bold'>
                                                <SupportAgentIcon/>&nbsp;{bot.description}
                                            </Typography>
                                            {bot.list.length > 0 ? bot.list.map((b, i) => (
                                                <Typography level="body-md" key={i}>
                                                    {i + 1}.&nbsp;{b.menuName}
                                                </Typography>
                                            )) : (
                                                <Typography level="body-sm">ไม่มีรายการ</Typography>
                                            )}

                                        </CardContent>
                                    </CardContent>
                                    <CardActions>
                                        <Button variant="solid" size="sm" onClick={() => {
                                            setSelected(bot);
                                            setShowForm(!showForm);
                                        }}>
                                            จัดการ
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        )) : (
                            <CircularProgress/>
                        )}
                    </Grid>
                </Sheet>
            </Box>
        </Sheet>
    )
}