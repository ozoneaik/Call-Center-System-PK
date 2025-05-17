import { MessageStyle } from "../../../styles/MessageStyle.js";
import Stack from "@mui/joy/Stack";
import Avatar from "@mui/joy/Avatar";
import Typography from "@mui/joy/Typography";
import { Button, Modal, ModalClose, ModalDialog, Sheet } from "@mui/joy";
import Chip from "@mui/joy/Chip";
import AddCommentIcon from '@mui/icons-material/AddComment';
import { useState } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { openMessagesPane } from "../../../utils.js";
import { ShortChatContent } from "../../../Components/ShortChatContent.jsx";
import { EndTalk } from "./EndTalk.jsx";
import { ChangeRoom } from "./ChangeRoom.jsx";
import { useNavigate } from "react-router-dom";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { PauseTalk } from "./PauseTalk.jsx";
import { use } from "react";
import { useMediaQuery } from "@mui/material";
import HelpChat from "./HelpChat.jsx";

function MessagePaneHeader(props) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { disable } = props;
    const { sender, chatRooms, roomSelect, shortCustSend, check, rateId, activeId, tags, listAllChatRooms } = props;
    const [shortCut, setShortcut] = useState(false);
    const Btn = ({ title, color, icon, onClick, disable = true }) => (
        <Button
            startDecorator={icon}
            color={color} disabled={disable} variant="solid" size="sm"
            onClick={onClick} fullWidth={useMediaQuery('(max-width: 1000px)')}
        >
            {!useMediaQuery('(max-width: 1000px)') && title}
            
        </Button>
    );
    const sendShortCut = (content) => {
        const msgFromShortCut = {
            content: content,
            contentType: 'text',
            sender : user
        }
        console.log('msgFromShortCut', msgFromShortCut);
        
        shortCustSend(msgFromShortCut)
        setShortcut(false);
    }
    return (
        <>
            {/* <Stack direction={{ sm: 'column', md: 'row' }} spacing={2} sx={MessageStyle.PaneHeader.Stack}> */}
            <Stack direction={{ sm: 'column', md: 'row' }} backgroundColor='background.body' justifyContent='space-between' spacing={2} sx={{p : 1}} borderBottom={1} borderColor='divider'>
                <Stack direction="row" spacing={{ xs: 1, md: 2 }} sx={{ alignItems: 'center' }}>
                    <Button onClick={() => navigate(-1)} variant="outlined">
                        <ArrowBackIosIcon />
                    </Button>
                    <Avatar size="lg" src={sender.avatar} />
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
                    <Stack spacing={1} direction='row' sx={{ alignItems: 'center' }} mt={1}>
                        <ChangeRoom
                            disable={disable || (sender.emp !== user.empCode) && (user.role !== 'admin')}
                            rateId={rateId} activeId={activeId}
                            chatRooms={chatRooms} roomSelect={roomSelect}
                            listAllChatRooms={listAllChatRooms}
                        />
                        <Btn
                            title={'ตัวช่วยตอบ'} color={'warning'} icon={<AddCommentIcon />}
                            onClick={() => setShortcut(true)}
                            disable={disable || (sender.emp !== user.empCode) && (user.role !== 'admin')}
                        />
                        <PauseTalk activeId={activeId} rateId={rateId} disable={disable || (sender.emp !== user.empCode) && (user.role !== 'admin')} />
                        <EndTalk
                            disable={(sender.emp !== user.empCode) && (user.role !== 'admin') || disable}
                            rateId={rateId} activeId={activeId} tags={tags}
                        />
                    </Stack>
                )}
            </Stack>
            {/* modal ตัวช่วยตอบ */}
            <Modal open={shortCut} onClose={() => setShortcut(false)}>
                <ModalDialog>
                    <ModalClose />
                    <Typography component="h2">ตัวช่วยตอบ</Typography>
                    
                        {/* <ShortChatContent handle={(content) => sendShortCut(content)} /> */}                
                            <HelpChat handle={(content) => sendShortCut(content)} />
                    

                </ModalDialog>
            </Modal>
        </>
    );
}

export default MessagePaneHeader;