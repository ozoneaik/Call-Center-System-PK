import Box from '@mui/joy/Box';
import ListDivider from '@mui/joy/ListDivider';
import ListItem from '@mui/joy/ListItem';
import ListItemButton from '@mui/joy/ListItemButton';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import CircleIcon from '@mui/icons-material/Circle';
import AvatarWithStatus from './AvatarWithStatus';
import {toggleMessagesPane} from "../../Components/utils.js";
import {useEffect, useState} from "react";
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import DialogActions from '@mui/joy/DialogActions';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import Divider from "@mui/joy/Divider";
import Button from "@mui/joy/Button";
import TextsmsIcon from '@mui/icons-material/Textsms';
import Avatar from "@mui/joy/Avatar";
import {checkRoomListApi} from "../../Api/chatRooms.js";

export default function ChatListItem(props) {
    const {id, sender, messages, selectedChatId, setSelectedChat} = props;
    const selected = selectedChatId === id;
    const [chatRooms, setChatRooms] = useState([]);
    const [open, setOpen] = useState(false);
    useEffect(() => {
        getChatRooms().then(() => {
        });
    }, []);
    const getChatRooms = async () => {
        const {data, status} = await checkRoomListApi();
        if (status === 200) {
            setChatRooms(data.chatRooms)
        }
    }
    return (
        <>
            <Modal open={open} onClose={() => setOpen(false)}>
                <ModalDialog variant="outlined" role="alertdialog">
                    <DialogTitle>
                        รายละเอียด
                    </DialogTitle>
                    <Divider/>
                    <DialogContent>
                        <Box>
                            <Avatar src={sender.avatar}/>
                            ชื่อลูกค้า : {sender.name}
                            <br/>
                            รายละเอียด : {sender.username}
                            <br/>
                            จาก : Line
                            <br/>
                        </Box>
                        <Divider/>
                        <Box>
                            <Typography level="title-sm">ย้ายไปยังห้อง</Typography>
                            <Button disabled={sender.roomId === 0} sx={{mr: 1}} size='sm' variant='outlined'>ห้องแชทรวม</Button>
                            {
                                chatRooms.length > 0 ? (
                                    chatRooms.map((chatRoom, index) => (
                                            <Button disabled={chatRoom.id === sender.roomId} sx={{mr: 1}} key={index}
                                                    size='sm' variant='outlined'>{chatRoom.name}</Button>
                                        )
                                    )
                                ) : (
                                    <>ไม่พบรายการ</>
                                )
                            }
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button variant="solid" color="primary" onClick={() => {
                            setOpen(false);
                            console.log(id)
                            toggleMessagesPane();
                            setSelectedChat({id, sender, messages});
                            localStorage.setItem('selectChat', id);
                        }}>
                            <TextsmsIcon/>
                        </Button>
                        <Button variant="solid" color="neutral" onClick={() => {
                            setOpen(false);
                        }}>จัดการข้อมูล</Button>
                    </DialogActions>
                </ModalDialog>
            </Modal>

            <ListItem>
                <ListItemButton
                    onClick={() => {
                        setOpen(true)
                    }}
                    selected={selected}
                    color="neutral"
                    sx={{flexDirection: 'column', alignItems: 'initial', gap: 1}}
                >
                    <Stack direction="row" spacing={1.5}>
                        <AvatarWithStatus online={sender.online} src={sender.avatar}/>
                        <Box sx={{flex: 1}}>
                            <Typography level="title-sm">{sender.name}</Typography>
                            <Typography level="body-sm">{sender.description}</Typography>
                        </Box>
                        <Box sx={{lineHeight: 1.5, textAlign: 'right'}}>
                            {messages[0].unread && (
                                <CircleIcon sx={{fontSize: 12}} color="danger"/>
                            )}
                            <Typography
                                level="body-xs"
                                noWrap
                                sx={{display: {xs: 'none', md: 'block'}}}
                            >
                                {new Date(messages[0].created_at).toLocaleString()}
                            </Typography>
                        </Box>
                    </Stack>
                    <Typography
                        level="body-sm"
                        sx={{
                            display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical',
                            overflow: 'hidden', textOverflow: 'ellipsis',
                        }}
                    >
                        {
                            messages[0].contentType === 'text' ? messages[0].content : 'ส่งไฟล์เข้ามา'
                        }
                    </Typography>
                </ListItemButton>
            </ListItem>
            <ListDivider sx={{margin: 0}}/>
        </>
    );
}