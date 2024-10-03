import React from 'react';
import {Grid, Card, CardContent, Typography, Box, AspectRatio, Sheet} from '@mui/joy';
import {Bar, Doughnut, Line} from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement, ArcElement
} from 'chart.js';
import {ChatPageStyle} from "../styles/ChatPageStyle.js";
import BreadcrumbsComponent from "../Components/Breadcrumbs.jsx";
import StarIcon from '@mui/icons-material/Star';

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
                'rgba(255, 99, 132, 0.2)',
                'rgba(255, 159, 64, 0.2)',
                'rgba(255, 205, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(201, 203, 207, 0.2)'
            ],
        },
    ],
};

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
};

const StatCard = ({ title, value, icon, color }) => (
    <Card variant="outlined" sx={{ height: '100%' }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
            <Typography level="body-sm" textColor="text.secondary">
                {title}
            </Typography>
            <Box sx={{ flexGrow: 1, minHeight: 100, position: 'relative' }}>
                <Doughnut data={chatData} options={chartOptions} />
                <Typography
                    level="h2"
                    fontWeight="bold"
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
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
    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <BreadcrumbsComponent list={BreadcrumbsPath}/>
                </Box>
                <Sheet variant="outlined" sx={{
                    border : 'none', display: {sm: 'initial'}, width: '100%',
                    flexShrink: 1, overflowX: 'hidden', minHeight: 0,
                }}>
                        <Typography level="h2" sx={{ mb: 2 }}>แดชบอร์ด</Typography>
                        <Grid container spacing={2}>
                            <Grid xs={12} md={8}>
                                <Card variant="outlined" sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Typography level="h4" sx={{ mb: 2 }}>จำนวนแชทรายวัน</Typography>
                                        <AspectRatio ratio="2">
                                            <Bar data={chatData} options={chartOptions} />
                                        </AspectRatio>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid xs={12} md={4} container>
                                <Grid xs={12}>
                                    <StatCard title="แชทวันนี้" value="152" icon={<StarIcon/>} color="primary"/>
                                </Grid>
                                <Grid xs={12}>
                                    <StatCard title="ดาววันนี้" value="24" icon={<StarIcon/>} color="warning"/>
                                </Grid>
                                <Grid xs={12}>
                                    <StatCard title="ลูกค้าใหม่วันนี้" value="18" icon={<StarIcon/>} color="success"/>
                                </Grid>
                            </Grid>
                        </Grid>

                </Sheet>

            </Box>
        </Sheet>

    );
}