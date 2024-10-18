import Box from "@mui/joy/Box";
import {ChatPageStyle} from "../../styles/ChatPageStyle.js";
import Typography from "@mui/joy/Typography";
import {Button, Sheet, Table} from "@mui/joy";
import Avatar from "@mui/joy/Avatar";
import {convertFullDate, getRandomColor} from "../../Components/Options.jsx";
import Chip from "@mui/joy/Chip";
import ChatIcon from "@mui/icons-material/Chat";
import {AlertDiaLog} from "../../Dialogs/Alert.js";
import {receiveApi} from "../../Api/Messages.js";
import {useAuth} from "../../context/AuthContext.jsx";

const data = [{
    custName: '', userReply: '', updated_at: '',
    from_roomId: '', from_empCode: '', rateRef: '',
    empCode: '', receiveAt: '', empName: ''
}];
export const PendingTable = (props) => {
    const {user} = useAuth();
    const {dataset = data} = props;
    const handleChat = (rateId, activeId, custId, roomId) => {
        const options = {
            title: 'ต้องการรับเรื่องหรือไม่',
            text: 'กด "ตกลง" เพื่อยืนยันรับเรื่อง',
            icon: 'info'
        };
        AlertDiaLog({
            ...options,
            onPassed: async (confirm) => {
                if (confirm) {
                    const {data, status} = await receiveApi(rateId, roomId);
                    if (status === 200) {
                        const params = `${rateId}/${activeId}/${custId}`;
                        const path = `${window.location.origin}/select/message/${params}/1`;
                        const win = window.open(path, '_blank','width=900,height=800');
                        win && win.focus();
                    } else AlertDiaLog({title: data.message, text: data.detail});
                } else console.log('ไม่ได้ confirm');
            }
        });
    };

    const BtnComponent = ({rateRef, id, custId, roomId, index}) => {
        let Disable;
        if (user.role === 'admin') {
            Disable = false;
            Disable = index !== 0;
        } else {
            Disable = index !== 0;
            Disable = user.roomId !== roomId;
        }
        return (
            <Box sx={{display: 'flex'}}>
                <Button size='sm' variant='outlined' sx={{mr: 1}}
                        disabled={Disable} startDecorator={<ChatIcon/>}
                        onClick={() => handleChat(rateRef, id, custId, roomId)}
                >
                    <Typography>รับเรื่อง</Typography>
                </Button>
            </Box>
        )
    }
    return (
        <>
            <Box sx={ChatPageStyle.BoxTable}>
                <Typography level="h2" component="h1">รอดำเนินการ</Typography>
            </Box>
            <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
                <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
                    <thead>
                    <tr>
                        <th style={{width: 200}}>ชื่อลูกค้า</th>
                        <th style={{width: 200}}>เมื่อ</th>
                        <th style={{width: 200}}>จากห้องแชท</th>
                        <th style={{width: 200}}>จากพนักงาน</th>
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
                                        <Box>
                                            <Typography>{data.custName}</Typography>
                                            <Chip color="success" size="sm">{data.description}</Chip>
                                        </Box>
                                    </div>
                                </td>
                                <td>
                                    <div style={{display: "flex", alignItems: "center"}}>
                                        {data.userReply &&
                                            <Avatar color={getRandomColor()} size='sm' sx={{mr: 1}}/>}
                                        <Typography>
                                            {convertFullDate(data.updated_at)}
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
                                    <BtnComponent
                                        index={index} rateRef={data.rateRef}
                                        id={data.id} custId={data.custId} roomId={data.roomId}
                                    />
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