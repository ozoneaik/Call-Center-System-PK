import {MessageStyle} from "../../styles/MessageStyle.js";
import Stack from "@mui/joy/Stack";
import Avatar from "@mui/joy/Avatar";
import Typography from "@mui/joy/Typography";
import {Button, Modal, ModalClose, ModalDialog} from "@mui/joy";
import Chip from "@mui/joy/Chip";
import TelegramIcon from '@mui/icons-material/Telegram';
import AddCommentIcon from '@mui/icons-material/AddComment';
import DoneIcon from '@mui/icons-material/Done';
import {useState} from "react";
import {AlertDiaLog} from "../../Dialogs/Alert.js";
import {endTalkApi} from "../../api/Messages.js";
import {useAuth} from "../../context/AuthContext.jsx";

function MessagePaneHeader(props) {
    const {user} = useAuth();
    const {sender, chatRooms, shortChat} = props;
    const [sendingOpen, setSendingOpen] = useState(false);
    const [shortCut, setShortcut] = useState(false);

    const Btn = ({title, color, icon, onClick,disable=true}) => (
        <Button color={color} disabled={disable} variant="outlined" size="sm" startDecorator={icon} onClick={onClick}>
            <Typography color={disable ? '' : color} fontSize='small' sx={MessageStyle.PaneHeader.BtnText}>
                {title}
            </Typography>
        </Button>
    );

    const endTalk = (custId) => {
        AlertDiaLog({
            title: 'จบการสนทนา',
            text : 'กด "ตกลง" เพื่อจบการสนทนา (หากคุณต้องการส่งต่อกรุณากดที่ปุ่ม "ส่งต่อไปยัง" แทน)',
            icon: 'info',
            onPassed: async (confirm) => {
                if (confirm) {
                    const {data,status} = await endTalkApi(custId);
                    AlertDiaLog({
                        text : data.message,
                        icon : status === 200 ? 'success' : 'error',
                        onPassed : () => window.close()
                    });
                }else console.log('กด ยกเลิก การจบสนทนา')
            }
        });
    };

    return (
        <>
            <Stack direction="row" sx={MessageStyle.PaneHeader.Stack}>
                <Stack direction="row" spacing={{xs: 1, md: 2}} sx={{alignItems: 'center'}}>
                    <Avatar size="lg" src={sender.avatar}/>
                    <div>
                        <Typography component="h2" noWrap sx={MessageStyle.PaneHeader.HeadTitle}>
                            {sender.custName}
                        </Typography>
                        <Chip size='sm'>
                            {sender.description}
                        </Chip>
                    </div>
                </Stack>
                <Stack spacing={1} direction="row" sx={{alignItems: 'center'}}>
                    <Btn
                        title={'ส่งต่อไปยัง'} color={'primary'} icon={<TelegramIcon/>}
                        onClick={() => setSendingOpen(true)}
                        disable={sender.emp !== user.empCode}
                    />
                    <Btn
                        title={'ตัวช่วยตอบ'} color={'warning'} icon={<AddCommentIcon/>}
                        onClick={() => setShortcut(true)}
                        disable={sender.emp !== user.empCode}
                    />
                    <Btn
                        title={'จบการสนทนา'} color={'success'} icon={<DoneIcon/>}
                        onClick={() => endTalk(sender.custId)}
                        disable={sender.emp !== user.empCode}
                    />
                </Stack>
            </Stack>

            <Modal open={sendingOpen} onClose={() => setSendingOpen(false)}>
                <ModalDialog>
                    <ModalClose/>
                    <Typography component="h2">ส่งต่อไปยัง</Typography>
                    <Typography>ห้องแชท</Typography>
                    {
                        chatRooms.length > 0 && (
                            chatRooms.map((room, index) => (
                                <Button key={index}>{room.roomName}</Button>
                            ))
                        )
                    }
                </ModalDialog>
            </Modal>
            <Modal open={shortCut} onClose={() => setShortcut(false)}>
                <ModalDialog>
                    <ModalClose/>
                    <Typography component="h2">ตัวช่วยตอบ</Typography>
                    {
                        shortChat.length > 0 && (
                            shortChat.map((row, index) => (
                                <Button color='warning' key={index}>{row.content}</Button>
                            ))
                        )
                    }
                </ModalDialog>
            </Modal>
        </>
    );
}

export default MessagePaneHeader;