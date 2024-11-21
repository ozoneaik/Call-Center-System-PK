import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        tooltip: {
            callbacks: {
                label: (context) => {
                    const label = context.label || '';
                    const value = context.raw || 0;
                    return `${label}: ${value}`;
                },
            },
        },
    },
    cutout: '50%', // กำหนดความกว้างของช่องกลาง
};
ChartJS.register(LinearScale, CategoryScale, BarElement, Tooltip, PointElement, LineElement);

export const P = ({ totalChat = 0, amount_chat = 0 }) => {
    return (
        <>
            <Doughnut
                data={{
                    labels: ['จำนวนแชท', 'แชททั้งหมด'],
                    datasets: [{
                        label: 'jlsjf',
                        data: [amount_chat, totalChat - amount_chat],
                        backgroundColor: ['#f95a1d', '#5d6268']
                    }]
                }}
                options={chartOptions}
            />
        </>
    )
}