import React, { useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const initialData = {
    labels: ['Red', 'Blue', 'Yellow'],
    datasets: [{
        label: 'Sales Distribution',
        data: [300, 50, 100],
        backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)'
        ],
        borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 205, 86, 1)'
        ],
        borderWidth: 1,
        hoverOffset: 4
    }]
};

const options = {
    responsive: true,
    plugins: {
        legend: {
            position: 'bottom',
        },
        title: {
            display: true,
            text: 'Sales Distribution',
            font: { size: 18 }
        },
        tooltip: {
            callbacks: {
                label: (context) => {
                    const label = context.label || '';
                    const value = context.parsed || 0;
                    const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                    const percentage = ((value / total) * 100).toFixed(2) + '%';
                    return `${label}: ${value} (${percentage})`;
                }
            }
        }
    },
    cutout: '60%',
    animation: {
        animateScale: true,
        animateRotate: true
    }
};

const EnhancedDoughnutChart = () => {
    const [chartData, setChartData] = useState(initialData);

    const updateData = () => {
        const newData = chartData.datasets[0].data.map(() => Math.floor(Math.random() * 500));
        setChartData({
            ...chartData,
            datasets: [{
                ...chartData.datasets[0],
                data: newData
            }]
        });
    };

    return (
        <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
            <Doughnut data={chartData} options={options} />
            <button
                onClick={updateData}
                style={{
                    display: 'block',
                    margin: '20px auto',
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}
            >
                อัปเดตข้อมูล
            </button>
        </div>
    );
};

export default EnhancedDoughnutChart;