import {AspectRatio, Box, Card, CardContent, Typography} from "@mui/joy";
import {Bar, Doughnut} from "react-chartjs-2";
import React from "react";

const BarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis : 'y'
};

const BarChartOptionsBarX = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis : 'x'
};

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
};
export const StatCard = ({chatData, value,total}) => (
    <>
        <Box sx={{flexGrow: 1, minHeight: 100, position: 'relative'}}>
            <Doughnut data={chatData} options={chartOptions}/>
            <Typography
                level="h4" fontWeight="bold"
                sx={{position: 'absolute', top: '60%', left: '50%', transform: 'translate(-50%, -50%)'}}
            >
                {value}/{total}
            </Typography>
        </Box>
    </>
);

export const BarChart = ({chatData, title}) => (
    <Card variant="outlined">
        <CardContent sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            position: 'relative'
        }}>
            <Typography level="h4" sx={{mb: 2}}>{title}</Typography>
            <Box sx={{flexGrow: 1, minHeight: 100, position: 'relative'}}>
                <AspectRatio ratio="2">
                    <Bar data={chatData} options={BarChartOptions}/>
                </AspectRatio>
            </Box>
        </CardContent>
    </Card>
)

export const BarChartX = ({chatData, title}) => (
    <Card variant="outlined">
        <CardContent sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            position: 'relative'
        }}>
            <Typography level="h4" sx={{mb: 2}}>{title}</Typography>
            <Box sx={{flexGrow: 1, minHeight: 100, position: 'relative'}}>
                <AspectRatio ratio="2">
                    <Bar data={chatData} options={BarChartOptionsBarX}/>
                </AspectRatio>
            </Box>
        </CardContent>
    </Card>
)