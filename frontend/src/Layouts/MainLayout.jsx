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
    const {setChatRoomsContext, setMyRoomContext} = useChatRooms();
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

    const fetchChatRoom = async () => {
        const {data, status} = await chatRoomListApi();
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