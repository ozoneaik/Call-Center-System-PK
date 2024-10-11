import React, {useEffect} from 'react';
import {AspectRatio, Box, Card, CardContent, Sheet, Typography} from '@mui/joy';
import Grid from '@mui/material/Grid2';
import {Bar, Doughnut} from 'react-chartjs-2';
import StarIcon from '@mui/icons-material/Star';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
ChartJS.register(ArcElement, Tooltip, Legend);
const BreadcrumbsPath = [{name: 'หน้าหลัก'}, {name: 'รายละเอียด'}];

// ข้อมูลตัวอย่างสำหรับกราฟ
const chatData = {
    labels: ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'],
    datasets: [
        {
            label: 'จำนวนแชท',
            data: [120, 200, 150, 80, 170, 220, 200],
            backgroundColor: [
                '#FFD700', // สีทอง (Gold)
                '#FFB6C1', // สีชมพูอ่อน (LightPink)
                '#98FB98', // สีเขียวพาสเทล (PaleGreen)
                '#FFA07A', // สีส้มอ่อน (LightSalmon)
                '#87CEFA', // สีฟ้าพาสเทล (LightSkyBlue)
                '#DDA0DD', // สีม่วงอ่อน (Plum)
                '#FF6347'  // สีแดงส้ม (Tomato)
            ],
        },
    ],
};

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
};

const StatCard = ({title, value, icon, color}) => (
    <Card variant="outlined" sx={{height: '100%'}}>
        <CardContent sx={{display: 'flex', flexDirection: 'column', height: '100%', position: 'relative'}}>
            <Typography level="body-sm" textColor="text.secondary">
                {title}
            </Typography>
            <Box sx={{flexGrow: 1, minHeight: 100, position: 'relative'}}>
                <Doughnut data={chatData} options={chartOptions}/>
                <Typography
                    level="h2"
                    fontWeight="bold"
                    sx={{
                        position: 'absolute',
                        top: '60%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    {value}
                </Typography>
            </Box>
        </CardContent>
    </Card>
);

export default function Dashboard() {
    useEffect(() => {
        const getData = async () => {
            const {data,status} = await DashboardApi();
            console.log(data,status);
        }

        getData();
    }, []);
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
                    <Typography level="h2" sx={{mb: 2}}>แดชบอร์ด</Typography>
                    <Box sx={{flexGrow: 1}}>
                        <Grid container spacing={1}>
                            <Grid size={{xs: 12, md: 8}} >
                                <Grid size={12} mb={2}>
                                    <Card variant="outlined">
                                        <Box sx={{
                                            display: 'flex',
                                            height: '100%',
                                        }}>
                                            <div style={{width: '100%',borderRight: 'solid 1px #cdd7e1'}}>
                                                <h3 style={{textAlign: 'center'}}>ลูกค้ารายใหม่</h3>
                                                <h1 style={{textAlign: 'center'}}>10</h1>
                                            </div>
                                            <div style={{width: '100%'}}>
                                                <h3 style={{textAlign: 'center'}}>ลูกค้ารายใหม่</h3>
                                                <h1 style={{textAlign: 'center'}}>10</h1>
                                            </div>
                                        </Box>
                                    </Card>
                                </Grid>
                                <Grid size={12} >
                                    <Card variant="outlined">
                                        <CardContent sx={{display: 'flex', flexDirection: 'column', height: '100%', position: 'relative'}}>
                                            <Typography level="h4" sx={{mb: 2}}>จำนวนแชทล่าสุด 7 วัน</Typography>
                                            <Box sx={{flexGrow: 1, minHeight: 100, position: 'relative'}}>
                                                <AspectRatio ratio="2">
                                                    <Bar data={chatData} options={chartOptions}/>
                                                </AspectRatio>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                            </Grid>
                            <Grid size={{xs: 12, md: 4}}>
                                <Grid size={12} mb={2}>
                                    <CardContent>
                                        <StatCard title="แชทวันนี้" value="152" icon={<StarIcon/>} color="primary"/>
                                    </CardContent>
                                </Grid>
                                <Grid size={12} mb={2}>
                                    <CardContent>
                                        <StatCard title="จำนวนดาววันนี้" value="152" icon={<StarIcon/>}
                                                  color="primary"/>
                                    </CardContent>
                                </Grid>
                                <Grid size={12} mb={2}>
                                    <CardContent>
                                        <StatCard title="จำนวนข้อความที่ค้าง" value="152" icon={<StarIcon/>}
                                                  color="primary"/>
                                    </CardContent>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Box>
                </Sheet>
            </Box>
        </Sheet>

    );
}