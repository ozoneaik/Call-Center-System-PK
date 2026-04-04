import {useAuth} from "../context/AuthContext.jsx";
import {useNotification} from "../context/NotiContext.jsx";
import {useEffect} from "react";
import {profileApi} from "../Api/Auth.js";
import {newChatRooms, newMessage} from "../echo.js";
import {Navigate, Outlet} from "react-router-dom";
import {useChatRooms} from "../context/ChatRoomContext.jsx";
import {useMessage} from "../context/MessageContext.jsx";
import {chatRoomListApi} from "../Api/ChatRooms.js";

export default function MainLayout() {
    const {user, setUser} = useAuth();
    const {setNotification, setUnRead} = useNotification();
    const {setChatRoomsContext, setMyRoomContext, incrementRoomUnread} = useChatRooms();
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
            } else {
            }
        })();
        const unsubscribeMessage = newMessage({
            onPassed: (status, event) => {
                setNotification(event);
                setMessage(event);
                setUnRead(event.countCustomer);
                // ถ้าผู้ส่งเป็นลูกค้า และผู้ใช้ไม่ได้อยู่ในห้องนั้น ให้เพิ่มนับแจ้งเตือน
                if (event?.message?.sender?.custId && event?.activeConversation?.roomId) {
                    const currentRoomId = window.location.pathname.split('/')[3];
                    if (currentRoomId !== event.activeConversation.roomId) {
                        incrementRoomUnread(event.activeConversation.roomId);
                    }
                }
            }
        });
        const unsubscribeChatRooms = newChatRooms({
            onPassed: (status, event) => {
                setChatRoomsContext(event)
            }
        });
        return () => {
            unsubscribeMessage();
            unsubscribeChatRooms();
        };
    }, []);

    const fetchChatRoom = async () => {
        const {data, status} = await chatRoomListApi();
        console.log('data', data);
        if (status === 200) {
            setMyRoomContext(data.chatRooms)
            setChatRoomsContext(data.listAll)
        }
    }
    if (!user) return <Navigate to="/"/>;

    return (
        <Outlet/>
    )
}