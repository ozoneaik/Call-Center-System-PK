import { Avatar, Badge, Box, Button, Card, Chip, Input, Sheet, Stack, Table, Typography } from "@mui/joy";
import { ChatPageStyle } from "../../../styles/ChatPageStyle";
import { useState } from "react";
import { Grid2 } from "@mui/material";
import { ActiveModal } from "./ActiveModal";
export const ActiveList = ({ activeList }) => {
    const [showModal, setShowModal] = useState(false);
    const [selected, setSelected] = useState({
        roomId: '',
    });
    return (
        <>
            <ActiveModal showModal={showModal} setShowModal={setShowModal} selected={selected} totalChat={activeList.totalChat} />
            <Grid2 container>
                <Grid2 size={12}>
                    <Table stickyHeader borderAxis="both" stickyFooter sx={ChatPageStyle.Table} hoverRow>
                        <thead>
                            <tr>
                                <th colSpan={9}>ชื่อลูกค้า : {activeList.custName} {activeList.totalChat}</th>
                            </tr>
                            <tr>

                                <th>ห้องแชท</th>
                                <th>พนักงานรับเรื่อง</th>
                                <th>วันที่รับเรื่อง</th>
                                <th>เวลาเริ่มสนทนา</th>
                                <th>เวลาจบสนทนา</th>
                                <th>เวลาสนทนารวม</th>
                                <th>รับเรื่องจากพนักงาน</th>
                                <th>รับเรื่องจากห้อง</th>
                                <th>รายละเอียด</th>
                            </tr>

                        </thead>
                        <tbody>
                            {activeList && activeList.List && activeList.List.length > 0 && activeList.List.map((item, index) => (
                                <tr key={index}>
                                    <td>
                                        {item.roomName}&nbsp;<Chip size='sm' color="primary" variant="outlined">{item.roomId}</Chip>
                                    </td>
                                    <td>
                                        {item.empCode && (
                                            <Stack direction='row' alignItems='center' gap={1}>
                                                <Avatar src="" color='primary' size="sm" />
                                                {item.empCode}
                                            </Stack>
                                        )}
                                    </td>
                                    <td>{item.receiveAt}</td>
                                    <td>{item.startTime}</td>
                                    <td>{item.endTime}</td>
                                    <td>{item.totalTime ? item.totalTime : 'ไม่พบ'}</td>
                                    <td>{item.from_empCode}</td>
                                    <td>{item.from_roomId}</td>
                                    <td>
                                        <Button size="sm" onClick={() => { setShowModal(true); setSelected(item) }} color="warning">ดู</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot >
                            <tr>
                                <th colSpan={5}>รวม</th>
                                <th colSpan={4}>{activeList && activeList.totalTimeInSeconds}</th>
                            </tr>
                        </tfoot>
                    </Table>
                </Grid2>
            </Grid2>
        </>

    )
}