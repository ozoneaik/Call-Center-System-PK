import Typography from "@mui/joy/Typography";
import Divider from "@mui/joy/Divider";
import List from "@mui/joy/List";
import { LayoutStyle } from "../styles/LayoutStyle.js";
import ListItem from "@mui/joy/ListItem";
import { Link } from "react-router-dom";
import ListItemButton from "@mui/joy/ListItemButton";
import {
    CircleNotifications, Keyboard, LocalOffer, Token, PeopleAlt,
    ManageAccounts, MeetingRoom, SmartToy, AdminPanelSettings, LiveHelp,
    EmojiEmotions
} from "@mui/icons-material";

const menuList = [
    { label: 'จัดการคีย์เวิร์ด', icon: <Keyboard />, path: '/keywords' },
    { label: 'จัดการเมนูของบอท', icon: <SmartToy />, path: '/botManage' },
    { label: 'จัดการห้องแชท', icon: <MeetingRoom />, path: '/chatRooms' },
    { label: 'จัดการข้อความส่งด่วน', icon: <ManageAccounts />, path: '/shortChats' },
    { label: 'จัดการลูกค้า', icon: <PeopleAlt />, path: '/customers' },
    { label: 'จัดการผู้ใช้', icon: <ManageAccounts />, path: '/users' },
    { label: 'จัดการ help Chat', icon: <LiveHelp />, path: '/helpChat' },
    { label: 'จัดการ Sticker', icon: <EmojiEmotions />, path: '/sticker' },
    { label: 'จัดการ tag การจบสนทนา', icon: <LocalOffer />, path: '/tags' },
    { label: 'หน้ารายงาน', icon: <SmartToy />, path: '/report' },
];

const menuListAdmin = [
    { label: 'จัดการ token', icon: <Token />, path: '/accessToken' },
    { label: 'แจ้งเตือน', icon: <CircleNotifications />, path: '/announces' },
];

export const SidebarAdmin = ({ pathname, user }) => (
    <>
        <Typography startDecorator={<AdminPanelSettings />} mt={2} mb={1} level='body-sm'>
            สำหรับผู้ดูแลระบบ
        </Typography>
        <Divider />
        <List size="sm" sx={LayoutStyle.Sidebar.ListButton}>
            {menuList.map((item, index) => (
                <ListItem component={Link} to={item.path} key={index}>
                    <ListItemButton selected={pathname === item.path}>
                        {item.icon}
                        <Typography level="title-sm">{item.label}</Typography>
                    </ListItemButton>
                </ListItem>
            ))}
            {user.empCode === 'adminIT' &&
                <>
                    {menuListAdmin.map((item, index) => (
                        <ListItem component={Link} to={item.path} key={index}>
                            <ListItemButton selected={pathname === item.path}>
                                {item.icon}
                                <Typography level="title-sm">{item.label}</Typography>
                            </ListItemButton>
                        </ListItem>
                    ))}
                </>}
        </List>
    </>
)