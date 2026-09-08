import {useLocation, useParams } from "react-router-dom";
import { CircularProgress, Sheet,Box, Stack, Avatar, Divider, Typography } from "@mui/joy";
import { MessageStyle } from "../../../styles/MessageStyle.js";
import MessagePaneHeader from "../Header/MessagePaneHeader.jsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { selectMessageApi } from "../../../Api/Messages.js";
import ChatBubble from "./ChatBubble.jsx";
import { useNotification } from "../../../context/NotiContext.jsx";
import { AlertDiaLog } from "../../../Dialogs/Alert.js";
import Info from "../Info/main.jsx";
import { useChatRooms } from "../../../context/ChatRoomContext.jsx";
import MessageInputNew from "./MessageInputNew.jsx";
import { forceHttps } from "../../../utils.js";

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
    const isShopeeRoom = sender?.platform === 'shopee' || (sender?.description || '').toLowerCase().includes('shopee');

    // ข้อความล่าสุดจากลูกค้า (ไม่ใช่จากพนักงาน) ใช้เป็นตัวกระตุ้นให้ AI panel ยิงไปหา chat-oc-any อัตโนมัติ
    const latestCustomerMessage = useMemo(() => {
        if (!Array.isArray(messages)) return null;
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i] && !messages[i].sender?.empCode) {
                return messages[i];
            }
        }
        return null;
    }, [messages]);

    // ปุ่ม "Generate AI" ต่อข้อความ (ดู ChatBubble.jsx) — เรียก generateForMessage ที่อยู่ใน Info ตรง ๆ ผ่าน ref
    // แทนที่จะยกทั้ง state ของแผง AI ขึ้นมาไว้ที่นี่ (Info ยังเป็นเจ้าของ liveSuggestions/liveLoading เหมือนเดิม)
    const infoRef = useRef(null);
    // key ของข้อความที่กำลัง generate อยู่ (ใช้โชว์ spinner/ล็อกปุ่มเฉพาะข้อความนั้น กันกดซ้ำซ้อน)
    const [generatingMessageKey, setGeneratingMessageKey] = useState(null);
    // key ของข้อความที่กด Generate AI "ล่าสุด" (ทั้งจากประวัติที่โหลดมาตอนเปิดห้อง และจากที่เพิ่งกดสด ๆ)
    // Info เป็นคนอัปเดตให้ผ่าน onLastGeneratedChange — ใช้โชว์เส้นคั่นในหน้าแชทว่า generate ไปถึงข้อความไหนแล้ว
    const [lastGeneratedKey, setLastGeneratedKey] = useState(null);

    const handleGenerateAi = async (message) => {
        if (!message || generatingMessageKey) return; // กันกดรัวจนยิงซ้อนกันหลายคำขอพร้อมกัน
        const key = message.id ?? message.created_at;
        if (!key) return;
        setGeneratingMessageKey(key);
        // เด้งเปิด Side bar AI ทันทีที่กด ให้เห็น loading/ผลลัพธ์เลย ไม่ต้องกดเปิดแผงเอง
        infoRef.current?.openAiPanel();
        try {
            await infoRef.current?.generateForMessage(message, { force: true });
        } catch (err) {
            console.error('Generate AI ย้อนหลังไม่สำเร็จ', err);
        } finally {
            setGeneratingMessageKey(null);
        }
    };

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
                                        const messageKey = message.id ?? message.created_at;
                                        // จุดตัด: ข้อความนี้คือจุดที่กด Generate AI ล่าสุด (ทั้งจากประวัติเก่าและที่เพิ่งกดสด ๆ)
                                        const isLastGenerated = lastGeneratedKey != null
                                            && messageKey != null
                                            && String(messageKey) === String(lastGeneratedKey);
                                        return (
                                            <Box key={index}>
                                                <Stack
                                                    data-aos="fade-right"
                                                    direction="row" spacing={2}
                                                    sx={{ flexDirection: isYou ? 'row-reverse' : 'row' }}
                                                >
                                                    <Avatar src={forceHttps(message.sender.avatar)} />
                                                    <ChatBubble
                                                        variant={isYou ? 'sent' : 'received'}
                                                        isShopeeRoom={isShopeeRoom}
                                                        {...message}
                                                        {...{ messages, setMessages }}
                                                        onGenerateAi={handleGenerateAi}
                                                        generatingAi={!!messageKey && messageKey === generatingMessageKey}
                                                    />
                                                </Stack>
                                                {isLastGenerated && (
                                                    <Divider sx={{ my: 1.5, '--Divider-childPosition': '50%' }}>
                                                        <Typography level="body-xs" sx={{ color: '#6c5dd3', fontWeight: 600 }}>
                                                            ✨ Generate AI ล่าสุดถึงตรงนี้
                                                        </Typography>
                                                    </Divider>
                                                )}
                                            </Box>
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
                <Info
                    ref={infoRef}
                    {...{ sender, starList, notes, check, setMsg, activeId, latestCustomerMessage }}
                    onLastGeneratedChange={setLastGeneratedKey}
                />
            </Sheet>
        </>
    )
}

