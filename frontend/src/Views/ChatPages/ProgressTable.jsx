import Box from "@mui/joy/Box";
import {ChatPageStyle} from "../../styles/ChatPageStyle.js";
import Typography from "@mui/joy/Typography";
import {Button, Sheet, Table} from "@mui/joy";
import Avatar from "@mui/joy/Avatar";
import {convertFullDate, convertLocalDate, getRandomColor} from "../../Components/Options.jsx";
import Chip from "@mui/joy/Chip";
import ChatIcon from "@mui/icons-material/Chat";

export const ProgressTable = ({dataset}) => {
    const handleChat = (rateId, activeId, custId) => {
        const params = `${rateId}/${activeId}/${custId}`;
        const path = `${window.location.origin}/select/message/${params}`;
        window.open(path, '_blank');
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
                        <th style={{width : 200}}>ชื่อลูกค้า</th>
                        <th style={{width : 200}}>พนักงานรับเรื่อง</th>
                        <th style={{width : 200}}>วันที่รับเรื่อง</th>
                        <th style={{width : 200}}>เวลาเรื่ม</th>
                        <th style={{width : 200}}>เวลาที่สนทนา</th>
                        <th style={{width : 150}}>จัดการ</th>
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
                                            {data.startTime ? convertLocalDate(data.startTime) : 'ยังไม่เริ่มสนทนา'}
                                        </Typography>
                                    </Chip>
                                </td>
                                <td>
                                    <Chip color="primary">
                                        <Typography sx={ChatPageStyle.TableText}>
                                            {data.endTime ? convertLocalDate(data.endTime) : 'ยังไม่เริ่มสนทนา'}
                                        </Typography>
                                    </Chip>
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
                                <td colSpan={5} style={{textAlign: 'center'}}>
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