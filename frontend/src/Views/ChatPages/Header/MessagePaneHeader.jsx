import {MessageStyle} from "../../../styles/MessageStyle.js";
import Stack from "@mui/joy/Stack";
import Avatar from "@mui/joy/Avatar";
import Typography from "@mui/joy/Typography";
import {Button, Modal, ModalClose, ModalDialog} from "@mui/joy";
import Chip from "@mui/joy/Chip";
import AddCommentIcon from '@mui/icons-material/AddComment';
import {useState} from "react";
import {useAuth} from "../../../context/AuthContext.jsx";
import {openMessagesPane} from "../../../utils.js";
import {ShortChatContent} from "../../../Components/ShortChatContent.jsx";
import {EndTalk} from "./EndTalk.jsx";
import {ChangeRoom} from "./ChangeRoom.jsx";
import {useNavigate} from "react-router-dom";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

function MessagePaneHeader(props) {
    const navigate = useNavigate();
    const {user} = useAuth();
    const {sender, chatRooms, roomSelect, shortCustSend, check, rateId, activeId, tags,listAllChatRooms} = props;
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
        setShortcut(false);
    }
    return (
        <>
            <Stack direction="row" sx={MessageStyle.PaneHeader.Stack}>
                <Stack direction="row" spacing={{xs: 1, md: 2}} sx={{alignItems: 'center'}}>
                    <Button onClick={()=>navigate(-1)} variant="outlined">
                        <ArrowBackIosIcon/>
                    </Button>
                    <Avatar size="lg" src={sender.avatar}/>
                    <div onClick={() => openMessagesPane()}>
                        <Typography component="h2" noWrap sx={MessageStyle.PaneHeader.HeadTitle}>
                            {sender.custName}
                        </Typography>
                        <Chip>
                            {sender.description}
                        </Chip>
                    </div>
                </Stack>
                {check === '1' && (
                    <Stack spacing={1} direction="row" sx={{alignItems: 'center'}}>
                        <ChangeRoom
                            disable={sender.emp !== user.empCode}
                            rateId={rateId} activeId={activeId}
                            chatRooms={chatRooms} roomSelect={roomSelect}
                            listAllChatRooms={listAllChatRooms}
                        />
                        <Btn
                            title={'ตัวช่วยตอบ'} color={'warning'} icon={<AddCommentIcon/>}
                            onClick={() => setShortcut(true)}
                            disable={sender.emp !== user.empCode}
                        />
                        <EndTalk
                            disable={sender.emp !== user.empCode}
                            rateId={rateId} activeId={activeId} tags={tags}
                        />
                    </Stack>
                )}
            </Stack>
            {/* modal ตัวช่วยตอบ */}
            <Modal open={shortCut} onClose={() => setShortcut(false)}>
                <ModalDialog>
                    <ModalClose/>
                    <Typography component="h2">ตัวช่วยตอบ</Typography>
                    <ShortChatContent handle={(content) => sendShortCut(content)}/>
                </ModalDialog>
            </Modal>
        </>
    );
}

export default MessagePaneHeader;