// import { useLocation, useParams } from "react-router-dom";
// import { CircularProgress, Sheet, Box, Stack, Avatar, Skeleton } from "@mui/joy"; // <-- เพิ่ม Skeleton
// import { MessageStyle } from "../../../styles/MessageStyle.js";
// import MessagePaneHeader from "../Header/MessagePaneHeader.jsx";
// import { useEffect, useState } from "react";
// import { selectMessageApi } from "../../../Api/Messages.js";
// import ChatBubble from "./ChatBubble.jsx";
// import { useNotification } from "../../../context/NotiContext.jsx";
// import { AlertDiaLog } from "../../../Dialogs/Alert.js";
// import Info from "../Info/main.jsx";
// import { useChatRooms } from "../../../context/ChatRoomContext.jsx";
// import MessageInputNew from "./MessageInputNew.jsx";

// export default function MessagePane() {
//     const { notification } = useNotification();
//     const [messages, setMessages] = useState({});
//     const { chatRoomsContext, setChatRoomsContext } = useChatRooms();

//     const location = useLocation();
//     const from = location.state?.from?.pathname  || '/';
    

    
//     const [sender, setSender] = useState({
//         custId: 'id ของลูกค้า',
//         avatar: 'รูปประจำตัว',
//         custName: 'ไม่พบ name',
//         description: 'ไม่พบ description',
//         emp: ''
//     });
//     const { rateId, activeId, custId, check } = useParams();
//     const [chatRooms, setChatRooms] = useState(chatRoomsContext);

//     const [listAllChatRooms, setListAllChatRooms] = useState(chatRoomsContext)
//     const [msg, setMsg] = useState({
//         content: '',
//         contentType: 'text',
//         sender: ''
//     });
//     const [starList, setStarList] = useState({});
//     const [notes, setNotes] = useState({});
//     const [roomSelect, setRoomSelect] = useState({});
//     const [tags, setTags] = useState([]);
//     const [firstRender, setFirstRender] = useState(true);
//     const [disable, setDisable] = useState(true);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const fetchData = async () => {
//             const { data, status } = await selectMessageApi(rateId, activeId, custId, 'S');
//             if (status === 200) {
//                 setMessages(data.list);
//                 setRoomSelect(data.room);
//                 setSender(data.sender);
//                 document.title = 'สนทนากับ ' + data.sender.custName;
//                 setStarList(data.starList);
//                 setNotes(data.notes);
//                 setTags(data.tags)

//             } else {
//                 AlertDiaLog({
//                     title: data.message,
//                     text: data.detail,
//                     onPassed: (confirm) => confirm && window.close()
//                 });
//             }
//         }
//         fetchData().finally(() => {
//             setDisable(false);
//             setLoading(false);
//         });
//     }, []);

//     // ตรวจจับข้อความใหม่จาก ลูกค้า
//     useEffect(() => {
//         if (firstRender) {
//             setFirstRender(false);
//             return;
//         }
//         if (notification.message?.sender) {
//             if (notification.customer.custId === sender.custId) {
//                 setMessages((prevMessages) => {
//                     return [
//                         ...prevMessages,
//                         {
//                             id: notification.message.id,
//                             content: notification.message.content,
//                             contentType: notification.message.contentType,
//                             line_message_id: notification.message.line_message_id,
//                             line_quote_token: notification.message.line_quote_token,
//                             line_quoted_message_id: notification.message.line_quoted_message_id || null,
//                             sender: notification.message.sender,
//                             created_at: notification.message.created_at,
//                         }
//                     ]
//                 })
//             } else {
//                 console.log('ไม่ใช่ลูกค้า');
//             }
//         } else { }
//     }, [notification]);

