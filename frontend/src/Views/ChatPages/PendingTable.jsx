import Box from "@mui/joy/Box";
import {ChatPageStyle} from "../../styles/ChatPageStyle.js";
import Typography from "@mui/joy/Typography";
import {Button, Sheet, Table} from "@mui/joy";
import Avatar from "@mui/joy/Avatar";
import {getRandomColor} from "../../Components/Options.jsx";
import Chip from "@mui/joy/Chip";
import ChatIcon from "@mui/icons-material/Chat";
import {AlertDiaLog} from "../../Dialogs/Alert.js";
import {receiveApi} from "../../Api/Messages.js";

const data = [{
    custName: '', userReply: '', updated_at: '',
    from_roomId: '', from_empCode: '', rateRef: '',
    empCode : '',receiveAt : '',empName : ''
}];
export const PendingTable = (props) => {
    const {dataset = data,disable} = props;
    const handleChat = (rateId, activeId, custId,roomId) => {
        const options = {
            title: 'ต้องการรับเรื่องหรือไม่',
            text: 'กด "ตกลง" เพื่อยืนยันรับเรื่อง',
            icon: 'info'
        };
        AlertDiaLog({
            ...options,
            onPassed: async (confirm) => {
                if (confirm) {
                    const {data, status} = await receiveApi(rateId,roomId);
                    if (status === 200) {
                        const params = `${rateId}/${activeId}/${custId}`;
                        const path = `${window.location.origin}/select/message/${params}`;
                        window.open(path, '_blank');
                    } else AlertDiaLog({title: data.message,text:data.detail});
                } else console.log('ไม่ได้ confirm');
            }
        });
    };
    return (
        <>
            <Box sx={ChatPageStyle.BoxTable}>
                <Typography level="h2" component="h1">รอดำเนินการ</Typography>
            </Box>
            <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
                <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
                    <thead>
                    <tr>
                        <th>ชื่อลูกค้า</th>
                        <th>พนักงานรับเรื่อง</th>
                        <th>จากห้องแชท</th>
                        <th>จากพนักงาน</th>
                        <th>จัดการ</th>
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
                                        {data.userReply &&
                                            <Avatar color={getRandomColor()} size='sm' sx={{mr: 1}}/>}
                                        <Typography>
                                            {data.empCode || '-'}
                                        </Typography>
                                    </div>
                                </td>
                                <td>
                                    <Chip color="warning">
                                        <Typography sx={ChatPageStyle.TableText}>
                                            {data.from_roomId || 'ไม่พบ'}
                                        </Typography>
                                    </Chip>
                                </td>
                                <td>
                                    <Chip color="primary">
                                        <Typography sx={ChatPageStyle.TableText}>
                                            {data.from_empCode || 'ไม่พบ'}
                                        </Typography>
                                    </Chip>
                                </td>
                                <td>
                                    <Button size='sm' variant='outlined' sx={{mr: 1}}
                                            disabled={index !== 0}
                                            startDecorator={<ChatIcon/>}
                                            onClick={() => handleChat(data.rateRef, data.id, data.custId,data.roomId)}
                                    >
                                        <Typography>รับเรื่อง {disable ? 'true' : 'false'}</Typography>
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
    );
}