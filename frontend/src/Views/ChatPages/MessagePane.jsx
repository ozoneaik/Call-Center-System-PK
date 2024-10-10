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
import Typography from "@mui/joy/Typography";
import InfoMessage from "./InfoMessage.jsx";

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
    const [starList, setStarList] = useState({});
    const [notes, setNotes] = useState({});
    const [roomSelect, setRoomSelect] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            const {data, status} = await selectMessageApi(rateId, activeId, custId);
            console.log(data)
            if (status === 200) {
                setMessages(data.list);
                setRoomSelect(data.room);
                setSender(data.sender);
                setStarList(data.starList);
                setNotes(data.notes);
            } else {
                AlertDiaLog({
                    title: data.message,
                    text: data.detail,
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
        if (C.content === null || C.content === undefined || C.content === '') {
            alert('กรุณากรอกข้อความที่ต้องส่งก่อน')
            return;
        }
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
        AlertDiaLog({
            icon: status === 200 && 'success',
            title: data.message,
            text: data.detail,
            onPassed: (confirm) => {
                confirm && window.close();
            }
        });
    }

    const endTalk = () => {
        AlertDiaLog({
            title: `จบการสนทนา ${rateId} ${activeId}`,
            text: 'กด "ตกลง" เพื่อจบการสนทนา (หากคุณต้องการส่งต่อกรุณากดที่ปุ่ม "ส่งต่อไปยัง" แทน)',
            icon: 'info',
            onPassed: async (confirm) => {
                if (confirm) {
                    const {data, status} = await endTalkApi({rateId, activeConversationId: activeId});
                    AlertDiaLog({
                        title: data.message,
                        text: data.detail,
                        showConfirmButton: status === 200,
                        icon: status === 200 ? 'success' : 'error',
                        onPassed: (C) => {
                            C && status === 200 && window.close();
                        }
                    });
                } else console.log('กด ยกเลิก การจบสนทนา')
            }
        });
    };

    return (
        <>
            <Sheet
                sx={{
                    flex: 1,
                    width: '100%',
                    mx: 'auto',
                    pt: {xs: 'var(--Header-height)', md: 0},
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'minmax(min-content, min(80%, 800px)) 1fr',
                        lg: 'minmax(min-content, min(80%, 1400px)) 1fr',
                    },
                }}
            >
                <Sheet
                    sx={{
                        position: {xs: 'fixed', sm: 'sticky'},
                        transform: {
                            xs: 'translateX(calc(100% * (var(--MessagesPane-slideIn, 0) - 1)))',
                            sm: 'none',
                        },
                        transition: 'transform 0.4s, width 0.4s',
                        zIndex: 100,
                        width: '100%',
                        top: 52,
                    }}
                >
                    <Sheet sx={MessageStyle.Layout}>
                        {/*Message Pane Header*/}
                        <MessagePaneHeader
                            endTalk={(e) => endTalk(e)}
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
                                {messages.length > 0 && (
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
                                )}
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
                                            <Button disabled={sender.emp !== user.empCode} color="warning"
                                                    onClick={handleSend}
                                                    sx={{mr: 1}}>
                                                <Typography
                                                    sx={{mr: 1, color: 'white', display: {xs: 'none', sm: 'block'}}}>ส่ง
                                                    sticker</Typography>
                                                <InsertEmoticonIcon/>
                                            </Button>
                                            <Button disabled={sender.emp !== user.empCode} color="danger"
                                                    onClick={handleSend}
                                                    sx={{mr: 1}}>
                                                <Typography sx={{
                                                    mr: 1, color: 'white', display: {xs: 'none', sm: 'block'}
                                                }}>แนปรูป</Typography>
                                                <LocalSeeIcon/>
                                            </Button>
                                            <Button disabled={sender.emp !== user.empCode} color="primary"
                                                    onClick={handleSend}>
                                                <Typography sx={{color: 'white', display: {xs: 'none', sm: 'block'}}}>ส่ง
                                                    (
                                                    ctrl+enter )</Typography>
                                                <SendRoundedIcon/>
                                            </Button>
                                        </Stack>
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                                            handleSend().then()
                                        }
                                    }}
                                />
                            </FormControl>
                        </Box>
                    </Sheet>
                </Sheet>
                {/* Info */}
                <InfoMessage sender={sender} starList={starList} notes={notes}/>
            </Sheet>

        </>
    )
}