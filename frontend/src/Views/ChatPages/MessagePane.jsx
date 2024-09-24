import {useParams} from "react-router-dom";
import {Button, Sheet, Textarea} from "@mui/joy";
import {MessageStyle} from "../../styles/MessageStyle.js";
import MessagePaneHeader from "./MessagePaneHeader.jsx";
import Box from "@mui/joy/Box";
import Stack from "@mui/joy/Stack";
import Avatar from "@mui/joy/Avatar";
import {useEffect, useState} from "react";
import {chatRoomListApi, MessageCustApi, shortChatApi} from "../../api/Messages.js";
import {useAuth} from "../../context/AuthContext.jsx";
import FormControl from "@mui/joy/FormControl";
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ChatBubble from "./ChatBubble.jsx";
import {useNotification} from "../../context/NotiContext.jsx";

export default function MessagePane() {
    const {user} = useAuth();
    const {notification} = useNotification();
    const [messages, setMessages] = useState([]);
    const [sender, setSender] = useState({
        code : 'ไม่พบ code',
        avatar : 'ไม่พบ avatar',
        name : 'ไม่พบ name',
        description : 'ไม่พบ description'
    });
    const {custId} = useParams();
    const [chatRooms, setChatRooms] = useState([{chatRooms : []}]);
    const [shortChat, setShortChat] = useState([{short_chats : []}])

    useEffect(() => {
        const fetchData = async () => {
            const {data, status} = await MessageCustApi(custId);
            if (status === 200) {
                setMessages(data.chats.messages);
                setSender(data.chats.sender)
            }
        }
        const fetchChatRoom = async () => {
            const {data,status} = await chatRoomListApi();
            status === 200 && setChatRooms(data.chatRooms)
        }
        fetchData().then(()=> {
            fetchChatRoom().then(async ()=>{
                const {data,status} = await shortChatApi();
                status === 200 && setShortChat(data.short_chats);
            })
        })
    }, [])
    useEffect(() => {
        if (notification){
            if (notification.custId === sender.custId){
                setMessages((prevMessages) => {
                    const newId = prevMessages.length.toString();
                    return [
                        ...prevMessages,
                        {
                            id: newId,
                            content: notification.content,
                            contentType : notification.contentType,
                            sender: sender,
                            created_at: new Date().toString()
                        },
                    ];
                });
            }
        }
    }, [notification]);
    return (
        <>
            <Sheet sx={MessageStyle.Layout}>
                {/*Message Pane Header*/}
                <MessagePaneHeader sender={sender} chatRooms={chatRooms} shortChat={shortChat}/>
                {/*Message pane*/}
                <Box sx={MessageStyle.PaneContent}>
                    <Stack spacing={2} sx={{justifyContent: 'flex-end'}}>
                        {messages.map((message, index) => {
                            const isYou = message.sender.code === user.code;
                            return (
                                <Stack
                                    key={index} direction="row" spacing={2}
                                    sx={{flexDirection: isYou ? 'row-reverse' : 'row'}}
                                >
                                    {message.sender !== user.code && (<Avatar src={message.sender.avatar}/>)}
                                    <ChatBubble variant={isYou ? 'sent' : 'received'} {...message} />
                                </Stack>
                            );
                        })}
                    </Stack>
                </Box>
                {/* Message Input */}
                <Box sx={{ px: 2, pb: 3 }}>
                    <FormControl>
                        <Textarea
                            placeholder="พิมพ์ข้อความที่นี่..."
                            minRows={3} maxRows={10}
                            endDecorator={
                                <Stack direction="row" sx={MessageStyle.TextArea}>
                                    <Button color="primary" endDecorator={<SendRoundedIcon />}>
                                        ส่ง ( ctrl+enter )
                                    </Button>
                                </Stack>
                            }
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                                    // handleClick();
                                    alert('handleClick')
                                }
                            }}
                        />
                    </FormControl>
                </Box>
            </Sheet>
        </>
    )
}