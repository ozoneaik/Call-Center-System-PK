import {createRoot} from 'react-dom/client'
import './index.css'
import {RouterProvider} from "react-router-dom";
import {routes} from "./routes.jsx";
import {AuthProvider} from "./context/AuthContext.jsx";
import {NotificationProvider} from "./context/NotiContext.jsx";
import {CssVarsProvider} from '@mui/joy/styles';


createRoot(document.getElementById('root')).render(
    <CssVarsProvider disableTransitionOnChange>
        <AuthProvider>
            <NotificationProvider>
                <RouterProvider router={routes}/>
            </NotificationProvider>
        </AuthProvider>
    </CssVarsProvider>
)
