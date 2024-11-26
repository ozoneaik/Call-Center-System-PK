import { Autocomplete, Chip, Table } from "@mui/joy";
import { ChatPageStyle } from "../../../styles/ChatPageStyle";
import { useEffect } from "react";
import { fullReportApi } from "../../../Api/Report";
import { useState } from "react";
import { Grid2 } from "@mui/material";
import GraphCaseByUser from "./GraphCaseByUser";
import GraphStarByUser from "./GraphStarByUser";

export default function IndividualReport({ startTime, endTime }) {
    const [list, setList] = useState([]);
    const [starRate, setStarRate] = useState([]);
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data, status } = await fullReportApi({ startTime, endTime });
        if (status === 200) {
            console.log('data', data);
            setList(data.results);
            setStarRate(data.starRate);
        }
    }

    const Show = ({ value }) => {
        return value !== 0 ? (
            <Chip size='sm' color="primary" variant="solid">{value}</Chip>
        ) : (
            <><Chip size='sm' color="danger" variant="outlined">{value}</Chip></>
        )
    }
    return (
        <>
            <Grid2 size={12} maxHeight={400}>
                <Table borderAxis="both" sx={ChatPageStyle.Table}>
                    <thead>
                        <tr>
                            <th colSpan={2} style={{ textAlign: 'center' }}>พนักงาน</th>
                            <th colSpan={5} style={{ textAlign: 'center' }}>จำนวนเคส</th>
                        </tr>
                        <tr>
                            <th>ชื่อ</th>
                            <th>
                                <Autocomplete placeholder="แผนก" size='sm' options={['Option 1', 'Option 2']} />
                            </th>
                            <th>ภายใน 30 นาที</th>
                            <th>ภายใน 1 ชั่วโมง</th>
                            <th>เกิน 1 ชั่วโมง</th>
                            <th>เกิน 2 ชั่วโมง</th>
                            <th>เกิน 1 วัน</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list && list.length > 0 && list.map((item, index) => (
                            <tr key={index}>
                                <td>{item.empCode}</td>
                                <td></td>
                                <td>
                                    <Show value={item.halfHour} />
                                </td>
                                <td>
                                    <Show value={item.oneHour} />
                                </td>
                                <td>
                                    <Show value={item.overOneHour} />
                                </td>
                                <td>
                                    <Show value={item.overTwoHour} />
                                </td>
                                <td>
                                    <Show value={item.overDay} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Grid2>
            <Grid2 size={6} maxHeight={500} minHeight={400}>
                <GraphCaseByUser list={list}/>
            </Grid2>
            <Grid2 size={6} maxHeight={500} minHeight={400}>
                <GraphStarByUser starRate={starRate}/>
            </Grid2>

        </>
    )
}