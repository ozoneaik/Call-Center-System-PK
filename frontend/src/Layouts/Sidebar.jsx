import * as React from 'react';
import GlobalStyles from '@mui/joy/GlobalStyles';
import Avatar from '@mui/joy/Avatar';
import Box from '@mui/joy/Box';
import Chip from '@mui/joy/Chip';
import Divider from '@mui/joy/Divider';
import IconButton from '@mui/joy/IconButton';
import Input from '@mui/joy/Input';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemButton, {listItemButtonClasses} from '@mui/joy/ListItemButton';
import ListItemContent from '@mui/joy/ListItemContent';
import Typography from '@mui/joy/Typography';
import Sheet from '@mui/joy/Sheet';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import QuestionAnswerRoundedIcon from '@mui/icons-material/QuestionAnswerRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import GroupIcon from '@mui/icons-material/Group';
import ChatIcon from '@mui/icons-material/Chat';
import ColorSchemeToggle from "../Components/ColorSchemeToggle.jsx";
import {closeSidebar} from "../Components/utils.js";
import {Link, useNavigate} from "react-router-dom";
import {useAuth} from "../Contexts/AuthContext.jsx";
import {LogoutApi} from "../Api/Auth.js";
import {AlertWithConfirm} from "../Dialogs/Alert.js";
import TryIcon from '@mui/icons-material/Try';

function Toggler(props) {
    const {defaultExpanded, renderToggle, children} = props;
    const [open, setOpen] = React.useState(defaultExpanded);
    return (
        <React.Fragment>
            {renderToggle({open, setOpen})}
            <Box
                sx={[
                    {
                        display: 'grid', transition: '0.2s ease',
                        '& > *': {
                            overflow: 'hidden',
                        },
                    },
                    open ? {gridTemplateRows: '1fr'} : {gridTemplateRows: '0fr'},
                ]}
            >
                {children}
            </Box>
        </React.Fragment>
    );
}

export default function Sidebar() {
    const {user} = useAuth();
    const navigate = useNavigate();

    const Logout = () => {
        AlertWithConfirm({
                text: 'ต้องการออกจากระบบหรือไม่', onPassed: async (confirm) => {
                    if (confirm) {
                        const {data, status} = await LogoutApi();
                        console.log(data, status)
                        if (status === 200) {
                            localStorage.removeItem('user')
                            navigate('/login')
                        }
                    }
                }
            }
        )
    }
    return (
        <Sheet
            className="Sidebar"
            sx={{
                position: {xs: 'fixed', md: 'sticky'}, zIndex: 10000,
                transform: {
                    xs: 'translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1)))',
                    md: 'none',
                },
                transition: 'transform 0.4s, width 0.4s', height: '100dvh', width: 'var(--Sidebar-width)',
                top: 0, p: 2, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2,
                borderRight: '1px solid', borderColor: 'divider',
            }}
        >
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
            <Box
                className="Sidebar-overlay"
                sx={{
                    position: 'fixed', zIndex: 9998, top: 0, left: 0, width: '100vw', height: '100vh',
                    opacity: 'var(--SideNavigation-slideIn)', backgroundColor: 'var(--joy-palette-background-backdrop)',
                    transition: 'opacity 0.4s',
                    transform: {
                        xs: 'translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1) + var(--SideNavigation-slideIn, 0) * var(--Sidebar-width, 0px)))',
                        lg: 'translateX(-100%)',
                    },
                }}
                onClick={() => closeSidebar()}
            />
            <Box sx={{display: 'flex', gap: 1, alignItems: 'center'}}>
                <IconButton variant="soft" color="danger" size="sm">
                    <ChatIcon/>
                </IconButton>
                <Typography level="title-lg">Pumpkin Co.</Typography>
                <ColorSchemeToggle sx={{ml: 'auto'}}/>
            </Box>
            <Input size="sm" startDecorator={<SearchRoundedIcon/>} placeholder="Search"/>
            <Box
                sx={{
                    minHeight: 0, overflow: 'hidden auto', flexGrow: 1, display: 'flex',
                    flexDirection: 'column',
                    [`& .${listItemButtonClasses.root}`]: {gap: 1.5,},
                }}
            >
                <List
                    size="sm"
                    sx={{
                        gap: 1,
                        '--List-nestedInsetStart': '30px',
                        '--ListItem-radius': (theme) => theme.vars.radius.sm,
                    }}
                >
                    <ListItem>
                        <ListItemButton component={Link} to={'/home'}>
                            <HomeRoundedIcon/>
                            <ListItemContent >
                                <Typography level="title-sm">หน้าหลัก</Typography>
                            </ListItemContent>
                        </ListItemButton>
                    </ListItem>
                    <ListItem nested>
                        <Toggler
                            renderToggle={({open, setOpen}) => (
                                <ListItemButton onClick={() => setOpen(!open)}>
                                    <QuestionAnswerRoundedIcon/>
                                    <ListItemContent>
                                        <Typography level="title-sm">ไม่มี</Typography>
                                    </ListItemContent>
                                    <KeyboardArrowDownIcon
                                        sx={[open ? {transform: 'rotate(180deg)',} : {transform: 'none',},]}
                                    />
                                </ListItemButton>
                            )}
                        >
                            <List sx={{gap: 0.5}}>
                                <ListItem sx={{mt: 0.5}}>
                                    <ListItemButton>All tasks</ListItemButton>
                                </ListItem>
                            </List>
                        </Toggler>
                    </ListItem>
                    <ListItem>
                        <ListItemButton component={Link} to={'/chats/room/0'}>
                            <TryIcon/>
                            <ListItemContent>
                                <Typography level="title-sm">ห้องแชทใหม่</Typography>
                            </ListItemContent>
                            {/*<Chip size="sm" color="danger" variant="solid">10</Chip>*/}
                        </ListItemButton>
                    </ListItem>
                    <ListItem>
                        <ListItemButton component={Link} to={'/chats/room/1'}>
                            <QuestionAnswerRoundedIcon/>
                            <ListItemContent>
                                <Typography level="title-sm">ห้องแชทที่ 1</Typography>
                            </ListItemContent>
                            {/*<Chip size="sm" color="danger" variant="solid">10</Chip>*/}
                        </ListItemButton>
                    </ListItem>
                </List>
                <List
                    size="sm"
                    sx={{
                        mt: 'auto', flexGrow: 0, mb: 2,
                        '--ListItem-radius': (theme) => theme.vars.radius.sm,
                        '--List-gap': '8px',
                    }}
                >
                    <ListItem>
                        <ListItemButton>
                            <SettingsRoundedIcon/>
                            การตั้งค่า
                        </ListItemButton>
                    </ListItem>
                    <ListItem>
                        <ListItemButton component={Link} to={'/customer'}>
                            <GroupIcon/>
                            จัดการลูกค้า
                        </ListItemButton>
                    </ListItem>
                    <ListItem>
                        <ListItemButton component={Link} to={'/user'}>
                            <GroupIcon/>
                            จัดการผู้ใช้
                        </ListItemButton>
                    </ListItem>
                </List>
            </Box>
            <Divider/>
            <Box sx={{display: 'flex', gap: 1, alignItems: 'center'}}>
                <Avatar
                    variant="outlined" size="sm"
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=286"
                />
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