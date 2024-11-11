import {useAuth} from "../context/AuthContext.jsx";
import {useNotification} from "../context/NotiContext.jsx";
import {useEffect} from "react";
import {profileApi} from "../api/Auth.js";
import {newChatRooms, newMessage} from "../echo.js";
import {Navigate, Outlet} from "react-router-dom";
import {useChatRooms} from "../context/ChatRoomContext.jsx";

export default function MainLayout() {
    const {user, setUser} = useAuth();
    const {setNotification , setUnRead} = useNotification();
    const {setChatRoomsContext} = useChatRooms();

    useEffect(() => {
        (async () => {
            const {data, status} = await profileApi();
            status === 200 && setUser(data.user)
            console.log('hello');
            if (status === 401) {
                localStorage.removeItem('user');
                // setUser(null);
                window.location.href = '/';
            }
        })();
        newMessage({
            onPassed: (status, event) => {
                setNotification(event);
                setUnRead(event.countCustomer)
            }
        });
        newChatRooms({
            onPassed : (status, event) => {
                setChatRoomsContext(event)
            }
        })
    }, []);
    if (!user) return <Navigate to="/"/>;

    return (<Outlet/>)
}