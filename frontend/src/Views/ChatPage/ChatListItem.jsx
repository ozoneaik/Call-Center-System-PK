import Box from '@mui/joy/Box';
import ListDivider from '@mui/joy/ListDivider';
import ListItem from '@mui/joy/ListItem';
import ListItemButton from '@mui/joy/ListItemButton';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import CircleIcon from '@mui/icons-material/Circle';
import AvatarWithStatus from './AvatarWithStatus';
import {toggleMessagesPane} from "../../Components/utils.js";
import {useState} from "react";
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import DialogActions from '@mui/joy/DialogActions';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import Divider from "@mui/joy/Divider";
import Button from "@mui/joy/Button";
import TextsmsIcon from '@mui/icons-material/Textsms';
import Avatar from "@mui/joy/Avatar";
import {changeRoomApi} from "../../Api/chatRooms.js";

export default function ChatListItem(props) {
    const {id, chatRooms, sender, messages, selectedChatId, setSelectedChat} = props;
    const selected = selectedChatId === id;
    const [open, setOpen] = useState(false);
    const handleChangeRoom = async (roomId, custId) => {
        const {data, status} = await changeRoomApi(roomId, custId);
        if (status === 200) {
            alert(data.message)
            location.reload()
        } else {
            alert('unSuccess')
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
                            <p><span style={{fontWeight: "bold"}}>ชื่อลูกค้า :</span> {sender.name}</p>
                            <p><span style={{fontWeight: "bold"}}>รายละเอียด :</span> {sender.description}</p>
                            <p><span style={{fontWeight: "bold"}}>จาก :</span> Line</p>
                        </Box>
                        <Divider/>
                        <Box>
                            <Typography level="title-sm">ย้ายไปยังห้อง</Typography>
                            {
                                chatRooms.length > 0 ? (
                                    chatRooms.map((chatRoom, index) => (
                                            <Button
                                                onClick={() => handleChangeRoom(chatRoom.id, sender.custId)}
                                                disabled={chatRoom.id === sender.roomId}
                                                sx={{mr: 1}} key={index} size='sm' variant='outlined'
                                            >
                                                {chatRoom.name}
                                            </Button>
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
                        setOpen(true);
                    }}
                    selected={selected}
                    color="neutral"
                    sx={{flexDirection: 'column', alignItems: 'initial', gap: 1}}
                >
                    <Stack direction="row" spacing={1.5}>
                        <AvatarWithStatus online={sender.online} src={sender.avatar}/>
                        <Box sx={{flex: 1}}>
                            <Typography level="title-sm">{sender.name}</Typography>
                            <Typography level="title-sm" fontSize={'smaller'}>{sender.description}</Typography>
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
                            messages[0].contentType === 'text' ? messages[0].content : 'ส่งรูปภาพ หรือ Sticker เข้ามา'
                        }
                    </Typography>
                </ListItemButton>
            </ListItem>
            <ListDivider sx={{margin: 0}}/>
        </>
    );
}