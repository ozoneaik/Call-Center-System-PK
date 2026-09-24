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
import GenerateContextModal from "./GenerateContextModal.jsx";
import duragearsLogo from "../../../assets/watermarks/duragears-logo.png";
import texusbullLogo from "../../../assets/watermarks/texusbull.png";
import pumpkinLogo from "../../../assets/watermarks/pumpkin.png";

// เทียบแบบ normalize (ตัดช่องว่าง/จุด/ตัวพิมพ์เล็กใหญ่ทิ้ง) กันพลาดเรื่องรูปแบบชื่อร้านที่พิมพ์ไว้ใน platform_access_tokens.description
const normalizeShopName = (name) => (name || '').toLowerCase().replace(/[^a-z0-9฀-๿]/g, '');

// กติกาไล่ทีละกฎ: ร้านชื่อไหน (บนแพลตฟอร์มไหนบ้าง — null = ทุกแพลตฟอร์ม) ให้เปลี่ยนสีห้องแชท (กรอบ+พื้นหลัง header)
// และ watermark พื้นหลังหน้าแชท (ถ้ามี) เป็นอะไร ใช้กฎแรกที่ตรงก่อน
const SHOP_ROOM_COLOR_RULES = [
    {
        color: '#cf2e2e',
        platforms: ['shopee', 'lazada'],
        shopNames: ['Duragears', 'MR. Drill', 'Car การช่าง', 'Smart Electrician', 'JAPAN TOOLS'],
        watermark: duragearsLogo,
    },
    {
        color: '#00008b', // น้ำเงินเข้ม
        platforms: null, // ทุกแพลตฟอร์ม เช่น line, shopee, lazada
        shopNames: ['Texus bull'],
        watermark: texusbullLogo,
    },
    {
        // ไม่กำหนด color — ร้าน Pumpkin เอาแค่ watermark พื้นหลัง ไม่ต้องเปลี่ยนสีกรอบ/พื้นหลัง header
        platforms: null, // ทุกแพลตฟอร์ม
        shopNames: ['Pumpkin'],
        watermark: pumpkinLogo,
    },
].map((rule) => ({ ...rule, shopNames: rule.shopNames.map(normalizeShopName) }));

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
    const isShopeeRoom = sender?.platformType === 'shopee' || sender?.platform === 'shopee' || (sender?.description || '').toLowerCase().includes('shopee');

    // ไล่ตาม SHOP_ROOM_COLOR_RULES หากล่องแรกที่ทั้งแพลตฟอร์มและชื่อร้านตรง แล้วใช้สีของกฎนั้นเปลี่ยนกรอบ+พื้นหลัง header
    // และ watermark ของกฎนั้น (ถ้ามี) มาเป็นพื้นหลังหน้าแชท
    const matchedShopRoomRule = useMemo(() => {
        const platformType = (sender?.platformType || '').toLowerCase();
        const shopName = normalizeShopName(sender?.shopName);
        if (!shopName) return null;

        return SHOP_ROOM_COLOR_RULES.find((rule) => {
            if (rule.platforms && !rule.platforms.includes(platformType)) return false;
            return rule.shopNames.some((name) => shopName.includes(name));
        }) ?? null;
    }, [sender?.platformType, sender?.shopName]);
    const highlightedRoomColor = matchedShopRoomRule?.color ?? null;
    const highlightedRoomWatermark = matchedShopRoomRule?.watermark ?? null;

    // ข้อความล่าสุดจากลูกค้า (ไม่ใช่จากพนักงาน) ใช้เป็นตัวกระตุ้นให้ AI panel ยิงไปหา chat-oc-any อัตโนมัติ
    const latestCustomerMessage = useMemo(() => {
        if (!Array.isArray(messages)) return null;
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i] && messages[i].sender?.custId) {
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

    // popup เลือก context ก่อนกด Generate AI จริง (GenerateContextModal.jsx) — เปิดจากปุ่มต่อข้อความ
    // ให้แอดมินเห็น/เลือกได้ก่อนว่าจะส่งข้อความไหนให้ AI บ้าง แทนที่จะยิงอัตโนมัติทันทีเหมือนเดิม
    const [contextPickerOpen, setContextPickerOpen] = useState(false);
    const [contextPickerMessage, setContextPickerMessage] = useState(null);
    const [contextPickerCandidates, setContextPickerCandidates] = useState([]);

    // กดปุ่ม "Generate AI" ที่ข้อความ — ไม่ยิง generate ทันที แต่เปิด popup ให้เลือก context ก่อน
    // candidates = ข้อความ/รูปทั้งหมดของลูกค้าคนนี้ (messages ที่โหลดมาแล้ว สโคปเดียวกับที่ backend ใช้ตอน
    // auto-query คือทั้ง custId ไม่จำกัดแค่ห้อง/เซสชันปัจจุบัน) ตั้งแต่ต้นจนถึงข้อความที่กด (id <= ข้อความนี้)
    // กรองข้อความจาก BOT ออกไปเลย (sender.empCode === 'BOT') ไม่ให้ปนมาในตัวเลือกเลย
    const handleGenerateAi = (message) => {
        if (!message || generatingMessageKey) return; // กันกดรัวจนยิงซ้อนกันหลายคำขอพร้อมกัน
        const key = message.id ?? message.created_at;
        if (!key) return;

        const upToId = Number.isFinite(message.id) ? message.id : null;
        const candidates = (Array.isArray(messages) ? messages : [])
            .filter((m) => m.contentType === 'text' || m.contentType === 'image')
            .filter((m) => m.sender?.empCode !== 'BOT')
            .filter((m) => upToId === null || !Number.isFinite(m.id) || m.id <= upToId)
            .filter((m) => (m.content ?? '').toString().trim() !== '');

        setContextPickerMessage(message);
        setContextPickerCandidates(candidates);
        setContextPickerOpen(true);
    };

    // กด "Generate AI (N ข้อความที่เลือก)" ใน popup แล้ว — ยิงจริงด้วย lines/imageUrl ที่แอดมินเลือกไว้
    // ปุ่ม "ดึงประวัติแชทย้อนหลัง" ของ Shopee (ดู Info/main.jsx) sync เสร็จแล้วส่งชุดข้อความล่าสุดกลับมาที่นี่
    // ให้หน้าแชทหลักอัปเดตตามไปด้วยเลย ไม่ต้องรีเฟรชหน้าเองอีกที
    const handleHistorySynced = (freshMessages) => {
        if (Array.isArray(freshMessages)) {
            setMessages(freshMessages);
        }
    };

    const handleConfirmGenerate = async (lines, imageUrl) => {
        const message = contextPickerMessage;
        if (!message) return;
        const key = message.id ?? message.created_at;
        setGeneratingMessageKey(key);
        // เด้งเปิด Side bar AI ทันทีที่กด ให้เห็น loading/ผลลัพธ์เลย ไม่ต้องกดเปิดแผงเอง
        infoRef.current?.openAiPanel();
        try {
            await infoRef.current?.generateForMessage(message, { force: true, lines, imageUrl });
        } catch (err) {
            console.error('Generate AI ย้อนหลังไม่สำเร็จ', err);
        } finally {
            setGeneratingMessageKey(null);
            setContextPickerOpen(false);
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
                            highlightedRoomColor={highlightedRoomColor}
                        />
                        {/*Message pane*/}
                        <Box
                            sx={{
                                ...MessageStyle.PaneContent,
                                // watermark โลโก้ร้าน (ถ้ามีตาม SHOP_ROOM_COLOR_RULES) — ทำผ่าน ::before แยกชั้น แล้วลด opacity
                                // ของชั้นนั้นเอา ไม่ใช่ทับด้วย gradient สีขาว เพราะ gradient จะกลายเป็นแผ่นสีขาวทึบเห็นเป็นกรอบ
                                // สี่เหลี่ยมแปลกๆ ทับพื้นหลังเดิม (โดยเฉพาะถ้าพื้นหลังจริงไม่ใช่สีขาวล้วน)
                                ...(highlightedRoomWatermark && {
                                    position: 'relative',
                                    zIndex: 0,
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundImage: `url(${highlightedRoomWatermark})`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'center',
                                        backgroundSize: 'min(45%, 360px)',
                                        opacity: 0.12,
                                        pointerEvents: 'none',
                                        zIndex: -1,
                                    },
                                }),
                            }}
                        >
                            {loading && <CircularProgress />}
                            {!loading && (
                                <Stack spacing={2} sx={{ justifyContent: 'flex-end' }}>
                                    {messages.length > 0 && messages.map((message, index) => {
                                        // ฝั่ง "เรา" (แอดมิน/บอท/ระบบของร้าน) คือ sender ที่ไม่มี custId
                                        // ไม่ใช้แค่ empCode เพราะข้อความจาก Shopee AI ผู้ช่วยตอบแชท/Shopee System
                                        // ที่ sync ย้อนหลังมา ไม่มี empCode แต่ก็ไม่ใช่ข้อความของลูกค้า ต้องอยู่ฝั่งขวาเหมือนกัน
                                        const isYou = !message.sender?.custId;
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
                    onHistorySynced={handleHistorySynced}
                />
            </Sheet>

            <GenerateContextModal
                open={contextPickerOpen}
                onClose={() => setContextPickerOpen(false)}
                candidates={contextPickerCandidates}
                onConfirm={handleConfirmGenerate}
                confirming={!!generatingMessageKey}
            />
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