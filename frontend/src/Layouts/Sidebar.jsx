import {
    Avatar, Box, Divider, IconButton, List, ListItem, ListItemButton,
    listItemButtonClasses, ListItemContent, Typography, Sheet, GlobalStyles,
    Button
} from '@mui/joy';
import Logo from '../assets/logo.png'
import ColorSchemeToggle from '../ColorSchemeToggle';
import { closeSidebar } from '../utils';
import { LayoutStyle } from "../styles/LayoutStyle.js";
import { useAuth } from "../context/AuthContext.jsx";
import { AlertDiaLog } from "../Dialogs/Alert.js";
import { logoutApi } from "../Api/Auth.js";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useChatRooms } from "../context/ChatRoomContext.jsx";
import { SidebarAdmin } from "./SidebarAdmin.jsx";
import {
    Search, History, ThreeP, Home, Person,
    LogoutRounded, QuestionAnswerRounded
} from '@mui/icons-material';

const menuList = [
    { label: 'หน้าหลัก', icon: <Home />, path: '/home' },
    { label: 'เคสของฉัน', icon: <ThreeP />, path: '/chat/myCase' },
    { label: 'ค้นหา note', icon: <Search />, path: '/search-notes' },
];

export default function Sidebar() {
    const { myRoomContext } = useChatRooms()
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const currentRoomId = pathname.split('/')[3];

    const Logout = () => {
        AlertDiaLog({
            text: 'ต้องการออกจากระบบหรือไม่', icon: 'info', Outside: true,
            onPassed: async (confirm) => {
                if (confirm) {
                    const { data, status } = await logoutApi();
                    status === 200 && setUser(null)
                    AlertDiaLog({
                        icon: status === 200 ? 'success' : 'error',
                        text: data.message,
                        onPassed: (confirm) => {
                            if (confirm) {
                                localStorage.removeItem('notification');
                                localStorage.removeItem('myChatRooms');
                                localStorage.removeItem('chatRooms');
                                navigate('/')
                            } else { }
                        }
                    });
                } else { }
            }
        });
    }


    return (
        <Sheet className="Sidebar" sx={[LayoutStyle.Sidebar.Layout]}>
            <GlobalStyles
                styles={(theme) => ({
                    ':root': {
                        '--Sidebar-width': '220px',
                        [theme.breakpoints.up('lg')]: {
                            '--Sidebar-width': '240px',
                        },
                    },
                })}
            />
            <Box sx={LayoutStyle.Sidebar.Overlay} onClick={() => closeSidebar()} />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <IconButton variant="soft" color="danger" size="sm">
                    <img src={Logo || ''} alt="" width={25} />
                </IconButton>
                <Typography level="title-lg">Pumpkin Co.</Typography>
                <ColorSchemeToggle sx={{ ml: 'auto' }} />
            </Box>
            <Box sx={{ ...LayoutStyle.Sidebar.ListItemButton, [`& .${listItemButtonClasses.root}`]: { gap: 1.5, }, }}>
                <List size="sm" sx={LayoutStyle.Sidebar.List}>
                    {menuList.map((item, index) => (
                        <ListItem component={Link} to={item.path} key={index}>
                            <ListItemButton selected={pathname === item.path}>
                                {item.icon}
                                <ListItemContent>
                                    <Typography level="title-sm">{item.label}</Typography>
                                </ListItemContent>
                            </ListItemButton>
                        </ListItem>
                    ))}
                    {myRoomContext && myRoomContext.length > 0 && (
                        myRoomContext.map((chatRoom, index) => (
                            <ListItem key={index} component={Link}
                                to={`/chat/room/${chatRoom.roomId}/${chatRoom.roomName}`}>
                                <ListItemButton selected={currentRoomId === chatRoom.roomId}>
                                    <QuestionAnswerRounded />
                                    <ListItemContent>
                                        <Typography level="title-sm">{chatRoom.roomName}</Typography>
                                    </ListItemContent>
                                </ListItemButton>
                            </ListItem>
                        ))
                    )}
                </List>
                <Typography startDecorator={<Person />} level='body-sm' mt={3}>รายการของท่าน</Typography>
                <Divider />
                <List size="sm" sx={LayoutStyle.Sidebar.ListButton}>
                    <ListItem component={Link} to={`/chatHistory`}>
                        <ListItemButton selected={pathname === '/chatHistory'}>
                            <History />
                            <Typography level="title-sm">ประวัติการสนทนาทั้งหมด</Typography>
                        </ListItemButton>
                    </ListItem>
                </List>
                {user.role === 'admin' && <SidebarAdmin pathname={pathname} user={user} />}
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', cursor: 'pointer' }} component={Link} to={'/profile'}>
                <Avatar src={user.avatar} variant="outlined" size="sm" />
                <Box sx={{ minWidth: 0, flex: 1 }} >
                    <Typography level="title-sm" mb={1}>{user.name}</Typography>
                    <Typography level="body-xs">สิทธิ์&nbsp;{user.role}</Typography>
                </Box>
                <Button onClick={Logout} size="sm" variant="solid" color="danger">
                    <LogoutRounded />
                </Button>
            </Box>
        </Sheet>
    );
}