import {useParams} from "react-router-dom";
import {Button, Sheet, Textarea} from "@mui/joy";
import {MessageStyle} from "../../styles/MessageStyle.js";
import MessagePaneHeader from "./MessagePaneHeader.jsx";
import Box from "@mui/joy/Box";
import Stack from "@mui/joy/Stack";
import Avatar from "@mui/joy/Avatar";
import {useEffect, useState} from "react";
import {chatRoomListApi, selectMessageApi, shortChatApi} from "../../api/Messages.js";
import {useAuth} from "../../context/AuthContext.jsx";
import FormControl from "@mui/joy/FormControl";
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ChatBubble from "./ChatBubble.jsx";
import {useNotification} from "../../context/NotiContext.jsx";
import {AlertDiaLog} from "../../Dialogs/Alert.js";

export default function MessagePane() {
    const {user} = useAuth();
    const {notification} = useNotification();
    const [messages, setMessages] = useState({});
    const [sender, setSender] = useState({
        custId: 'id ของลูกค้า',
        avatar: 'รูปประจำตัว',
        custName: 'ไม่พบ name',
        description: 'ไม่พบ description',
        emp : ''
    });
    const {rateId, activeId, custId} = useParams();
    const [chatRooms, setChatRooms] = useState([{chatRooms: []}]);
    const [shortChat, setShortChat] = useState([{short_chats: []}])

    useEffect(() => {
        const fetchData = async () => {
            const {data, status} = await selectMessageApi(rateId, activeId, custId);
            if (status === 200) {
                setMessages(data.list);
                setSender(data.sender)
            } else {
                AlertDiaLog({
                    title: 'เกิดข้อผิดพลาด',
                    text: data.message,
                    onPassed: (confirm) => confirm ? window.close() : ''
                });
            }
        }
        const fetchChatRoom = async () => {
            const {data, status} = await chatRoomListApi();
            status === 200 && setChatRooms(data.chatRooms);
        }
        fetchData().then(() => {
            fetchChatRoom().then(async () => {
                const {data, status} = await shortChatApi();
                console.log(data, status);
                status === 200 && setShortChat(data.list);
            });
        });
    }, [])
    useEffect(() => {
        if (notification) {
            if (notification.custId === sender.custId) {
                setMessages((prevMessages) => {
                    const newId = prevMessages.length.toString();
                    return [
                        ...prevMessages,
                        {
                            id: newId,
                            content: notification.content,
                            contentType: notification.contentType,
                            sender: sender,
                            created_at: new Date().toString()
                        },
                    ];
                });
            } else console.log('ตรวจพบการแจ้งเตือนที่เกี่ยวข้อง')
        } else console.log('การแจ้งเตือนที่ไม่เกี่ยวข้อง')
    }, [notification]);


    const handleSend = () => {
        alert('handleSend')
    }
    return (
        <>
            <Sheet sx={MessageStyle.Layout}>
                {/*Message Pane Header*/}
                <MessagePaneHeader sender={sender} chatRooms={chatRooms} shortChat={shortChat}/>
                {/*Message pane*/}
                <Box sx={MessageStyle.PaneContent}>
                    <Stack spacing={2} sx={{justifyContent: 'flex-end'}}>
                        {
                            messages.length > 0 && (
                                messages.map((message, index) => {
                                    const isYou = message.sender.empCode === user.empCode;
                                    return (
                                        <Stack
                                            key={index} direction="row" spacing={2}
                                            sx={{flexDirection: isYou ? 'row-reverse' : 'row'}}
                                        >
                                            <Avatar src={message.sender.avatar}/>
                                            <ChatBubble variant={isYou ? 'sent' : 'received'} {...message} />
                                        </Stack>
                                    );
                                })
                            )
                        }
                    </Stack>
                </Box>
                {/* Message Input */}
                <Box sx={{px: 2, pb: 3}}>
                    <FormControl>
                        <Textarea
                            disabled={sender.emp !== user.empCode}
                            placeholder="พิมพ์ข้อความที่นี่..."
                            minRows={3} maxRows={10}
                            endDecorator={
                                <Stack direction="row" sx={MessageStyle.TextArea}>
                                    <Button
                                        disabled={sender.emp !== user.empCode}
                                        color="primary"
                                        endDecorator={<SendRoundedIcon/>}
                                        onClick={handleSend}>
                                        ส่ง ( ctrl+enter )
                                    </Button>
                                </Stack>
                            }
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                                    handleSend()
                                }
                            }}
                        />
                    </FormControl>
                </Box>
            </Sheet>
        </>
    )
}