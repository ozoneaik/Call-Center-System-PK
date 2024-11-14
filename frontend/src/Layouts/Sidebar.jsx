import {useEffect, useState} from 'react';
import GlobalStyles from '@mui/joy/GlobalStyles';
import Avatar from '@mui/joy/Avatar';
import Box from '@mui/joy/Box';
import Divider from '@mui/joy/Divider';
import IconButton from '@mui/joy/IconButton';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemButton, {listItemButtonClasses} from '@mui/joy/ListItemButton';
import ListItemContent from '@mui/joy/ListItemContent';
import Typography from '@mui/joy/Typography';
import Sheet from '@mui/joy/Sheet';
import QuestionAnswerRoundedIcon from '@mui/icons-material/QuestionAnswerRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import HomeIcon from '@mui/icons-material/Home';
import Logo from '../assets/logo.png'
import ColorSchemeToggle from '../ColorSchemeToggle';
import {closeSidebar} from '../utils';
import {LayoutStyle} from "../styles/LayoutStyle.js";
import {useAuth} from "../context/AuthContext.jsx";
import {AlertDiaLog} from "../Dialogs/Alert.js";
import {logoutApi} from "../api/Auth.js";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {useChatRooms} from "../context/ChatRoomContext.jsx";
import PersonIcon from '@mui/icons-material/Person';
import {chatRoomListApi} from "../Api/ChatRooms.js";
import {SidebarAdmin} from "./SidebarAdmin.jsx";

export default function Sidebar() {
    const {setChatRoomsContext} = useChatRooms()
    const {user, setUser} = useAuth();
    const navigate = useNavigate();
    const [chatRooms, setChatRooms] = useState([{roomName: '', roomId: ''}]);
    const {pathname} = useLocation();
    const currentRoomId = pathname.split('/')[3];

    const fetchChatRooms = async () => {
        const {data, status} = await chatRoomListApi();
        if (status === 200) {
            setChatRooms(data.chatRooms);
            setChatRoomsContext(data.chatRooms)
        }
    }
    useEffect(() => {
        fetchChatRooms().then(() => console.log('fetch 👏'));
    }, [])

    const Logout = () => {
        AlertDiaLog({
            text: 'ต้องการออกจากระบบหรือไม่', icon: 'info', Outside: true,
            onPassed: async (confirm) => {
                if (confirm) {
                    const {data, status} = await logoutApi();
                    status === 200 && setUser(null)
                    AlertDiaLog({
                        icon: status === 200 ? 'success' : 'error',
                        text: data.message,
                        onPassed: (confirm) => {
                            if (confirm) {
                                localStorage.removeItem('notification');
                                navigate('/')
                            } else console.log('confirm is False')
                        }
                    });
                } else console.log('confirm is False')
            }
        });
    }


    return (
        <Sheet className="Sidebar" sx={LayoutStyle.Sidebar.Layout}>
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
            <Box sx={LayoutStyle.Sidebar.Overlay} onClick={() => closeSidebar()}/>
            <Box sx={{display: 'flex', gap: 1, alignItems: 'center'}}>
                <IconButton variant="soft" color="danger" size="sm">
                    <img src={Logo || ''} alt="" width={25}/>
                </IconButton>
                <Typography level="title-lg">Pumpkin Co.</Typography>
                <ColorSchemeToggle sx={{ml: 'auto'}}/>
            </Box>
            <Box sx={{...LayoutStyle.Sidebar.ListItemButton, [`& .${listItemButtonClasses.root}`]: {gap: 1.5,},}}>
                <List size="sm" sx={LayoutStyle.Sidebar.List}>
                    <ListItem component={Link} to={`/home`}>
                        <ListItemButton selected={pathname === `/home`}>
                            <HomeIcon/>
                            <ListItemContent>
                                <Typography level="title-sm">หน้าหลัก</Typography>
                            </ListItemContent>
                        </ListItemButton>
                    </ListItem>
                    {chatRooms && chatRooms.length > 0 && (
                        chatRooms.map((chatRoom, index) => (
                            <ListItem key={index} component={Link}
                                      to={`/chat/room/${chatRoom.roomId}/${chatRoom.roomName}`}>
                                <ListItemButton selected={currentRoomId === chatRoom.roomId}>
                                    <QuestionAnswerRoundedIcon/>
                                    <ListItemContent>
                                        <Typography level="title-sm">{chatRoom.roomName}</Typography>
                                    </ListItemContent>
                                </ListItemButton>
                            </ListItem>
                        ))
                    )}
                </List>
                <Typography startDecorator={<PersonIcon/>} level='body-sm'>
                    รายการของท่าน
                </Typography>
                <Divider/>
                <List size="sm" sx={LayoutStyle.Sidebar.ListButton}>
                    <ListItem component={Link} to={`/chatHistory`}>
                        <ListItemButton selected={pathname === '/chatHistory'}>
                            <MeetingRoomIcon/>
                            ประวัติการสนทนาทั้งหมด
                        </ListItemButton>
                    </ListItem>
                </List>

                {user.role === 'admin' && <SidebarAdmin pathname={pathname} user={user}/>}

            </Box>
            <Divider/>
            <Box sx={{display: 'flex', gap: 1, alignItems: 'center'}}>
                <Avatar src={user.avatar} variant="outlined" size="sm"/>
                <Box sx={{minWidth: 0, flex: 1}}>
                    <Typography level="title-sm" mb={1}>{user.name}</Typography>
                    <Typography level="body-xs">สิทธิ์&nbsp;{user.role}</Typography>
                </Box>
                <IconButton onClick={Logout} size="sm" variant="soft" color="danger">
                    <LogoutRoundedIcon/>
                </IconButton>
            </Box>
        </Sheet>
    );
}