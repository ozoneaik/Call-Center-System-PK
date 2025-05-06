import { Outlet } from "react-router-dom";
import Box from "@mui/joy/Box";
import Sidebar from "../Layouts/Sidebar.jsx";
import Navbar from "./Navbar.jsx";
import { LayoutStyle } from "../styles/LayoutStyle.js";
import App from "../App.jsx";
import FloatingBtn from "../Views/HomePages/FloatingBtn.jsx";
import { AnnouncementBar } from "./AnnouncementBar.jsx";
import { useEffect, useState } from "react";
import axiosClient from "../Axios.js";

function ProtectedLayout() {
    const [announces, SetAnnounces] = useState([]);
    useEffect(() => {
        fetchAnnouncement();
    }, []);

    const fetchAnnouncement = async () => {
        try {
            const { data } = await axiosClient.get('/announces');
            console.log(data);
            SetAnnounces(data.announces);
        } catch (error) {
            console.log(error.response.data.message);
        }
    }

    return (
        <div>
            <App />
            {announces.length > 0 && announces.map((item, index) => (
                <AnnouncementBar key={index} item={item} />
            ))}

            <Box sx={LayoutStyle.MainLayout}>
                <Sidebar />
                <Navbar />
                <Box component="main" className="MainContent" sx={{ flex: 1 }}>
                    <Outlet />
                </Box>
            </Box>
            {/* <FloatingBtn /> */}
        </div>
    );

}

export default ProtectedLayout;