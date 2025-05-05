import { Card, CardContent, Typography } from "@mui/joy";

import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';


ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const options = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: 'Chart.js Bar Chart',
        },
    },
}

const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

const data = {
    labels,
    datasets: [
        {
            label: 'Dataset 1',
            data: [10,20,12,15,20,25,30],
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
    ],
};

export default function LatestCountMessage() {
    return (
        <Card>
            <Typography fontWeight='bold'>จำนวนเคสล่าสุด 7 วัน</Typography>
            <CardContent>
                <Bar options={options} data={data} />
            </CardContent>
        </Card>
    )
}