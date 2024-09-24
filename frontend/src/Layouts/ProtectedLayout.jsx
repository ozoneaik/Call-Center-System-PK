import {Navigate, Outlet} from "react-router-dom";
import Box from "@mui/joy/Box";
import {CssVarsProvider} from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import Sidebar from "../Layouts/Sidebar.jsx";
import Navbar from "./Navbar.jsx";
import {LayoutStyle} from "../styles/LayoutStyle.js";
import App from "../App.jsx";

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
            </CssVarsProvider>

        </div>
    );

}

export default ProtectedLayout;