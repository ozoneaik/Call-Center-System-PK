import { MessageStyle } from "../../../styles/MessageStyle.js";
import Stack from "@mui/joy/Stack";
import Avatar from "@mui/joy/Avatar";
import Typography from "@mui/joy/Typography";
import { Button, IconButton, Modal, ModalClose, ModalDialog } from "@mui/joy";
import Chip from "@mui/joy/Chip";
import AddCommentIcon from '@mui/icons-material/AddComment';
import { useState } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { EndTalk } from "./EndTalk.jsx";
import { ChangeRoom } from "./ChangeRoom.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { PauseTalk } from "./PauseTalk.jsx";
import { useMediaQuery } from "@mui/material";
import HelpChat from "./HelpChat.jsx";
import Box from '@mui/joy/Box';

function MessagePaneHeader(props) {
    const navigate = useNavigate();
    const { prevUrlfrom } = props;
    const { user } = useAuth();
    const { disable } = props;
    const { sender, chatRooms, roomSelect, shortCustSend, check, rateId, activeId, tags, listAllChatRooms, highlightedRoomColor } = props;
    const [shortCut, setShortcut] = useState(false);
    const isMobile = useMediaQuery('(max-width: 768px)');
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
            sender: user
        }
        console.log('msgFromShortCut', msgFromShortCut);

        shortCustSend(msgFromShortCut)
        setShortcut(false);
    }

    const handleBack = () => {
        console.log('prev location', window.history);
        navigate(prevUrlfrom || '/', { replace: true });
    }
    const actionDisabled = disable || (sender.emp !== user.empCode) && (user.role !== 'admin');
    const actionButtons = check === '1' && (
        <>
            <ChangeRoom
                disable={actionDisabled}
                rateId={rateId} activeId={activeId}
                chatRooms={chatRooms} roomSelect={roomSelect}
                listAllChatRooms={listAllChatRooms}
                tokenId={sender.platformRef}
            />
            <Btn
                title={'ตัวช่วยตอบ'} color={'warning'} icon={<AddCommentIcon />}
                onClick={() => setShortcut(true)}
                disable={actionDisabled}
            />
            <PauseTalk activeId={activeId} rateId={rateId} disable={actionDisabled} />
            <EndTalk
                disable={actionDisabled}
                rateId={rateId} activeId={activeId} tags={tags}
            />
        </>
    );

    // มือถือ: header แถวเดียวแบบ LINE — ปุ่มย้อนกลับ, รูป+ชื่อ, ปุ่มดำเนินการเป็นไอคอนด้านขวา
    const mobileHeader = (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 0.5,
                py: 0.75,
                ...(highlightedRoomColor
                    ? { backgroundColor: highlightedRoomColor, color: '#fff' }
                    : { backgroundColor: 'background.surface', borderBottom: '1px solid', borderColor: 'divider' }),
            }}
        >
            <IconButton variant="plain" onClick={handleBack} sx={{ color: 'inherit', flexShrink: 0 }}>
                <ArrowBackIosNewIcon />
            </IconButton>
            <Avatar size="sm" src={sender.avatar} sx={{ flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography level="title-md" noWrap sx={{ fontWeight: 700, color: 'inherit' }}>
                    {sender.custName}
                </Typography>
                <Typography
                    level="body-xs" noWrap
                    sx={{ color: highlightedRoomColor ? 'rgba(255,255,255,0.85)' : 'text.tertiary' }}
                >
                    ID {sender.id} · {sender.description}
                </Typography>
            </Box>
            {actionButtons && (
                <Box
                    sx={{
                        display: 'flex',
                        flexShrink: 0,
                        '& .MuiButton-root': {
                            width: 'auto',
                            minWidth: 34,
                            minHeight: 34,
                            px: 0.75,
                            backgroundColor: 'transparent',
                            boxShadow: 'none',
                            '&:hover, &:active': { backgroundColor: 'rgba(0,0,0,0.06)' },
                            '&.Mui-disabled': { backgroundColor: 'transparent', opacity: 0.4 },
                            '& .MuiButton-startDecorator': { m: 0 },
                        },
                        '& .MuiButton-colorPrimary': { color: highlightedRoomColor ? '#fff' : 'primary.500' },
                        '& .MuiButton-colorWarning': { color: highlightedRoomColor ? '#fff' : 'warning.500' },
                        '& .MuiButton-colorNeutral': { color: highlightedRoomColor ? '#fff' : 'neutral.500' },
                        '& .MuiButton-colorSuccess': { color: highlightedRoomColor ? '#fff' : 'success.500' },
                    }}
                >
                    {actionButtons}
                </Box>
            )}
        </Box>
    );

    return (
        <>
            {isMobile ? mobileHeader : (
            <>
            {/* <Stack direction={{ sm: 'column', md: 'row' }} spacing={2} sx={MessageStyle.PaneHeader.Stack}> */}
            {/* ห้องของร้านที่อยู่ใน HIGHLIGHTED_SHOP_NAMES (MessagePane/main.jsx) จะได้กรอบ+พื้นหลังสีนี้ที่ header bar ให้สังเกตได้ทันทีว่าเป็นร้านไหน */}
            <Stack
                direction={{ sm: 'column', md: 'row' }}
                justifyContent='space-between' spacing={2}
                sx={{
                    p: 1,
                    ...(highlightedRoomColor
                        ? { border: `2px solid ${highlightedRoomColor}`, backgroundColor: highlightedRoomColor }
                        : { backgroundColor: 'background.body', borderBottom: '1px solid', borderColor: 'divider' }),
                }}
            >
                <Stack direction="row" spacing={{ xs: 1, md: 2 }} sx={{ alignItems: 'center' }}>
                    <Button
                        onClick={handleBack} variant="outlined"
                        sx={highlightedRoomColor ? { color: '#fff', borderColor: '#fff' } : undefined}
                    >
                        <ArrowBackIosIcon />
                    </Button>
                    <Avatar size="lg" src={sender.avatar} />
                    <div>
                        <Box display='flex' justifyContent='flex-start' alignItems='center' gap={1}>
                            <Typography
                                component="h2" noWrap
                                sx={{ ...MessageStyle.PaneHeader.HeadTitle, ...(highlightedRoomColor && { color: '#fff' }) }}
                            >
                                {sender.custName} |
                            </Typography>
                            <Typography
                                component="h2" noWrap
                                sx={{ ...MessageStyle.PaneHeader.HeadTitle, ...(highlightedRoomColor && { color: '#fff' }) }}
                                color={highlightedRoomColor ? undefined : "primary"}
                            >
                                ID : {sender.id}
                            </Typography>
                        </Box>

                        <Chip>
                            {sender.description}
                        </Chip>
                    </div>
                </Stack>
                {check === '1' && (
                    <Stack spacing={1} direction='row' sx={{ alignItems: 'center' }} mt={1}>
                        {actionButtons}
                    </Stack>
                )}
            </Stack>
            </>
            )}
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