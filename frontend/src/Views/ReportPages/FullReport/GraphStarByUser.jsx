import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
ChartJS.register(LinearScale, CategoryScale, BarElement, Tooltip, PointElement, LineElement);


const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
    },
};

const labels = ['แผนก 1', 'แผนก 2', 'แผนก 3', 'แผนก 4', 'แผนก 5', 'แผนก 6'];

export default function GraphStarByUser(){
    return (
        <Bar data={{
            labels: labels,
            datasets: [{
                label: 'จำนวนดาว⭐⭐⭐',
                data: [1,25,100,50,100],
                backgroundColor: ['#fcd53f','#5d6268']
            }]
        }}
        options={chartOptions}>

    </Bar>
    )
}