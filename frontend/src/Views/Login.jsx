import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Box, Typography, GlobalStyles, CssBaseline, Button, Divider,
    FormControl, FormLabel, IconButton, Input, Stack,
    Snackbar
} from '@mui/joy';
import { CssVarsProvider } from '@mui/joy/styles';

import LoginIcon from '@mui/icons-material/Login';
import ColorSchemeToggle from "../ColorSchemeToggle.jsx";
import { LoginStyle } from "../styles/LoginStyle.js";
import Logo from "../assets/logo.png";
import { AlertDiaLog } from "../Dialogs/Alert.js";
import { loginApi } from "../Api/Auth.js";
import { useMediaQuery } from '@mui/material';
import { Add, GppBad } from "@mui/icons-material";


export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { setUser, csrfToken } = useAuth();
    const [open, setOpen] = useState(false);
    const isMobile = useMediaQuery('(max-width:600px)');

    // login user
    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();
        await csrfToken();
        try {
            const Email = email + '@mail.local'
            const { data, status } = await loginApi(Email, password);
            if (status === 200) {
                setUser(data.user);
                console.log('login success')
                return <Navigate to="/home" />;
            } else {
                AlertDiaLog({
                    text: data.message,
                    onPassed: () => window.location.reload()
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const SnackBarComponent = () => (
        <Snackbar
            autoHideDuration={4000}
            open={open} variant='solid'
            color='danger' anchorOrigin={{
                vertical: 'top',
                horizontal: 'center'
            }}
            invertedColors
            startDecorator={<GppBad />}
            onClose={() => setOpen(false)}
        >
            <div>

                <Typography level="title-lg">
                    เกิดข้อผิดพลาด
                </Typography>
                <Stack direction="row" spacing={1}>
                    <Typography sx={{ mt: 1, mb: 2 }}>
                        ระบบลงทะเบียนยังไม่เปิดใช้งาน หากต้องการใช้งานระบบกรุณาติดต่อ admin it
                    </Typography>
                </Stack>
            </div>
        </Snackbar>
    )

    return (
        <CssVarsProvider defaultMode="dark" disableTransitionOnChange>
            <CssBaseline />
            {open && <SnackBarComponent />}
            <GlobalStyles styles={{ ':root': { '--Form-maxWidth': '800px', '--Transition-duration': '0.4s', }, }} />
            <Box
                sx={[LoginStyle.Layout, (theme) => ({
                    [theme.getColorSchemeSelector('dark')]: { backgroundColor: 'rgba(19 19 24 / 0.4)', },
                })]}
            >
                <Box sx={[LoginStyle.ContentLeft, { px: isMobile ? 2 : 0 }]}>
                    <Box component="header" sx={[LoginStyle.Header, { px: isMobile ? 0 : 3 }]}>
                        <Box sx={LoginStyle.Title}>
                            <IconButton variant="soft" size="sm" color='danger'>
                                <img src={Logo || ''} alt="" width={25} />
                            </IconButton>
                            <Typography level="title-lg">PUMPKIN ครบทุกเรื่อง เครื่องมือช่าง</Typography>
                        </Box>
                        <ColorSchemeToggle />
                    </Box>
                    <Box sx={LoginStyle.ContentLeftMain}>
                        <Stack gap={4} sx={{ mb: 2 }}>
                            <Stack gap={1}>
                                <Typography component="h1" level="h3">
                                    Call Center System
                                    <br />
                                    ระบบแชทบริการลูกค้า
                                </Typography>
                            </Stack>
                        </Stack>
                        <Divider sx={(theme) => ({ [theme.getColorSchemeSelector('light')]: LoginStyle.ThemeLight })}>
                            เข้าสู่ระบบ
                        </Divider>
                        <Stack gap={4} sx={{ mt: 2 }}>
                            <form onSubmit={handleSubmit} method={'POST'}>
                                <FormControl required>
                                    <FormLabel required>รหัสพนักงาน</FormLabel>
                                    <Input
                                        required placeholder='กรุณากรอกรหัสพนักงาน'
                                        onChange={(e) => setEmail(e.target.value)}
                                        type={'text'} name="email" autoFocus
                                    />
                                </FormControl>
                                <FormControl required>
                                    <FormLabel required>รหัสผ่าน</FormLabel>
                                    <Input
                                        required placeholder='กรุณากรอกรหัสผ่าน'
                                        defaultValue={password} type="password" name="password"
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </FormControl>
                                <Stack direction='row' spacing={2} mt={2}>
                                    <Button
                                        sx={{ backgroundColor: '#f15739', '&:hover': { backgroundColor: 'darkorange' } }}
                                        disabled={loading}
                                        type="submit" fullWidth
                                        startDecorator={<LoginIcon />}
                                        loading={loading}
                                    >
                                        เข้าสู่ระบบ
                                    </Button>
                                    <Button
                                        color='neutral' disabled={loading}
                                        fullWidth startDecorator={<Add />}
                                        loading={loading} onClick={() => setOpen(true)}
                                    >
                                        ลงทะเบียน
                                    </Button>
                                </Stack>

                            </form>
                        </Stack>
                    </Box>
                    <Box component="footer" sx={{ py: 3 }}>
                        <Typography level="body-xs" textAlign="center">
                            © Pumpkin Corporation Company Limited | Bangkok {new Date().getFullYear()}
                        </Typography>
                    </Box>
                </Box>
            </Box>
            <Box
                sx={[LoginStyle.ContentRight, (theme) => ({
                    [theme.getColorSchemeSelector('dark')]: LoginStyle.ImageDark
                })]}>
            </Box>
        </CssVarsProvider>
    );
}