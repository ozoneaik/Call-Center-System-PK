import React from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Logo from '../assets/logo.png'
import {Link, useLocation} from "react-router-dom";

const BoxStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    textAlign: 'center',
    backgroundColor: 'background.body',
}

const NotFoundPage = () => {
    const {pathname} = useLocation();
    return (
        <CssVarsProvider>
            <CssBaseline />
            {
                pathname === '/access/denied' ? (
                    <Box sx={BoxStyle}>
                        <img src={Logo || ''} alt="" width={300}/>
                        <Typography mb={2} fontWeight="bold" sx={{color : '#f25822'}}>ข้อผิดพลาด 403 Forbidden</Typography>
                        <Typography level="h4" sx={{ mb: 2 }}>คุณไม่มีสิทธ์ เข้าถึงหน้านี้</Typography>
                        <Typography sx={{ mb: 4 }}>ขออภัย สิทธิ์การเข้าถึงหน้านี้ถูกปฏิเสธ โปรดกลับไปยังหน้าแรกหรือติดต่อผู้ดูแลระบบ (IT)</Typography>
                        <Link to={'/'}>กลับสู่หน้าแรก</Link>
                    </Box>
                ) : (
                    <Box sx={BoxStyle}>
                        <img src={Logo || ''} alt="" width={300}/>
                        <Typography fontWeight="bold" sx={{color : '#f25822'}}>ข้อผิดพลาด 404</Typography>
                        <Typography level="h4" sx={{ mb: 2 }}>หน้าที่คุณกำลังมองหาไม่มีอยู่</Typography>
                        <Typography sx={{ mb: 4 }}>ขออภัย เราไม่พบหน้าที่คุณกำลังค้นหา โปรดกลับไปยังหน้าแรกหรือติดต่อผู้ดูแลระบบ (IT)</Typography>
                        <Link to={'/'}>กลับสู่หน้าแรก</Link>
                    </Box>
                )
            }
        </CssVarsProvider>
    );
};

export default NotFoundPage;