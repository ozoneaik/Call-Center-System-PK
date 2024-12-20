import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip
} from "chart.js";
import { Bar } from "react-chartjs-2";
ChartJS.register(LinearScale, CategoryScale, BarElement, Tooltip, PointElement, LineElement);


const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        tooltip: {
            bodyFont: {
                size : 20
            }
        }
    },
};


export default function GraphCaseByUser({ list }) {
    const dataFromList = list.map(item => item.totalCase);
    const labelFromList = list.map(item => item.empCode);
    return (
        <>
            <Bar data={{
                labels: labelFromList,
                datasets: [{
                    label: 'จำนวนการรับเรื่อง',
                    data: dataFromList,
                    backgroundColor: ['#f95a1d', '#5d6268']
                }]
            }}
                options={chartOptions}>
            </Bar>
        </>
    )
}