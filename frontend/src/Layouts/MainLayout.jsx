import {useAuth} from "../context/AuthContext.jsx";
import {useNotification} from "../context/NotiContext.jsx";
import {useEffect} from "react";
import {profileApi} from "../Api/Auth.js";
import {newChatRooms, newMessage, chatMarkedAsRead } from "../echo.js";
import {Navigate, Outlet} from "react-router-dom";
import {useChatRooms} from "../context/ChatRoomContext.jsx";
import {useMessage} from "../context/MessageContext.jsx";
import {chatRoomListApi} from "../Api/ChatRooms.js";

export default function MainLayout() {
    const {user, setUser} = useAuth();
    const {setNotification, setUnRead} = useNotification();
    
    const {
        setChatRoomsContext, setMyRoomContext,
        incrementRoomUnread, setAllRoomUnread, clearRoomUnread,
        setAllRoomPending, incrementRoomPending, decrementRoomPending
    } = useChatRooms();
    const {setMessage} = useMessage();

    useEffect(() => {
        (async () => {
            const {data, status} = await profileApi();
            if (status === 200) {
                setUser(data.user)
                await fetchChatRoom()
            } else if (status === 401) {
                localStorage.removeItem('user');
                window.location.href = '/';
            }
        })();
        const unsubscribeMessage = newMessage({
            onPassed: (status, event) => {
                setNotification(event);
                setMessage(event);
                setUnRead(event.countCustomer);
                
                if (event?.title === 'มีการรับเรื่อง' || event?.title === 'มีการส่งต่อ' || event?.title === 'พักการสนทนา') {
                    // หากมีการรับเรื่อง, ส่งต่อเคส, หรือ พักสนทนา ให้อัพเดทจำนวนแจ้งเตือนทั้งหมดจาก API ตลอดเพื่อความแม่นยำ
                    fetchChatRoom();
                } else if (event?.message?.sender?.custId && event?.activeConversation?.roomId) {
                    const roomId = event.activeConversation.roomId;

                    if (event?.Rate?.status === 'progress') {
                        // Progress: นับตามจำนวนข้อความ
                        incrementRoomUnread(roomId);
                    } else if (event?.Rate?.status === 'pending') {
                        // Pending: ถ้ามีเคสใหม่เข้ามาเป็น pending ให้ increment
                        incrementRoomPending(roomId);
                    }
                }
            }
        });
        const unsubscribeChatRooms = newChatRooms({
            onPassed: (status, event) => {
                setChatRoomsContext(event)
            }
        });
        const unsubscribeChatRead = chatMarkedAsRead({
            onPassed: (status, event) => {
                if (event && event.roomId) {
                    clearRoomUnread(event.roomId);
                }
            }
        });

        return () => {
            if (typeof unsubscribeMessage === 'function') {
                unsubscribeMessage();
            }
            if (typeof unsubscribeChatRooms === 'function') {
                unsubscribeChatRooms();
            }
            if (typeof unsubscribeChatRead === 'function') {
                unsubscribeChatRead();
            }
        };
    }, []);

    const fetchChatRoom = async () => {
        const {data, status} = await chatRoomListApi();
        console.log('data', data);
        if (status === 200) {
            setMyRoomContext(data.chatRooms)
            setChatRoomsContext(data.listAll)

            if (data.chatRooms) {
                // Progress: นับตามจำนวนข้อความ (unread_count)
                const initialUnread = {};
                // Pending: นับตามจำนวนเคส (pending_count)
                const initialPending = {};

                data.chatRooms.forEach(room => {
                    const unreadCount = Number(room.unread_count) || 0;
                    if (unreadCount > 0) {
                        initialUnread[room.roomId] = unreadCount;
                    }

                    const pendingCount = Number(room.pending_count) || 0;
                    if (pendingCount > 0) {
                        initialPending[room.roomId] = pendingCount;
                    }
                });
                setAllRoomUnread(initialUnread);
                setAllRoomPending(initialPending);
            }
        }
    }

    if (!user) return <Navigate to="/"/>;

    return (
        <Outlet/>
    )
}