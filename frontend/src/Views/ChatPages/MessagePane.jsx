import {useParams} from "react-router-dom";
import {Button, Sheet, Textarea} from "@mui/joy";
import {MessageStyle} from "../../styles/MessageStyle.js";
import MessagePaneHeader from "./MessagePaneHeader.jsx";
import Box from "@mui/joy/Box";
import Stack from "@mui/joy/Stack";
import Avatar from "@mui/joy/Avatar";
import {useEffect, useState} from "react";
import {chatRoomListApi, endTalkApi, selectMessageApi, sendApi, senToApi, shortChatApi} from "../../api/Messages.js";
import {useAuth} from "../../context/AuthContext.jsx";
import FormControl from "@mui/joy/FormControl";
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import LocalSeeIcon from '@mui/icons-material/LocalSee';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
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
        emp: ''
    });
    const {rateId, activeId, custId} = useParams();
    const [chatRooms, setChatRooms] = useState([{chatRooms: []}]);
    const [shortChat, setShortChat] = useState([{short_chats: []}]);
    const [msg, setMsg] = useState({
        content: '',
        contentType: 'text',
        sender: ''
    });
    const [roomSelect, setRoomSelect] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            const {data, status} = await selectMessageApi(rateId, activeId, custId);
            if (status === 200) {
                setMessages(data.list);
                setRoomSelect(data.room);
                setSender(data.sender)
            } else {
                AlertDiaLog({
                    title: 'เกิดข้อผิดพลาด',
                    text: data.message,
                    onPassed: (confirm) => confirm && window.close()
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
                status === 200 && setShortChat(data.list);
            });
        });
    }, []);

    // ตรวจจับข้อความใหม่จาก ลูกค้า
    useEffect(() => {
        console.log(notification)
        if (notification && notification.title === 'มีข้อความใหม่เข้ามา') {
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

    const sendFromShortCut = async (c) => {
        await handleSend(c)
    }

    const handleSend = async (c) => {
        const C = c ? {...c} : msg;
        console.log(C)
        const {data, status} = await sendApi({
            msg: C,
            custId: sender.custId,
            conversationId: activeId
        });
        if (status === 200) {
            setMsg({content: '', contentType: 'text', sender: ''});
            setMessages((prevMessages) => {
                const newId = prevMessages.length.toString();
                return [
                    ...prevMessages,
                    {
                        id: newId,
                        content: C.content,
                        contentType: C.contentType,
                        sender: user,
                        created_at: new Date().toString()
                    },

                ]
            })
        } else AlertDiaLog({title: data.message, text: data.detail, onPassed: () => console.log('')});
    }

    const handleChangeRoom = async (roomId) => {
        console.log(roomId)
        const {data, status} = await senToApi({rateId, activeConversationId: activeId, latestRoomId: roomId});
        if (status === 200) {
            AlertDiaLog({
                title: data.message, text: data.detail, icon: 'success', onPassed: (confirm) => {
                    window.close()
                }
            })
        } else {
            AlertDiaLog({
                title: data.message, text: data.detail, onPassed: (confirm) => {
                }
            })
        }
    }

    const endTalk = (e) => {
        AlertDiaLog({
            title: `จบการสนทนา ${rateId} ${activeId}`,
            text: 'กด "ตกลง" เพื่อจบการสนทนา (หากคุณต้องการส่งต่อกรุณากดที่ปุ่ม "ส่งต่อไปยัง" แทน)',
            icon: 'info',
            onPassed: async (confirm) => {
                if (confirm) {
                    const {data, status} = await endTalkApi({rateId, activeConversationId: activeId});
                    AlertDiaLog({
                        title : data.message,
                        text: data.detail,
                        icon: status === 200 ? 'success' : 'error',
                        onPassed: () => window.close()
                    });
                } else console.log('กด ยกเลิก การจบสนทนา')
            }
        });
    };

    return (
        <>
            <Sheet sx={MessageStyle.Layout}>
                {/*Message Pane Header*/}
                <MessagePaneHeader
                    endTalk = {(e) => endTalk(e)}
                    sendTo={(c) => handleChangeRoom(c)}
                    shortCustSend={(c) => sendFromShortCut(c)}
                    sender={sender}
                    chatRooms={chatRooms}
                    shortChat={shortChat}
                    roomSelect={roomSelect}
                />
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
                            id='inputSend'
                            disabled={sender.emp !== user.empCode}
                            placeholder="พิมพ์ข้อความที่นี่..."
                            minRows={3} maxRows={10}
                            value={msg.content}
                            onChange={(e) => setMsg({...msg, content: e.target.value})}
                            endDecorator={
                                <Stack direction="row" sx={MessageStyle.TextArea}>
                                    <Button
                                        disabled={sender.emp !== user.empCode}
                                        color="warning"
                                        endDecorator={<InsertEmoticonIcon/>}
                                        onClick={handleSend}
                                        sx={{mr: 1}}
                                    >
                                        ส่ง sticker
                                    </Button>
                                    <Button
                                        disabled={sender.emp !== user.empCode}
                                        color="danger"
                                        endDecorator={<LocalSeeIcon/>}
                                        onClick={handleSend}
                                        sx={{mr: 1}}
                                    >
                                        แนปรูป
                                    </Button>
                                    <Button
                                        disabled={sender.emp !== user.empCode}
                                        color="primary"
                                        endDecorator={<SendRoundedIcon/>}
                                        onClick={handleSend}
                                    >
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