import {useLocation, useParams } from "react-router-dom";
import { CircularProgress, Sheet,Box, Stack, Avatar } from "@mui/joy";
import { MessageStyle } from "../../../styles/MessageStyle.js";
import MessagePaneHeader from "../Header/MessagePaneHeader.jsx";
import { useEffect, useState } from "react";
import { selectMessageApi } from "../../../Api/Messages.js";
import ChatBubble from "./ChatBubble.jsx";
import { useNotification } from "../../../context/NotiContext.jsx";
import { AlertDiaLog } from "../../../Dialogs/Alert.js";
import Info from "../Info/main.jsx";
import { useChatRooms } from "../../../context/ChatRoomContext.jsx";
import MessageInputNew from "./MessageInputNew.jsx";

export default function MessagePane() {
    const { notification } = useNotification();
    const [messages, setMessages] = useState({});
    const { chatRoomsContext, setChatRoomsContext } = useChatRooms();

    const location = useLocation();
    const from = location.state?.from?.pathname  || '/';
    

    
    const [sender, setSender] = useState({
        custId: 'id ของลูกค้า',
        avatar: 'รูปประจำตัว',
        custName: 'ไม่พบ name',
        description: 'ไม่พบ description',
        emp: ''
    });
    const { rateId, activeId, custId, check } = useParams();
    const [chatRooms, setChatRooms] = useState(chatRoomsContext);

    const [listAllChatRooms, setListAllChatRooms] = useState(chatRoomsContext)
    const [msg, setMsg] = useState({
        content: '',
        contentType: 'text',
        sender: ''
    });
    const [starList, setStarList] = useState({});
    const [notes, setNotes] = useState({});
    const [roomSelect, setRoomSelect] = useState({});
    const [tags, setTags] = useState([]);
    const [firstRender, setFirstRender] = useState(true);
    const [disable, setDisable] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const { data, status } = await selectMessageApi(rateId, activeId, custId, 'S');
            if (status === 200) {
                setMessages(data.list);
                setRoomSelect(data.room);
                setSender(data.sender);
                document.title = 'สนทนากับ ' + data.sender.custName;
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
        fetchData().finally(() => {
            setDisable(false);
            setLoading(false);
        });
    }, []);

    // ตรวจจับข้อความใหม่จาก ลูกค้า
    useEffect(() => {
        if (firstRender) {
            setFirstRender(false);
            return;
        }
        if (notification.message.sender) {
            if (notification.customer.custId === sender.custId) {
                setMessages((prevMessages) => {
                    return [
                        ...prevMessages,
                        {
                            id: notification.message.id,
                            content: notification.message.content,
                            contentType: notification.message.contentType,
                            line_message_id: notification.message.line_message_id,
                            line_quote_token: notification.message.line_quote_token,
                            line_quoted_message_id: notification.message.line_quoted_message_id || null,
                            sender: notification.message.sender,
                            created_at: notification.message.created_at,
                        }
                    ]
                })
            } else {
                console.log('ไม่ใช่ลูกค้า');
            }
        } else { }
    }, [notification]);

    const sendFromShortCut = async (c) => {
        console.log('c + msg', msg + c);
        setMsg({
            content: '\n - ' + c.content,
            contentType: c.contentType,
            sender: sender
        })
    }
    return (
        <>
            <Sheet sx={MessageStyle.MainLayout}>
                <Sheet>
                    <Sheet sx={MessageStyle.Layout}>
                        {/*Message Pane Header*/}
                        <MessagePaneHeader
                            prevUrlfrom={from}
                            disable={disable}
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
                            {loading && <CircularProgress />}
                            {!loading && (
                                <Stack spacing={2} sx={{ justifyContent: 'flex-end' }}>
                                    {messages.length > 0 && messages.map((message, index) => {
                                        const isYou = message.sender.empCode;
                                        return (
                                            <Stack
                                                data-aos="fade-right"
                                                key={index} direction="row" spacing={2}
                                                sx={{ flexDirection: isYou ? 'row-reverse' : 'row' }}
                                            >
                                                <Avatar src={message.sender.avatar} />
                                                <ChatBubble
                                                    variant={isYou ? 'sent' : 'received'} {...message}
                                                    {...{ messages, setMessages }}
                                                />
                                            </Stack>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Box>
                        {!loading && (
                            <MessageInputNew
                                setMsg={setMsg}
                                msg={msg}
                                sender={sender}
                                activeId={activeId}
                            />

                        )}
                    </Sheet>
                </Sheet>
                <Info {...{ sender, starList, notes, check }} />
            </Sheet>
        </>
    )
}