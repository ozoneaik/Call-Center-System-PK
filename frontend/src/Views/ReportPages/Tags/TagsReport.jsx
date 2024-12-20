import {Grid2, TableBody, TableHead} from "@mui/material";
import {Table} from "@mui/joy";
import {useEffect, useState} from "react";
import {tagReportsApi} from "../../../Api/Report.js";
import Button from "@mui/joy/Button";
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';


import {Doughnut} from "react-chartjs-2";
import {CategoryScale, Chart as ChartJS, LinearScale, LineElement, PointElement, Tooltip} from "chart.js";
ChartJS.register(LinearScale, CategoryScale, Tooltip, PointElement, LineElement);

export default function TagsReport({startTime, endTime}) {
    const [tagsReport, setTagsReport] = useState([]);
    const [show, setShow] = useState(false);
    const [detail, setDetail] = useState([]);
    const [selected, setSelected] = useState({});
    useEffect(() => {
        fetchData();
    }, [])

    const fetchData = async () => {
        const {data, status} = await tagReportsApi({startTime, endTime});
        console.log('tagReports >> ', data, status)
        if (status === 200) {
            setTagsReport(data.tagReports)
        }
    }

    const chartData = {
        labels: detail.map(item => item.roomName),
        datasets: [{
            label: 'จำนวนการรับเรื่อง',
            data: detail.map(item => item.count),
            backgroundColor: [
                '#f95a1d', '#5d6268', '#ffa600', '#ff6361', '#bc5090',
                '#58508d', '#003f5c', '#444e86', '#955196', '#dd5182'
            ]
        }]
    };
    return (
        <>
            <Grid2 size={8} mb={3}>
                <Table borderAxis="both" hoverRow>
                    <TableHead>
                    <tr>
                        <th>เลขอ้างอิง</th>
                        <th>แท็คการจบสนทนา</th>
                        <th>จำนวนเคส</th>
                        <th>#</th>
                    </tr>
                    </TableHead>
                    <TableBody>
                    {tagsReport.length > 0 && tagsReport.map((item, index) => (
                        <tr key={index} style={{backgroundColor : selected.tagId === item.tagId ? '#ffede5' : null}}>
                            <td>{item.tagId}</td>
                            <td>{item.tagName}</td>
                            <td>{item.count}</td>
                            <td>
                                <Button size='sm' onClick={() => {
                                    setShow(true);
                                    setDetail(item.detail)
                                    setSelected(item)
                                }}>
                                    <RemoveRedEyeIcon/>
                                </Button>
                            </td>
                        </tr>
                    ))}
                    </TableBody>
                </Table>
            </Grid2>
            {show && (
                <Grid2 size={4} mb={3} height={500} maxHeight={500}>
                    <Doughnut
                        data={chartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'right',
                                    labels: {
                                        boxWidth: 12
                                    }
                                },
                                tooltip: {
                                    bodyFont : {
                                        size : 20
                                    },
                                    callbacks: {
                                        label: function(context) {
                                            const label = context.label || '';
                                            const value = context.raw || 0;
                                            return `${label}: ${value} เคส`;
                                        }
                                    }
                                }
                            }
                        }}
                    />
                </Grid2>
            )}
        </>
    )
}