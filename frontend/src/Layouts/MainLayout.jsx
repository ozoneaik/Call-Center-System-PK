import { useAuth } from "../context/AuthContext.jsx";
import { useNotification } from "../context/NotiContext.jsx";
import { useEffect } from "react";
import {profileApi} from "../Api/Auth.js";
import { newChatRooms, newMessage } from "../echo.js";
import { Navigate, Outlet } from "react-router-dom";
import { useChatRooms } from "../context/ChatRoomContext.jsx";
import { useMessage } from "../context/MessageContext.jsx";
import { chatRoomListApi } from "../Api/ChatRooms.js";

export default function MainLayout() {
    const { user, setUser } = useAuth();
    const { setNotification, setUnRead } = useNotification();
    const { setChatRoomsContext,setMyRoomContext } = useChatRooms();
    const {setMessage} = useMessage();

    useEffect(() => {
        (async () => {
            const { data, status } = await profileApi();
            status === 200 && setUser(data.user)
            if (status === 401) {
                localStorage.removeItem('user');
                // setUser(null);
                window.location.href = '/';
            }
        })();
        (async () => {
            const {data, status} = await chatRoomListApi();
            if (status === 200) {
                console.log('chatRoom');
                setMyRoomContext(data.chatRooms)
                setChatRoomsContext(data.listAll)
            }
        })();
        newMessage({
            onPassed: (status, event) => {
                setNotification(event);
                setMessage(event);
                setUnRead(event.countCustomer)
            }
        });
        newChatRooms({
            onPassed: (status, event) => {
                setChatRoomsContext(event)
            }
        })
    }, []);
    if (!user) return <Navigate to="/" />;

    return (
        <Outlet />
    )
}