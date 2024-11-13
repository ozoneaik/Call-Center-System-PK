import { Outlet } from "react-router-dom";
import Box from "@mui/joy/Box";
import Sidebar from "../Layouts/Sidebar.jsx";
import Navbar from "./Navbar.jsx";
import { LayoutStyle } from "../styles/LayoutStyle.js";
import App from "../App.jsx";
import FloatingBtn from "../Views/HomePages/FloatingBtn.jsx";
import { AnnouncementBar } from "./AnnouncementBar.jsx";

function ProtectedLayout() {
    return (
        <div>
            <App />
            {/* <AnnouncementBar /> */}
            <Box sx={LayoutStyle.MainLayout}>
                <Sidebar />
                <Navbar />
                <Box component="main" className="MainContent" sx={{ flex: 1 }}>
                    <Outlet />
                </Box>
            </Box>
            <FloatingBtn />
        </div>
    );

}

export default ProtectedLayout;