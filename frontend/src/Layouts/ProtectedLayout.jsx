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
            <div style={{backgroundColor : 'red',color  : 'white',textAlign : 'center',padding : '5px'}}>
                วันที่ 10/02/2568 จะมีการย้าย Server และเปลี่ยนที่อยู่เว็บไซต์ไปที่ http://www.callcenter-pk.pumpkin-th.com ช่วงเวลานี้อาจทำให้ข้อความลูกค้าล่าสุดหายไป ต้องขอภัยด้วยครับ/ค่ะ
            </div>
             {/*<AnnouncementBar /> */}
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