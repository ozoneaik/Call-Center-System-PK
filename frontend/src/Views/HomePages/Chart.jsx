import {Bar, Doughnut, Line} from "react-chartjs-2";
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
ChartJS.register(LinearScale,CategoryScale,BarElement,Tooltip,PointElement,LineElement);
ChartJS.register(ArcElement);
const BarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
        x: {
            ticks: {
                color: '#FFFFFF',
            }
        },
        y: {
            ticks: {
                color: '#FFFFFF',
            }
        }
    },

}
export const Charts = ({chatData}) => {
    return (
        <>
            <div style={{height : 450}}>
                <Bar data={chatData} options={BarChartOptions}/>
            </div>
        </>
    )
}


const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
};

export const CirCleChart = ({chatData}) => {
    return (
        <Doughnut data={chatData} options={chartOptions}/>
    )
}