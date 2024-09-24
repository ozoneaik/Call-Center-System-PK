import {useState} from 'react';
import {Navigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import {CssVarsProvider} from '@mui/joy/styles';
import GlobalStyles from '@mui/joy/GlobalStyles';
import CssBaseline from '@mui/joy/CssBaseline';
import Button from '@mui/joy/Button';
import Divider from '@mui/joy/Divider';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import IconButton from '@mui/joy/IconButton';
import Input from '@mui/joy/Input';
import Stack from '@mui/joy/Stack';
import LoginIcon from '@mui/icons-material/Login';
import {CircularProgress} from "@mui/joy";
import ColorSchemeToggle from "../ColorSchemeToggle.jsx";
import {LoginStyle} from "../styles/LoginStyle.js";
import Logo from "../assets/logo.png";
import {AlertDiaLog} from "../Dialogs/Alert.js";
import {loginApi} from "../api/Auth.js";

export default function Login() {
    const [email, setEmail] = useState('70010');
    const [password, setPassword] = useState('1111');
    const [loading, setLoading] = useState(false);
    const {setUser, csrfToken} = useAuth();

    // login user
    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();
        await csrfToken();
        try {
            const Email = email+'@mail.local'
            const {data, status} = await loginApi(Email, password);
            if (status === 200) {
                setUser(data.user);
                return <Navigate to="/home"/>;
            } else {
                AlertDiaLog({text: data.message})
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <CssVarsProvider defaultMode="dark" disableTransitionOnChange>
            <CssBaseline/>
            <GlobalStyles styles={{':root': {'--Form-maxWidth': '800px', '--Transition-duration': '0.4s',},}}/>
            <Box
                sx={[LoginStyle.Layout, (theme) => ({
                    [theme.getColorSchemeSelector('dark')]: {backgroundColor: 'rgba(19 19 24 / 0.4)',},
                })]}
            >
                <Box sx={LoginStyle.ContentLeft}>
                    <Box component="header" sx={LoginStyle.Header}>
                        <Box sx={LoginStyle.Title}>
                            <IconButton variant="soft" size="sm" color='danger'>
                                <img src={Logo || ''} alt="" width={25}/>
                            </IconButton>
                            <Typography level="title-lg">PUMPKIN ครบทุกเรื่อง เครื่องมือช่าง</Typography>
                        </Box>
                        <ColorSchemeToggle/>
                    </Box>
                    <Box sx={LoginStyle.ContentLeftMain}>
                        <Stack gap={4} sx={{mb: 2}}>
                            <Stack gap={1}>
                                <Typography component="h1" level="h3">
                                    Call Center System
                                    <br/>
                                    ระบบแชทบริการลูกค้า
                                </Typography>
                            </Stack>
                        </Stack>
                        <Divider sx={(theme) => ({[theme.getColorSchemeSelector('light')]: LoginStyle.ThemeLight})}>
                            เข้าสู่ระบบ
                        </Divider>
                        <Stack gap={4} sx={{mt: 2}}>
                            <form onSubmit={handleSubmit} method={'POST'}>
                                <FormControl required>
                                    <FormLabel>รหัสพนักงาน</FormLabel>
                                    <Input defaultValue={email} onChange={(e) => setEmail(e.target.value)} type={'text'}
                                           name="email"/>
                                </FormControl>
                                <FormControl required>
                                    <FormLabel>รหัสผ่าน</FormLabel>
                                    <Input defaultValue={password} onChange={(e) => setPassword(e.target.value)}
                                           type="password" name="password"/>
                                </FormControl>
                                <Stack gap={4} sx={{mt: 2}}>
                                    <Button
                                        sx={{backgroundColor: '#f15739', '&:hover': {backgroundColor: 'darkorange'}}}
                                        disabled={loading} type="submit" fullWidth>
                                        {!loading ? <span><LoginIcon/></span> : <CircularProgress/>}
                                    </Button>
                                </Stack>

                            </form>
                        </Stack>
                    </Box>
                    <Box component="footer" sx={{py: 3}}>
                        <Typography level="body-xs" textAlign="center">
                            © Pumpkin Corporation Company Limited | Bangkok {new Date().getFullYear()}
                        </Typography>
                    </Box>
                </Box>
            </Box>
            <Box
                sx={[LoginStyle.ContentRight, (theme) => ({
                    [theme.getColorSchemeSelector('dark')]: LoginStyle.ImageDark,
                })]}>
            </Box>
        </CssVarsProvider>
    );
}