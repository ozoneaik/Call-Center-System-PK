import { Bar } from "react-chartjs-2"
import { CategoryScale, Chart as ChartJS } from 'chart.js'
import { Box } from "@mui/joy";


const data = {
    labels: ['red', 'orange', 'blue', 'green', 'yellow', 'pink', 'black'],
    datasets: [
        {
            label: 'test',
            data: [10, 20, 30, 40, 100, 10, 1],
            backgroundColor: ['#f95a1d', '#5d6268', '#f95a1d', '#5d6268', '#f95a1d', '#5d6268'],
            borderWidth: 1
        }
    ]
}

ChartJS.register(CategoryScale);


export const TabsReport = () => {
    return (
        <>
            <Box sx={{maxHeight : '30em',width : '100%'}}>
                <Bar data={data} options={
                    {
                        indexAxis: 'x',
                        plugins: {
                            title: {
                                display: true,
                                text: "Users Gained between 2016-2020"
                            },
                            legend: {
                                display: false
                            }
                        }
                    }
                }></Bar>
            </Box>

        </>
    )
}