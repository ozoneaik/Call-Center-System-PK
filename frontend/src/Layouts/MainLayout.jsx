import {useAuth} from "../context/AuthContext.jsx";
import {useNotification} from "../context/NotiContext.jsx";
import {useEffect} from "react";
import {profileApi} from "../api/Auth.js";
import {newMessage} from "../echo.js";
import {Navigate, Outlet} from "react-router-dom";

export default function MainLayout() {
    const {user, setUser} = useAuth();
    const {setNotification} = useNotification();

    useEffect(() => {
        (async () => {
            const {data, status} = await profileApi();
            if (status === 200) {
                setUser(data.user);
            }
            if (status === 401) {
                localStorage.removeItem('user');
                setUser(null);
                window.location.href = '/';
            }
        })();
        newMessage({
            onPassed: (status, event) => {
                console.log(status, event);
                setNotification(event);
            }
        });
    }, []);
    if (!user) {
        return <Navigate to="/login"/>;
    }

    return (
        <>
            <Outlet/>
        </>
    )
}