import {createRoot} from 'react-dom/client'
import './index.css'
import {RouterProvider} from "react-router-dom";
import {routes} from "./routes.jsx";
import {AuthProvider} from "./context/AuthContext.jsx";
import {NotificationProvider} from "./context/NotiContext.jsx";
import {CssVarsProvider} from '@mui/joy/styles';
import {ChatRoomsProvider} from "./context/ChatRoomContext.jsx";
import { MessageProvider } from './context/MessageContext.jsx';


createRoot(document.getElementById('root')).render(
    <CssVarsProvider disableTransitionOnChange>
        <AuthProvider>
            <ChatRoomsProvider>
                <NotificationProvider>
                    <MessageProvider>
                        <RouterProvider router={routes}/>
                    </MessageProvider>
                </NotificationProvider>
            </ChatRoomsProvider>
        </AuthProvider>
    </CssVarsProvider>
)
