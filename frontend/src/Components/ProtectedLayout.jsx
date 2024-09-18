import {Outlet} from "react-router-dom";
import {useAuth} from "../Contexts/AuthContext.jsx";
import React, {useEffect, useState} from "react";
import {ProfileApi} from "../Api/Auth.js";
import {newMessage} from "../Views/ChatPage/newMessage.jsx";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Typography from "@mui/joy/Typography";
import {Snackbar} from "@mui/joy";
import Box from "@mui/joy/Box";
import useSound from "./Sound.jsx";
import soundMessage from '../assets/audio/notification.mp3'
import {CssVarsProvider} from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import Sidebar from "../Layouts/Sidebar.jsx";
import Header from "../Layouts/Header.jsx";

function ProtectedLayout() {
    const {user, setUser} = useAuth();
    const [state, setState] = useState({
        open: false,
        vertical: 'top',
        horizontal: 'right',
        sender: '',
        content: ''
    });
    const {vertical, horizontal, open, sender, content} = state;
    const handleClick = (newState, senderName, content) => {
        setState({...newState, sender: senderName, content});
    };
    if (!user) {
        window.location.href = "/login";
    }
    useEffect(() => {
        newMessage({
            onPassed: (status, event) => {
                if (!event.system_send) {
                    handleClick({vertical: 'top', horizontal: 'right', open: true}, event.custName, event.content);
                    useSound(soundMessage);
                }
            }
        });
        (async () => {
            try {
                const {data, status} = await ProfileApi();
                if (status === 200) {
                    setUser(data.user);
                } else {
                    window.location.href = "/login";
                }
            } catch (error) {
                alert(error.response.status);
                if (error.response.status === 401) {
                    localStorage.removeItem('user');
                    window.location.href = "/login";
                }
            }
        })()
    }, []);

    return (
        <div>
            <Snackbar
                anchorOrigin={{vertical, horizontal}}
                open={open}
                onClose={() => {
                    setState({...state, open: false});
                }}
                key={vertical + horizontal}
                color="success"
                startDecorator={<NotificationsIcon/>}
                size="md"
                variant="soft"
            >
                <Box>
                    <Typography level="title-sm" fontWeight="bold" className="mb-1">
                        จาก {sender}
                    </Typography>
                    <Typography level="body-sm">{content}</Typography>
                </Box>
            </Snackbar>
            <CssVarsProvider disableTransitionOnChange>
                <CssBaseline/>
                <Box sx={{display: 'flex', minHeight: '100dvh'}}>
                    <Sidebar/>
                    <Header/>
                    <Box component="main" className="MainContent" sx={{flex: 1}}>
                        <Outlet/>
                    </Box>
                </Box>
            </CssVarsProvider>

        </div>
    );

}

export default ProtectedLayout;