import Avatar from '@mui/joy/Avatar';
import Button from '@mui/joy/Button';
import Chip from '@mui/joy/Chip';
import IconButton from '@mui/joy/IconButton';
import SendIcon from '@mui/icons-material/Send';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import CircleIcon from '@mui/icons-material/Circle';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import {toggleMessagesPane} from "../../Components/utils.js";
import {useEffect, useState} from "react";
import Modal from "@mui/joy/Modal";
import DialogTitle from "@mui/joy/DialogTitle";
import ModalDialog from "@mui/joy/ModalDialog";
import Divider from "@mui/joy/Divider";
import DialogContent from "@mui/joy/DialogContent";
import OpenInNew from '@mui/icons-material/OpenInNew';
import Box from "@mui/joy/Box";
import {Grid} from "@mui/joy";
import {userListApi} from "../../Api/User.js";
import {shortChatListApi} from "../../Api/shortChats.js";
import {SendMessageApi} from "../../Api/sendMessage.js";
import {changeUserReplyApi} from "../../Api/Customer.js";
import {BackIcon, ButtonTextShortCut, PaneHeader} from "../../assets/styles/MessagePaneStyle.js";

export default function MessagesPaneHeader({sender}) {
    const [open, setOpen] = useState(false);
    const [sendToEmp, setSendToEmp] = useState(false);
    const [users, setUsers] = useState([]);
    const [shortChats, setShortChats] = useState([]);

    useEffect(() => {
        userListApi().then(({data, status}) => status === 200 && setUsers(data.users));
        shortChatListApi().then(({data, status}) => status === 200 && setShortChats(data.short_chats));
    }, []);

    const shortChatSubmit = async (custId, Item) => {
        const {status} = await SendMessageApi(Item, custId);
        if (status === 200) {
            alert('ส่งสำเร็จ');
        }
        setOpen(false);
    }
    const changeUserReply = async (custId, Item) => {
        const {status} = await changeUserReplyApi(Item, custId);
        if (status === 200) {
            await shortChatSubmit(custId, 'ระบบได้กำลังย้ายท่านไปหาช่าง')
            alert('ย้ายสำเร็จ');
        }
        setSendToEmp(false);
    }

    const renderButtons = (items, keyPrefix) => items.map((item, index) => {
        return (
            <Grid key={`${keyPrefix}-${index}`} size={4}>
                <Button
                    startDecorator={<OpenInNew/>}
                    onClick={() => {
                        keyPrefix === 'shortChat' ?
                            shortChatSubmit(sender.custId, item.chat_text) : changeUserReply(sender.custId, item.code)
                    }}
                >
                    {item.code || item.chat_text} {item.name}
                </Button>
            </Grid>
        )
    });

    const modalDialog = ({prefix, isOpen, handleClose}) => {
        return (
            <Modal open={isOpen} onClose={handleClose}>
                <ModalDialog variant="outlined" role="alertdialog">
                    <DialogTitle>
                        {prefix === 'shortChat' ? (<><RateReviewIcon /> ตัวช่วยตอบ</>) : (<><SendIcon /> ส่งต่อไปยัง</>)}
                    </DialogTitle>
                    <Divider />
                    <DialogContent>
                        <Box component="section" sx={{ p: 1 }}>
                            <Grid container spacing={1} sx={{ flexGrow: 1 }}>
                                {prefix === 'shortChat' ? renderButtons(shortChats, 'shortChat') : renderButtons(users, 'user')}
                            </Grid>
                        </Box>
                    </DialogContent>
                </ModalDialog>
            </Modal>
        );
    };

    return (
        <>
            {modalDialog({prefix: 'shortChat', isOpen: open, handleClose: () => setOpen(false)})}
            {modalDialog({prefix: 'user', isOpen: sendToEmp, handleClose: () => setSendToEmp(false)})}
            <Stack direction="row" sx={PaneHeader}>
                <Stack direction="row" spacing={2} sx={{alignItems: 'center'}}>
                    <IconButton size="sm" sx={BackIcon} onClick={toggleMessagesPane}>
                        <ArrowBackIosNewRoundedIcon/>
                    </IconButton>
                    <Avatar size="lg" src={sender.avatar}/>
                    <div>
                        <Typography component="h2" noWrap endDecorator={
                            sender.online && (
                                <Chip
                                    variant="outlined" size="sm" color="neutral" sx={{borderRadius: 'sm'}}
                                    startDecorator={<CircleIcon sx={{fontSize: 8}} color="success"/>}
                                >
                                    Online
                                </Chip>
                            )
                        } sx={{fontWeight: 'lg', fontSize: 'lg'}}>
                            {sender.name}
                        </Typography>
                        <Typography level="body-sm">{sender.description}</Typography>
                    </div>
                </Stack>
                <Stack spacing={1} direction="row" sx={{alignItems: 'center'}}>
                    <Button variant="outlined" color="neutral" onClick={() => setSendToEmp(true)}>
                        <Typography sx={ButtonTextShortCut}>ส่งต่อ</Typography>&nbsp;<SendIcon/>
                    </Button>
                    <Button variant="outlined" color="neutral" onClick={() => setOpen(true)}>
                        <Typography sx={ButtonTextShortCut}>ช่วยตอบ</Typography>&nbsp;
                        <RateReviewIcon/>
                    </Button>
                </Stack>
            </Stack>
        </>
    );
}