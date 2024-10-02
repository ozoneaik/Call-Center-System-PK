import Box from "@mui/joy/Box";
import {ChatPageStyle} from "../../styles/ChatPageStyle.js";
import Typography from "@mui/joy/Typography";
import {Button, Sheet, Table} from "@mui/joy";
import Avatar from "@mui/joy/Avatar";
import {convertFullDate, differentDate, getRandomColor} from "../../Components/Options.jsx";
import Chip from "@mui/joy/Chip";
import ChatIcon from "@mui/icons-material/Chat";
import {useEffect, useState} from "react";

export const ProgressTable = ({dataset}) => {
    const handleChat = (rateId, activeId, custId) => {
        const params = `${rateId}/${activeId}/${custId}`;
        const path = `${window.location.origin}/select/message/${params}`;
        window.open(path, '_blank');
    };

    const TimeDisplay = ({startTime}) => {
        const [timeDiff, setTimeDiff] = useState(differentDate(startTime));

        useEffect(() => {
            // ตั้ง interval เพื่ออัพเดทเวลาใหม่ทุกๆ 1 วินาที
            const interval = setInterval(() => {
                setTimeDiff(differentDate(startTime));
            }, 1000);

            // ล้าง interval เมื่อ component ถูกทำลาย
            return () => clearInterval(interval);
        }, [startTime]); // ขึ้นอยู่กับค่า startTime

        return (
            <Chip color="primary">
                <Typography sx={ChatPageStyle.TableText}>
                    {startTime ? timeDiff : 'ยังไม่เริ่มสนทนา'}
                </Typography>
            </Chip>
        );
    };

    return (
        <>
            <Box sx={ChatPageStyle.BoxTable}>
                <Typography level="h2" component="h1">กำลังดำเนินการ</Typography>
            </Box>
            <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
                <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
                    <thead>
                    <tr>
                        <th style={{width: 200}}>ชื่อลูกค้า</th>
                        <th style={{width: 200}}>พนักงานรับเรื่อง</th>
                        <th style={{width: 200}}>วันที่รับเรื่อง</th>
                        <th style={{width: 200}}>เวลาเรื่ม</th>
                        <th style={{width: 200}}>เวลาที่สนทนา</th>
                        <th style={{width: 150}}>จัดการ</th>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        dataset.length > 0 ? dataset.map((data, index) => (
                            <tr key={index}>
                                <td>
                                    <div style={{display: "flex", alignItems: "center"}}>
                                        {data.avatar && <Avatar size='sm' sx={{mr: 1}} src={data.avatar}/>}
                                        <Typography>
                                            {data.custName}
                                        </Typography>
                                    </div>
                                </td>
                                <td>
                                    <div style={{display: "flex", alignItems: "center"}}>
                                        {data.empCode && <Avatar color={getRandomColor()} size='sm' sx={{mr: 1}}/>}
                                        <Typography>
                                            {data.empName || '-'}
                                        </Typography>
                                    </div>
                                </td>
                                <td>
                                    <Chip color={getRandomColor()}>
                                        <Typography sx={ChatPageStyle.TableText}>
                                            {data.receiveAt ? convertFullDate(data.receiveAt) : 'ยังไม่เริ่มสนทนา'}
                                        </Typography>
                                    </Chip>
                                </td>
                                <td>
                                    <Chip color="warning">
                                        <Typography sx={ChatPageStyle.TableText}>
                                            {data.startTime ? convertFullDate(data.startTime) : 'ยังไม่เริ่มสนทนา'}
                                        </Typography>
                                    </Chip>
                                </td>
                                <td>
                                    <TimeDisplay startTime={data.startTime}/>
                                </td>
                                <td>
                                    <Button
                                        onClick={() => handleChat(data.rateRef, data.id, data.custId)}
                                        size='sm'
                                        variant='outlined'
                                        sx={{mr: 1}} startDecorator={<ChatIcon/>}>
                                        <Typography>ดูข้อความ</Typography>
                                    </Button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} style={{textAlign: 'center'}}>
                                    <Chip color={getRandomColor()}>ไม่มีข้อมูล</Chip>
                                </td>
                            </tr>
                        )
                    }
                    </tbody>
                </Table>
            </Sheet>
        </>

    )
}