//     const sendFromShortCut = async (c) => {
//         console.log('c + msg', msg + c);
//         setMsg({
//             content: '\n - ' + c.content,
//             contentType: c.contentType,
//             sender: sender
//         })
//     }
//     return (
//         <>
//             <Sheet sx={MessageStyle.MainLayout}>
//                 <Sheet>
//                     <Sheet sx={MessageStyle.Layout}>
//                         {/*Message Pane Header*/}
//                         <MessagePaneHeader
//                             prevUrlfrom={from}
//                             disable={disable}
//                             rateId={rateId}
//                             activeId={activeId}
//                             check={check}
//                             endTalk={(e) => endTalk(e)}
//                             shortCustSend={(c) => sendFromShortCut(c)}
//                             sender={sender}
//                             chatRooms={chatRooms}
//                             roomSelect={roomSelect}
//                             tags={tags}
//                             listAllChatRooms={listAllChatRooms}
//                         />
//                         {/*Message pane*/}
//                         <Box sx={MessageStyle.PaneContent}>
//                             {loading && (
//                                 // --- แสดง Skeleton จำลองห้องแชทตามโครงสร้างเดิมเป๊ะๆ ---
//                                 <Stack spacing={2} sx={{ justifyContent: 'flex-end', height: '100%', p: 2 }}>
//                                     {/* กล่องข้อความลูกค้า (ซ้าย) */}
//                                     <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-end' }}>
//                                         <Skeleton variant="circular" width={40} height={40} />
//                                         <Skeleton variant="rectangular" width={220} height={60} sx={{ borderRadius: 'xl', borderBottomLeftRadius: 0 }} />
//                                     </Stack>
//                                     {/* กล่องข้อความลูกค้า (ซ้าย) สั้นๆ */}
//                                     <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-end' }}>
//                                         <Skeleton variant="circular" width={40} height={40} />
//                                         <Skeleton variant="rectangular" width={150} height={40} sx={{ borderRadius: 'xl', borderBottomLeftRadius: 0 }} />
//                                     </Stack>
//                                     {/* กล่องข้อความเรา (ขวา) */}
//                                     <Stack direction="row-reverse" spacing={2} sx={{ alignItems: 'flex-end' }}>
//                                         <Skeleton variant="circular" width={40} height={40} />
//                                         <Skeleton variant="rectangular" width={280} height={70} sx={{ borderRadius: 'xl', borderBottomRightRadius: 0 }} />
//                                     </Stack>
//                                     {/* กล่องข้อความลูกค้า (ซ้าย) */}
//                                     <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-end' }}>
//                                         <Skeleton variant="circular" width={40} height={40} />
//                                         <Skeleton variant="rectangular" width={200} height={50} sx={{ borderRadius: 'xl', borderBottomLeftRadius: 0 }} />
//                                     </Stack>
//                                 </Stack>
//                             )}
//                             {!loading && (
//                                 <Stack spacing={2} sx={{ justifyContent: 'flex-end' }}>
//                                     {messages.length > 0 && messages.map((message, index) => {
//                                         const isYou = message.sender.empCode;
//                                         return (
//                                             <Stack
//                                                 data-aos="fade-right"
//                                                 key={index} direction="row" spacing={2}
//                                                 sx={{ flexDirection: isYou ? 'row-reverse' : 'row' }}
//                                             >
//                                                 <Avatar src={message.sender.avatar} />
//                                                 <ChatBubble
//                                                     variant={isYou ? 'sent' : 'received'} {...message}
//                                                     {...{ messages, setMessages }}
//                                                 />
//                                             </Stack>
//                                         );
//                                     })}
//                                 </Stack>
//                             )}
//                         </Box>
//                         {loading && (
//                             <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
//                                 <Skeleton variant="rectangular" width="100%" height={90} sx={{ borderRadius: 'lg', mb: 1 }} />
//                                 <Stack direction="row-reverse" spacing={2}>
//                                     <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 'sm' }} />
//                                     <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 'sm' }} />
//                                 </Stack>
//                             </Box>
//                         )}
//                         {!loading && (
//                             <MessageInputNew
//                                 setMsg={setMsg}
//                                 msg={msg}
//                                 sender={sender}
//                                 activeId={activeId}
//                             />

//                         )}
//                     </Sheet>
//                 </Sheet>
//                 <Info {...{ sender, starList, notes, check, setMsg, activeId }} />
//             </Sheet>
//         </>
//     )
// }