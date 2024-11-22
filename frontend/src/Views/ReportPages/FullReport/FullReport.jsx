import { Card, Select, Stack, Table, Typography, Option } from "@mui/joy";
import { Grid2 } from "@mui/material";
import Tabs from '@mui/joy/Tabs';
import TabList from '@mui/joy/TabList';
import Tab from '@mui/joy/Tab';
import TabPanel from '@mui/joy/TabPanel';
import { useEffect, useState } from "react";
import { TabsReport } from "./Tabs/TabsReport";
import { ChatPageStyle } from "../../../styles/ChatPageStyle";
import { reportDepartmentApi } from "../../../Api/Report";


export default function FullReport() {
    const [tagMenus, setTagMenus] = useState([]);
    const [chatRooms, setChatRooms] = useState([]);
    useEffect(() => {
        getReportDepartment();
    }, [])
    const getReportDepartment = async () => {
        const { data, status } = await reportDepartmentApi({ startTime: '2024-11-14', endTime: '2024-11-14' });
        setTagMenus(data.P);
        setChatRooms(data.chatRooms);
        console.log(data, status);
    }
    return (
        <Grid2 container spacing={2}>
            {/* <Grid2 size={12}>
                <Stack>
                    <Card sx={{ width: '20%' }}>
                        แชททั้งหมด
                        <br />
                        - hello
                        - hello
                    </Card>
                </Stack>
            </Grid2> */}
            <Grid2 size={12} sx={{ maxHeight: 400, overflowX: 'scroll' }}>
                <Table borderAxis="both" stickyHeader sx={ChatPageStyle.Table}>
                    <thead>
                        <tr>
                            <th></th>
                            <th>
                                <Select>
                                    {chatRooms && chatRooms.map((item, index) => (
                                            <Option value={index} key={index}>{item.roomName}</Option>
                                    ))}
                                </Select>
                            </th>
                            <th colSpan={5}></th>
                        </tr>
                        <tr>
                            <th>แท็คการจบสนทนา</th>
                            <th>รวม</th>
                            <th>ภายใน 30 นาที</th>
                            <th>ภายใน 1 ชั่วโมง</th>
                            <th>เกิน 1 ชั่วโมง</th>
                            <th>เกิน 2 ชั่วโมง</th>
                            <th>เกิน 1 วัน</th>
                        </tr>
                    </thead>
                    <tbody >
                        {tagMenus && tagMenus.map((item, index) => (
                            <tr key={index}>
                                <td>{item.tagName}</td>
                                <td>{item.count}</td>
                                <td>{item.halfHour}</td>
                                <td>{item.oneHour}</td>
                                <td>{item.overOneHour}</td>
                                <td>{item.overTwoHour}</td>
                                <td>{item.overDay}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Grid2>
            {/* <Grid2 size={6}>
                <Typography level="title-lg" mb={2}>
                    จำนวนข้อความ 💬💬💬
                </Typography>
                <Tabs aria-label="Basic tabs" defaultValue={0}>
                    <TabList>
                        <Tab>First tab</Tab>
                        <Tab>Second tab</Tab>
                        <Tab>Third tab</Tab>
                    </TabList>
                    <TabPanel value={0}>
                        <TabsReport />
                    </TabPanel>
                    <TabPanel value={1}>
                        <TabsReport />
                    </TabPanel>
                    <TabPanel value={2}>
                        <TabsReport />
                    </TabPanel>
                </Tabs>

            </Grid2>
            <Grid2 size={6}>
                <Typography level="title-lg" mb={2}>
                    จำนวนดาว ⭐⭐⭐
                </Typography>
                <TabsReport />
            </Grid2> */}
        </Grid2>
    )
}