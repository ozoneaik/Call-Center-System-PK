import React, {useEffect, useState} from 'react';
import {Box, Card, CardContent, Sheet, Typography} from '@mui/joy';
import Grid from '@mui/material/Grid2';
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip
} from 'chart.js';
import {ChatPageStyle} from "../../styles/ChatPageStyle.js";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import {DashboardApi} from "../../Api/Messages.js";
import {BarChart, StatCard} from "../../Components/Charts.jsx";
import Input from "@mui/joy/Input";
import Chip from "@mui/joy/Chip";
import {getRandomColor} from "../../Components/Options.jsx";
import Button from "@mui/joy/Button";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
ChartJS.register(ArcElement, Tooltip, Legend);

const BreadcrumbsPath = [{name: 'หน้าหลัก'}, {name: 'รายละเอียด'}];

const randomColor = ({count}) => {
    const colors = ['#FFD700', '#FFB6C1', '#98FB98', '#FFA07A', '#87CEFA', '#DDA0DD', '#FF6347']
    return Array.from({length: count}, () => colors[Math.floor(Math.random() * colors.length)]);
}

export default function Dashboard() {
    const [chatData, setChatData] = useState({
        labels: ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'],
        datasets: [{
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: ['#FFD700', '#FFB6C1', '#98FB98', '#FFA07A', '#87CEFA', '#DDA0DD', '#FF6347'],
        }]
    });
    const [stars, setStars] = useState([]);
    const [contChats, setContChats] = useState([]);
    const [customers, setCustomers] = useState({newCust: 0, totalToday: 0,});
    const [currentDate, setCurrentDate] = useState('');
    const getData = async (today) => {
        try {
            const Today = today || new Date().toISOString().split('T')[0];
            const {data, status} = await DashboardApi(Today); // เรียก API
            if (status === 200) {
                const apiData = data.sevenDaysAgo; // ข้อมูลจาก API
                // จัดการข้อมูลสำหรับแชท
                const chatCounts = apiData.map(item => item.content_count).reverse();
                const labels = apiData.map(item => item.date).reverse();
                setChatData(prevData => ({
                    ...prevData,
                    labels: labels,
                    datasets: [{...prevData.datasets[0], data: chatCounts}],
                }));
                // จัดการข้อมูลสำหรับลูกค้า
                setCustomers({
                    newCust: data.customers.newCust,
                    totalToday: data.customers.totalToday,
                });
                // จัดการข้อมูลสำหรับดาว
                setStars(data.stars)
                // จัดการข้อมูลสำหรับแชท
                const newChatData = data.chatCounts.rooms.map(room => ({
                    labels: [room.roomName],
                    datasets: [{
                        label: room.roomName,
                        data: [room.total_chats, data.chatCounts.total],
                        backgroundColor: [...randomColor({count: 1}), 'gray']
                    }],
                    count: room.total_chats,
                    total: data.chatCounts.total,
                }));
                setContChats(newChatData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setCurrentDate(today); // เซ็ตค่า currentDate
        getData().finally(() => console.log('hello'));
    }, []);

    const handleChange = (e) => {
        let value = e.target.value;
        value = new Date(value)
        const today = value.toISOString().split('T')[0];
        setCurrentDate(today);
        getData(today).finally(() => console.log('hello'));
    }

    const CardCom = ({title, children}) => (
        <Card variant="outlined" sx={{height: '100%'}}>
            <CardContent sx={{display: 'flex', flexDirection: 'column', height: '100%', position: 'relative'}}>
                <Typography textColor="text.secondary">
                    {title}
                </Typography>
                {children}
            </CardContent>
        </Card>
    );

    const D = ({children, title}) => (
        <Box sx={{flexGrow: 1}}>
            <Grid container spacing={2}>
                <Grid size={12}>
                    <CardCom title={title}>
                        <Grid container>
                            {children}
                        </Grid>
                    </CardCom>
                </Grid>
            </Grid>
        </Box>
    )


    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <BreadcrumbsComponent list={BreadcrumbsPath}/>
                </Box>
                <Sheet variant="outlined" sx={{
                    border: 'none', display: {sm: 'initial'}, width: '100%',
                    flexShrink: 1, overflowX: 'hidden', minHeight: 0,
                }}>
                    <Box sx={ChatPageStyle.BoxTable}>
                        <Typography level="h2" sx={{mb: 2}}>แดชบอร์ด</Typography>
                        <Input sx={{width: {xs: '100%', lg: '30%'}}} type="date"
                               value={currentDate} onChange={(e) => handleChange(e)}
                        />
                    </Box>
                    <Box sx={{flexGrow: 1}}>
                        <Grid container spacing={2}>
                            <Grid size={{xs: 12, md: 8}}>
                                <Grid size={12} mb={2}>
                                    <Card variant="outlined">
                                        <Box sx={{display: 'flex', height: '100%',}}>
                                            <div style={{width: '100%', borderRight: 'solid 1px #cdd7e1'}}>
                                                <h3 style={{textAlign: 'center'}}>ลูกค้ารายใหม่</h3>
                                                <h1 style={{textAlign: 'center'}}>{customers.newCust}</h1>
                                            </div>
                                            <div style={{width: '100%'}}>
                                                <h3 style={{textAlign: 'center'}}>ลูกค้าทั้งหมด</h3>
                                                <h1 style={{textAlign: 'center'}}>{customers.totalToday}</h1>
                                            </div>
                                        </Box>
                                    </Card>
                                </Grid>
                                <Grid size={12}>
                                    <BarChart title={'จำนวนแชทล่าสุด 7 วัน'} chatData={chatData}/>
                                </Grid>
                            </Grid>
                            <Grid size={{xs: 12, md: 4}}>
                                <Grid size={12} mb={2}>
                                    <D title={'จำนวนแชทวันนี้'}>
                                        <Grid container spacing={1}>
                                            {contChats && contChats.length > 0 && contChats.map((item, index) => (
                                                <Grid key={index} size={{xs: 6, md: 4}}>
                                                    <StatCard total={item.total} chatData={item} title="ห้องช่าง"
                                                              value={item.count}/>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </D>
                                </Grid>
                                <Grid size={12} mb={2}>
                                    <D title={'จำนวนดาววันนี้'}>
                                        <Grid container spacing={1}>
                                            {stars && stars.rooms && stars.rooms.length > 0 && (
                                                stars.rooms.map((item, index) => (
                                                    <Chip size="lg" color={getRandomColor()}>
                                                        {item.roomName} {item.count}/{stars.total}
                                                    </Chip>
                                                ))
                                            )}
                                        </Grid>
                                    </D>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Box>
                </Sheet>
            </Box>
        </Sheet>

    );
}