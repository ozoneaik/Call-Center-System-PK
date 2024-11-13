import {json, useParams} from "react-router-dom";
import {Sheet} from "@mui/joy";
import {MessageStyle} from "../../../styles/MessageStyle.js";
import MessagePaneHeader from "../Header/MessagePaneHeader.jsx";
import Box from "@mui/joy/Box";
import Stack from "@mui/joy/Stack";
import Avatar from "@mui/joy/Avatar";
import {useEffect, useState} from "react";
import {selectMessageApi} from "../../../Api/Messages.js";
import ChatBubble from "./ChatBubble.jsx";
import {useNotification} from "../../../context/NotiContext.jsx";
import {AlertDiaLog} from "../../../Dialogs/Alert.js";
import Info from "../Info/main.jsx";
import {MessageInput} from "./MessageInput.jsx";
import {chatRoomListApi} from "../../../Api/ChatRooms.js";

export default function MessagePane() {
    const {notification} = useNotification();
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
    const [listAllChatRooms, setListAllChatRooms] = useState([])
    const [msg, setMsg] = useState({
        content: '',
        contentType: 'text',
        sender: ''
    });
    const [starList, setStarList] = useState({});
    const [notes, setNotes] = useState({});
    const [roomSelect, setRoomSelect] = useState({});
    const [tags, setTags] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const {data, status} = await selectMessageApi(rateId, activeId, custId,'S');
            console.log('selectedMessageApi >> ', data)
            if (status === 200) {
                setMessages(data.list);
                setRoomSelect(data.room);
                setSender(data.sender);
                document.title = 'สนทนากับ '+data.sender.custName;
                setStarList(data.starList);
                setNotes(data.notes);
                setTags(data.tags)

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
            if (status === 200) {
                setChatRooms(data.chatRooms);
                setListAllChatRooms(data.listAll);
            }

        }
        fetchData().then(() => {
            fetchChatRoom().finally(() => console.log('fetchChatRoom🖼️'));
        });
    }, []);

    // ตรวจจับข้อความใหม่จาก ลูกค้า
    useEffect(() => {
        
        if (notification && notification.title === 'มีข้อความใหม่เข้ามา') {
            if (notification.custId === sender.custId) {
                let pusher = JSON.parse(notification.sender);
                setMessages((prevMessages) => {
                    const newId = prevMessages.length.toString();
                    return [
                        ...prevMessages,
                        {
                            id: newId,
                            content: notification.content,
                            contentType: notification.contentType,
                            sender: pusher,
                            created_at: new Date().toString()
                        },
                    ];
                });
            } else console.log('ตรวจพบการแจ้งเตือนที่เกี่ยวข้อง')
        } else console.log('การแจ้งเตือนที่ไม่เกี่ยวข้อง')
    }, [notification]);

    const sendFromShortCut = async (c) => {
        setMsg(c)
        // await handleSend({c: c.content})
    }
    return (
        <>
            <Sheet sx={MessageStyle.MainLayout}>
                <Sheet>
                    <Sheet sx={MessageStyle.Layout}>
                        {/*Message Pane Header*/}
                        <MessagePaneHeader
                            rateId={rateId}
                            activeId={activeId}
                            check={check}
                            endTalk={(e) => endTalk(e)}
                            shortCustSend={(c) => sendFromShortCut(c)}
                            sender={sender}
                            chatRooms={chatRooms}
                            roomSelect={roomSelect}
                            tags={tags}
                            listAllChatRooms={listAllChatRooms}
                        />
                        {/*Message pane*/}
                        <Box sx={MessageStyle.PaneContent}>
                            <Stack spacing={2} sx={{justifyContent: 'flex-end'}}>
                                {messages.length > 0 && messages.map((message, index) => {
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
                                })}
                            </Stack>
                        </Box>
                        {/* Message Input */}
                        <MessageInput
                            check={check}
                            msg={msg}
                            setMsg={setMsg}
                            sender={sender}
                            setMessages={setMessages}
                            activeId={activeId}>
                        </MessageInput>
                    </Sheet>
                </Sheet>
                {/* Info */}
                <Info sender={sender} starList={starList} notes={notes} check={check}/>
            </Sheet>
        </>
    )
}