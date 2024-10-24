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
import ChatBubble from "./ChatBubble.jsx";
import {useNotification} from "../../context/NotiContext.jsx";
import {AlertDiaLog, AlertWithForm} from "../../Dialogs/Alert.js";
import Typography from "@mui/joy/Typography";
import InfoMessage from "./InfoMessage.jsx";

export default function MessagePane() {
    const {user} = useAuth();
    const {notification} = useNotification();
    const [imagePreview, setImagePreview] = useState();
    const [selectedFile, setSelectedFile] = useState();
    const [messages, setMessages] = useState({});
    const [sender, setSender] = useState({
        custId: 'id ของลูกค้า',
        avatar: 'รูปประจำตัว',
        custName: 'ไม่พบ name',
        description: 'ไม่พบ description',
        emp: ''
    });
    const {rateId, activeId, custId, check} = useParams();
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
                document.title = data.sender.custName;
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
        setMsg(c)
        await handleSend({c: c.content})
    }

    const handleSend = async ({type = 'text', c}) => {
        const C = msg.content ? msg.content : c;
        if (C === null || C === undefined || C === '') {
            alert('กรุณากรอกข้อความที่ต้องส่งก่อน')
            return;
        }
        const {data, status} = await sendApi({
            msg: C,
            contentType: type,
            custId: sender.custId,
            conversationId: activeId,
            selectedFile
        });
        console.log(data, status)
        if (status === 200) {
            setMsg({content: '', contentType: 'text', sender: ''});
            if (selectedFile){
                setMessages((prevMessages) => {
                    const newId = prevMessages.length.toString();
                    return [
                        ...prevMessages,
                        {
                            id: newId,
                            content: imagePreview,
                            contentType: 'image',
                            sender: user,
                            created_at: new Date().toString()
                        },

                    ]
                })
            }
            setMessages((prevMessages) => {
                const newId = prevMessages.length.toString();
                return [
                    ...prevMessages,
                    {
                        id: newId,
                        content: C,
                        contentType: type,
                        sender: user,
                        created_at: new Date().toString()
                    },

                ]
            })
        } else AlertDiaLog({title: data.message, text: data.detail, onPassed: () => console.log('')});
        handleRemoveImage();
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
        // AlertDiaLog({
        //     title: `จบการสนทนา`,
        //     text: 'กด "ตกลง" เพื่อจบการสนทนา (หากคุณต้องการส่งต่อกรุณากดที่ปุ่ม "ส่งต่อไปยัง" แทน)',
        //     icon: 'info',
        //     onPassed: async (confirm) => {
        //         if (confirm) {
        //             const {data, status} = await endTalkApi({rateId, activeConversationId: activeId});
        //             AlertDiaLog({
        //                 title: data.message,
        //                 text: data.detail,
        //                 showConfirmButton: status === 200,
        //                 icon: status === 200 ? 'success' : 'error',
        //                 onPassed: (C) => {
        //                     C && status === 200 && window.close();
        //                 }
        //             });
        //         } else console.log('กด ยกเลิก การจบสนทนา')
        //     }
        // });

        AlertWithForm({
            // text : 'กด "ตกลง" เพื่อจบการสนทนา (หากคุณต้องการส่งต่อกรุณากดที่ปุ่ม "ส่งต่อไปยัง" แทน)',
            title: `จบการสนทนา`,
            Text : 'กด "ตกลง" เพื่อจบการสนทนา (หากคุณต้องการส่งต่อกรุณากดที่ปุ่ม "ส่งต่อไปยัง" แทน)',
        })
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        setSelectedFile(null);
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
                <Sheet>
                    <Sheet sx={MessageStyle.Layout}>
                        {/*Message Pane Header*/}
                        <MessagePaneHeader
                            check={check}
                            endTalk={(e) => endTalk(e)}
                            sendTo={(c) => handleChangeRoom(c)}
                            shortCustSend={(c) => sendFromShortCut(c)}
                            sender={sender}
                            chatRooms={chatRooms}
                            roomSelect={roomSelect}
                        />
                        {/*Message pane*/}
                        <Box sx={MessageStyle.PaneContent}>
                            <Stack spacing={2} sx={{justifyContent: 'flex-end'}}>
                                {messages.length > 0 && (
                                    messages.map((message, index) => {
                                        const isYou = message.sender.empCode;
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
                        {check === '1' && (
                            <Box sx={{px: 2, pb: 3}}>
                                <FormControl fullWidth>

                                    <Textarea
                                        id='inputSend'
                                        startDecorator={
                                            imagePreview && (
                                                <Box sx={{position: 'relative', maxWidth: 300}}>
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        style={{width: '100%', height: 'auto', borderRadius: '8px'}}
                                                    />
                                                    <Button
                                                        onClick={handleRemoveImage}
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 8, right: 8,
                                                            minWidth: 'auto',
                                                            p: 0.5,
                                                            bgcolor: 'rgba(0, 0, 0, 0.5)',
                                                            color: 'white',
                                                            '&:hover': {
                                                                bgcolor: 'rgba(0, 0, 0, 0.7)',
                                                            },
                                                        }}
                                                    >
                                                        x
                                                    </Button>
                                                </Box>
                                            )
                                        }
                                        disabled={sender.emp !== user.empCode}
                                        placeholder="พิมพ์ข้อความที่นี่..."
                                        minRows={imagePreview ? 1 : 3} maxRows={10}
                                        value={msg.content}
                                        onChange={(e) => setMsg({...msg, content: e.target.value})}
                                        endDecorator={
                                            <Stack direction="row" sx={MessageStyle.TextArea}>
                                                <Button
                                                    disabled={sender.emp !== user.empCode}
                                                    color="danger" component="label"
                                                >
                                                    <Typography sx={{
                                                        mr: 1, color: 'white', display: {xs: 'none', sm: 'block'}
                                                    }}>
                                                        แนปรูป
                                                    </Typography>
                                                    <input type="file" hidden accept="image/*"
                                                           onChange={handleImageChange}
                                                    />
                                                    <LocalSeeIcon/>
                                                </Button>
                                                <Button disabled={sender.emp !== user.empCode} color="primary"
                                                        onClick={() => handleSend({type: 'text'})}>
                                                    <Typography
                                                        sx={{color: 'white', display: {xs: 'none', sm: 'block'}}}>
                                                        ส่ง ( ctrl+enter )
                                                    </Typography>
                                                    <SendRoundedIcon/>
                                                </Button>
                                            </Stack>
                                        }
                                        onKeyDown={async (event) => {
                                            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                                                await handleSend({})
                                            }
                                        }}
                                    />

                                </FormControl>
                            </Box>
                        )}

                    </Sheet>
                </Sheet>
                {/* Info */}
                <InfoMessage sender={sender} starList={starList} notes={notes} check={check}/>
            </Sheet>

        </>
    )
}