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

const labels = ['1 ดาว', '2 ดาว', '3 ดาว', '4 ดาว', '5 ดาว', 'ยังไม่ได้ประเมิน'];

export default function GraphStarByUser({ starRate }) {
    // เตรียมข้อมูลสำหรับแต่ละดาว
    const allRates = [1, 2, 3, 4, 5, 0]; // เรียงลำดับ rate ที่ต้องการ (รวมยังไม่ได้ประเมินคือ 0)

    // จัดการข้อมูล starRate ให้ครบทุกเรต
    const processedData = allRates.map(rate => {
        const foundRate = starRate.find(item => item.starrate === rate);
        return foundRate ? foundRate.count : 0; // ถ้าพบข้อมูลใน starRate ใช้ count, ถ้าไม่พบให้เป็น 0
    });

    return (
        <Bar
            data={{
                labels: labels,
                datasets: [{
                    label: 'จำนวนดาว⭐⭐⭐',
                    data: processedData,
                    backgroundColor: ['#fcd53f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#95a5a6'], // สีที่แตกต่างกัน
                }],
            }}
            options={chartOptions}
        />
    );
}
