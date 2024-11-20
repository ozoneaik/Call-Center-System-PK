import {
    ArcElement,
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
};
ChartJS.register(LinearScale,CategoryScale,BarElement,Tooltip,PointElement,LineElement);
const labels = ['Red', 'Blue'];
const datasets = {
    label : 'slfjls',
    data : [1,2],
    backgroundColor : ['red','blue']
}
const DData = {
    labels,datasets : [datasets]
}


export const P = () => {
    return (
        <>
        <Doughnut  data={DData} options={chartOptions}/>
        </>
    )
}