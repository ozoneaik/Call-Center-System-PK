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
import {useAuth} from "../../context/AuthContext.jsx";
import {openMessagesPane} from "../../utils.js";

function MessagePaneHeader(props) {
    const {user} = useAuth();
    const {sender, chatRooms, shortChat, roomSelect, shortCustSend, sendTo, endTalk} = props;
    const [sendingOpen, setSendingOpen] = useState(false);
    const [shortCut, setShortcut] = useState(false);

    const Btn = ({title, color, icon, onClick, disable = true}) => (
        <Button color={color} disabled={disable} variant="outlined" size="sm" onClick={onClick}>
            {icon}
            <Typography color={disable ? '' : color} fontSize='small' sx={MessageStyle.PaneHeader.BtnText}>
                {title}
            </Typography>
        </Button>
    );

    const sendShortCut = (content) => {
        const msgFromShortCut = {
            content: content,
            contentType: 'text',
        }
        shortCustSend(msgFromShortCut)
        setShortcut(false)
    }

    const sendToMoreRoom = (roomId) => {
        sendTo(roomId);
        setSendingOpen(false);
    }

    return (
        <>
            <Stack direction="row" sx={MessageStyle.PaneHeader.Stack}>
                <Stack direction="row" spacing={{xs: 1, md: 2}} sx={{alignItems: 'center'}}>
                    <Avatar size="lg" src={sender.avatar}/>
                    <div onClick={()=>openMessagesPane()}>
                        <Typography component="h2" noWrap sx={MessageStyle.PaneHeader.HeadTitle}>
                            {sender.custName}
                        </Typography>
                        <Chip size='sm' sx={{display : {xs : 'none'}}}>
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

            {/* modal ส่งต่อไปยัง */}
            <Modal open={sendingOpen} onClose={() => setSendingOpen(false)}>
                <ModalDialog>
                    <ModalClose/>
                    <Typography component="h2">ส่งต่อไปยัง</Typography>
                    <Typography>ห้องแชท</Typography>
                    {chatRooms.length > 0 && (
                        chatRooms.map((room, index) => (
                            <Button
                                onClick={() => sendToMoreRoom(room.roomId)}
                                key={index} disabled={(room.id === roomSelect.id) || (room.roomId === 'ROOM00')}
                            >
                                {room.roomName}
                            </Button>
                        ))
                    )}
                </ModalDialog>
            </Modal>
            {/* modal ตัวช่วยตอบ */}
            <Modal open={shortCut} onClose={() => setShortcut(false)}>
                <ModalDialog>
                    <ModalClose/>
                    <Typography component="h2">ตัวช่วยตอบ</Typography>
                    {shortChat.length > 0 && (
                        shortChat.map((row, index) => (
                            <Button onClick={() => sendShortCut(row.content)} color='warning' key={index}>
                                {row.content}
                            </Button>
                        ))
                    )}
                </ModalDialog>
            </Modal>
        </>
    );
}

export default MessagePaneHeader;