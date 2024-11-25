import { Box, Button, Card, Divider, Grid, Input, Sheet, Stack, Table, Typography } from "@mui/joy";
import { ChatPageStyle } from "../../styles/ChatPageStyle";
import { Grid2 } from "@mui/material";
import { RateList } from "./FirstCom/RateList";
import { ActiveList } from "./FirstCom/ActiveList";
import { useNavigate } from "react-router-dom";
import { TableFirst } from "./FirstCom/TableFirst";
import { listLineApi } from "../../Api/Report";
import { useState } from "react";
import { AlertDiaLog } from "../../Dialogs/Alert";
import { P } from "./ChartCom/P,";
import FullReport from "./FullReport/FullReport";

export default function ReportPage() {
    const navigate = useNavigate();
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [lineList, setLineList] = useState([]);
    const [rateList, setRateList] = useState([]);
    const [activeList, setActiveList] = useState([]);
    const handleSearch = async () => {
        const { data, status } = await listLineApi({ startTime, endTime });
        console.log('liseLine', data, status);
        if (status === 200) {
            setLineList(data.lineList);
            setRateList([]);
            setActiveList([]);
        } else {
            AlertDiaLog({
                title: data.message,
                text: data.detail,
                onPassed: (confirm) => console.log(confirm)
            });
        }
    }
    return (
        <Sheet sx={[ChatPageStyle.Layout, { height: '100dvh' }]}>
            <Box component="main" mx={1}>
                <Box sx={ChatPageStyle.BoxTable} mt={2}>
                    <Stack flexDirection='row' gap={1} alignItems='center'>
                        <Button onClick={() => navigate(-1)} size="sm">
                            {'<'}
                        </Button>
                        <Typography level="h2" component="h1">รายงาน</Typography>
                    </Stack>
                    <Stack flexDirection='row' gap={1} alignItems='center'>
                        <Input type='date' onChange={(e) => setStartTime(e.target.value)} />
                        <Typography>ถึง</Typography>
                        <Input type='date' onChange={(e) => setEndTime(e.target.value)} />
                        <Button onClick={handleSearch}>ตกลง</Button>
                    </Stack>
                </Box>
                <Sheet variant="outlined" sx={[ChatPageStyle.BoxSheet, { border: "none" }]}>
                    <Typography level="h3" mb={2} sx={{ color: '#f95a1d' }}>
                        ดูรายงานแบบเฉพาะเจาะจง&nbsp;
                        <Typography level="body-sm">({startTime} - {endTime})</Typography>
                    </Typography>
                    {lineList.length === 0 && (
                        <Typography sx={{ color: '#f95a1d' }}>
                            รายงานจะแสดงหลังเลือกช่วงเวลาแล้วกดตกลง
                        </Typography>
                    )}
                    <Grid2 container spacing={2} mb={2}>
                        <Grid2 size={4} maxHeight={400} sx={{ overflow: 'auto' }}>
                            {lineList.length > 0 && (
                                <TableFirst
                                    lineList={lineList}
                                    startTime={startTime}
                                    endTime={endTime}
                                    setRateList={setRateList}
                                    setActiveList={setActiveList}
                                />
                            )}
                        </Grid2>
                        <Grid2 size={8} maxHeight={400} sx={{ overflow: 'auto' }}>
                            {rateList.length > 0 && (
                                <RateList rateList={rateList} setActiveList={setActiveList} />
                            )}
                        </Grid2>
                        <Grid2 size={12} maxHeight={400} sx={{ overflow: 'auto' }}>
                            {activeList && activeList.List && activeList.List.length > 0 && (
                                <ActiveList activeList={activeList} />
                            )}
                        </Grid2>
                        <Grid2 size={12}>
                            <Divider />
                        </Grid2>
                    </Grid2>

                    {/* <Typography level="h3" mb={2} sx={{ color: '#f95a1d' }}>
                        ดูรายงานแบบเต็ม&nbsp;
                        <Typography level="body-sm">({startTime} - {endTime})</Typography>
                    </Typography>
                    {startTime && endTime ? (
                        <Grid2 container spacing={2}>
                            <Grid2 size={12}>
                                <FullReport />
                            </Grid2>
                        </Grid2>

                    ) : (
                        <Typography sx={{ color: '#f95a1d' }}>
                            รายงานแบบเต็มจะแสดงหลังเลือกช่วงเวลาแล้วกดตกลง
                        </Typography>
                    )} */}
                </Sheet>
            </Box>
        </Sheet>
    )
}