import {Outlet} from "react-router-dom";
import Box from "@mui/joy/Box";
import {CssVarsProvider} from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import Sidebar from "../Layouts/Sidebar.jsx";
import Navbar from "./Navbar.jsx";
import {LayoutStyle} from "../styles/LayoutStyle.js";
import App from "../App.jsx";
import Button from "@mui/joy/Button";
import ChatIcon from '@mui/icons-material/Chat';

function ProtectedLayout() {
    return (
        <div>
            <App/>
            <CssVarsProvider disableTransitionOnChange>
                <CssBaseline/>
                <Box sx={LayoutStyle.MainLayout}>
                    <Sidebar/>
                    <Navbar/>
                    <Box component="main" className="MainContent" sx={{flex: 1}}>
                        <Outlet/>
                    </Box>
                </Box>
                <Button
                    variant="solid" color="primary"
                    sx={{
                        position: 'fixed', bottom: 16, right: 16, borderRadius: '50%',
                        padding: 0, width: 56, height: 56, minWidth: 'unset', zIndex: 1
                    }}
                >
                    <ChatIcon/>
                </Button>
            </CssVarsProvider>
        </div>
    );

}

export default ProtectedLayout;