import ChatIcon from "@mui/icons-material/Chat";
import Button from "@mui/joy/Button";
import React, {useState} from "react";
import {useAuth} from "../context/AuthContext.jsx";
import {MyMessagesApi} from "../Api/Messages.js";
import Typography from "@mui/joy/Typography";
import {Badge, ListItemDecorator, Modal} from "@mui/joy";
import List from '@mui/joy/List';
import Sheet from "@mui/joy/Sheet";
import ListItem from "@mui/joy/ListItem";
import ListItemContent from "@mui/joy/ListItemContent";
import Avatar from "@mui/joy/Avatar";

export default function FloatingBtn() {
    const [chats, setChats] = useState([]);
    const [open, setOpen] = useState(false);
    const {user} = useAuth();
    const [count , setCount] = useState(0);
    const handleClick = async () => {
        const {data} = await MyMessagesApi(user.empCode);
        setOpen(!open);
        setChats(data.detail)
        setCount(data.detail.length);
    }

    const handleRedirect = (selected) => {
        console.log('test')
        const params = `${selected.rateId}/${selected.activeId}/${selected.custId}`;
        const path = `${window.location.origin}/select/message/${params}`;
        const win = window.open(path, '_blank', 'width=900,height=800');
        win && win.focus();
    }

    return (
        <>
            <Modal
                aria-labelledby="modal-title" aria-describedby="modal-desc"
                open={open} onClose={() => setOpen(false)}
                sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}
            >
                <Sheet variant="outlined" sx={{p: 2, borderRadius: 'md', boxShadow: 'lg'}}>
                    <List aria-labelledby="ellipsis-list-demo" sx={{'--ListItemDecorator-size': '56px'}}>
                        <Typography mb={2} fontWeight='bold'>ข้อความที่กำลังสนทนา</Typography>
                        {chats && chats.length > 0 && chats.map((chat, index) => (
                            <ListItem onClick={() => handleRedirect(chat)} sx={{
                                '&:hover': {
                                    backgroundColor: 'primary.softBg', cursor: 'pointer',
                                },
                                    borderRadius: 10,mb : 1, width : 300
                            }} key={index}>
                                <ListItemDecorator>
                                    <Avatar src={chat.avatar}/>
                                </ListItemDecorator>
                                <ListItemContent>
                                    <Typography level="title-sm">{chat.custName}</Typography>
                                    <Typography level="body-sm" noWrap mt={0.75}>
                                        {chat.content}
                                    </Typography>
                                </ListItemContent>
                            </ListItem>
                        ))}
                    </List>
                </Sheet>

            </Modal>


            <Button onClick={handleClick}
                    variant="solid" color="primary"
                    sx={{
                        position: 'fixed', bottom: 16, right: 16, borderRadius: '50%',
                        padding: 0, width: 56, height: 56, minWidth: 'unset', zIndex: 1
                    }}
            >
                <Badge
                    badgeContent={count} color="danger"
                    sx={{"& .MuiBadge-badge": {right: -12, top: -10, border: `2px solid white`, padding: '1',}}}
                >
                <ChatIcon/>
                </Badge>
            </Button>
        </>
    )
}