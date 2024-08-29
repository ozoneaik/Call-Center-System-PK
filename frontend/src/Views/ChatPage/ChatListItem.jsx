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

export default function ChatListItem(props) {
    const { id, sender, messages, selectedChatId, setSelectedChat } = props;
    const selected = selectedChatId === id;
    const [open, setOpen] = useState(false);
    return (
        <>
            <Modal open={open} onClose={() => setOpen(false)}>
                <ModalDialog variant="outlined" role="alertdialog">
                    <DialogTitle>
                        รายละเอียด
                    </DialogTitle>
                    <Divider />
                    <DialogContent>
                        <Avatar src={sender.avatar}/>
                        ชื่อลูกค้า : {sender.name}
                        <br/>
                        รายละเอียด : {sender.username}
                        <br/>
                        จาก : Line
                    </DialogContent>
                    <DialogActions>
                        <Button variant="solid" color="primary" onClick={() => {
                            setOpen(false);
                            toggleMessagesPane();
                            setSelectedChat({ id, sender, messages });
                        }}>
                            <TextsmsIcon/>
                        </Button>
                        <Button variant="solid" color="neutral" onClick={() => setOpen(false)}>จัดการเพิ่มเติม</Button>
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
                    sx={{ flexDirection: 'column', alignItems: 'initial', gap: 1 }}
                >
                    <Stack direction="row" spacing={1.5}>
                        <AvatarWithStatus online={sender.online} src={sender.avatar} />
                        <Box sx={{ flex: 1 }}>
                            <Typography level="title-sm">{sender.name}</Typography>
                            <Typography level="body-sm">{sender.username}</Typography>
                        </Box>
                        <Box sx={{ lineHeight: 1.5, textAlign: 'right' }}>
                            {messages[0].unread && (
                                <CircleIcon sx={{ fontSize: 12 }} color="danger" />
                            )}
                            <Typography
                                level="body-xs"
                                noWrap
                                sx={{ display: { xs: 'none', md: 'block' } }}
                            >
                                5 mins ago
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
                        {messages[0].content}
                    </Typography>
                </ListItemButton>
            </ListItem>
            <ListDivider sx={{ margin: 0 }} />
        </>
    );
}