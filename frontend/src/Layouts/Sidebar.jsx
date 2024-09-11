import * as React from 'react';
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
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import GroupIcon from '@mui/icons-material/Group';
import ColorSchemeToggle from "../Components/ColorSchemeToggle.jsx";
import {closeSidebar} from "../Components/utils.js";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {useAuth} from "../Contexts/AuthContext.jsx";
import {LogoutApi} from "../Api/Auth.js";
import {AlertWithConfirm} from "../Dialogs/Alert.js";
import TryIcon from '@mui/icons-material/Try';
import {chatRoomListApi} from "../Api/chatRooms.js";
import Chip from "@mui/joy/Chip";
import Logo from '../assets/logo.png';

const listItemComponent = ({title, icon, path, unReads = 0, Selected = false}) => (
    <ListItem>
        <ListItemButton selected={Selected} component={Link} to={path}>
            {icon}
            <ListItemContent>
                <Typography level="title-sm">{title}</Typography>
            </ListItemContent>
            {unReads > 0 && (<Chip size="sm" color="danger" variant="solid">{unReads}</Chip>)}
        </ListItemButton>
    </ListItem>
);

export default function Sidebar() {
    const {user} = useAuth();
    const navigate = useNavigate();
    const [listRoom, setListRooms] = useState([]);
    const {pathname} = useLocation();

    useEffect(() => {
        getListRoom().then();
    }, [])

    const getListRoom = async () => {
        const {data, status} = await chatRoomListApi();
        status === 200 ? setListRooms(data.chatRooms) : setListRooms([]);
    }

    const Logout = () => {
        AlertWithConfirm({
            text: 'ต้องการออกจากระบบหรือไม่',
            onPassed: async (confirm) => {
                if (confirm) {
                    const {status} = await LogoutApi();
                    if (status === 200) {
                        localStorage.removeItem('user')
                        navigate('/login')
                    }
                }
            }
        });
    }
    return (
        <Sheet
            className="Sidebar"
            sx={{
                position: {xs: 'fixed', md: 'sticky'}, zIndex: 10000,
                transform: {xs: 'translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1)))', md: 'none',},
                transition: 'transform 0.4s, width 0.4s', height: '100dvh', width: 'var(--Sidebar-width)',
                top: 0, p: 2, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2,
                borderRight: '1px solid', borderColor: 'divider',
            }}
        >
            <GlobalStyles
                styles={(theme) => ({
                    ':root': {'--Sidebar-width': '220px', [theme.breakpoints.up('lg')]: {'--Sidebar-width': '240px',}}
                })}
            />
            <Box
                className="Sidebar-overlay"
                sx={{
                    position: 'fixed', zIndex: 9998, top: 0, left: 0, width: '100vw', height: '100vh',
                    transition: 'opacity 0.4s',
                    opacity: 'var(--SideNavigation-slideIn)', backgroundColor: 'var(--joy-palette-background-backdrop)',
                    transform: {
                        xs: 'translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1) + var(--SideNavigation-slideIn, 0) * var(--Sidebar-width, 0px)))',
                        lg: 'translateX(-100%)',
                    },
                }}
                onClick={() => closeSidebar()}
            />
            <Box sx={{display: 'flex', gap: 1, alignItems: 'center'}}>
                <IconButton variant="soft" color="danger" size="sm">
                    <img src={Logo || ''} alt="" width={25}/>
                </IconButton>
                <Typography level="title-lg">Pumpkin Co.</Typography>
                <ColorSchemeToggle sx={{ml: 'auto'}}/>
            </Box>
            <Box
                sx={{
                    minHeight: 0, overflow: 'hidden auto', flexGrow: 1, display: 'flex',
                    flexDirection: 'column', [`& .${listItemButtonClasses.root}`]: {gap: 1.5,},
                }}
            >
                <List
                    size="sm"
                    sx={{
                        gap: 1, '--List-nestedInsetStart': '30px',
                        '--ListItem-radius': (theme) => theme.vars.radius.sm,
                    }}
                >
                    {listItemComponent({title: 'หน้าหลัก', path: '/home', icon: <HomeRoundedIcon/>})}
                    {
                        listRoom.length > 0 && (
                            listRoom.map((list, index) => (
                                listItemComponent({
                                    title: list.name, path: `/chats/room/${list.id}`, icon: <TryIcon/>,
                                    unReads: list.unReads, Selected: pathname.startsWith(`/chats/room/${list.id}`)
                                })
                            ))
                        )
                    }
                </List>
                <List
                    size="sm"
                    sx={{
                        mt: 'auto', flexGrow: 0, mb: 2, '--List-gap': '8px',
                        '--ListItem-radius': (theme) => theme.vars.radius.sm,
                    }}
                >
                    {listItemComponent({
                        title: 'การตั้งค่า', path: '',
                        icon: <SettingsRoundedIcon/>, Selected: pathname.startsWith('/settings')
                    })}
                    {listItemComponent({
                        title: 'จัดการลูกค้า', path: '/customer/list',
                        icon: <GroupIcon/>, Selected: pathname.startsWith('/customer')
                    })}
                    {listItemComponent({
                        title: 'จัดการผู้ใช้', path: '/user/list',
                        icon: <GroupIcon/>, Selected: pathname.startsWith('/user')
                    })}
                </List>
            </Box>
            <Divider/>
            <Box sx={{display: 'flex', gap: 1, alignItems: 'center'}}>
                <Avatar variant="outlined" size="sm" src={user.avatar}/>
                <Box sx={{minWidth: 0, flex: 1}}>
                    <Typography level="title-sm">{user.name}</Typography>
                    <Typography level="body-xs">{user.email}</Typography>
                </Box>
                <IconButton onClick={Logout} size="sm" variant="plain" color="neutral">
                    <LogoutRoundedIcon/>
                </IconButton>
            </Box>
        </Sheet>
    );
}