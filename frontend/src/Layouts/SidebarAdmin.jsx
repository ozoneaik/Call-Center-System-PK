import Typography from "@mui/joy/Typography";
import Divider from "@mui/joy/Divider";
import List from "@mui/joy/List";
import { LayoutStyle } from "../styles/LayoutStyle.js";
import ListItem from "@mui/joy/ListItem";
import { Link } from "react-router-dom";
import ListItemButton from "@mui/joy/ListItemButton";
import {
    CircleNotifications, Keyboard, LocalOffer, Token, PeopleAlt,
    ManageAccounts, MeetingRoom, SmartToy, AdminPanelSettings,LiveHelp
} from "@mui/icons-material";

export const SidebarAdmin = ({ pathname, user }) => (
    <>
        <Typography startDecorator={<AdminPanelSettings />} mt={2} mb={1} level='body-sm'>
            สำหรับผู้ดูแลระบบ
        </Typography>
        <Divider />
        <List size="sm" sx={LayoutStyle.Sidebar.ListButton}>
            <ListItem component={Link} to={'/keywords'}>
                <ListItemButton selected={pathname === '/keywords'}>
                    <Keyboard />
                    จัดการคีย์เวิร์ด
                </ListItemButton>
            </ListItem>
            <ListItem component={Link} to={`/botManage`}>
                <ListItemButton selected={pathname === '/botManage'}>
                    <SmartToy />
                    จัดการเมนูของบอท
                </ListItemButton>
            </ListItem>
            <ListItem component={Link} to={`/report`}>
                <ListItemButton selected={pathname === '/report'}>
                    <SmartToy />
                    หน้ารายงาน
                </ListItemButton>
            </ListItem>
            <ListItem component={Link} to={`/chatRooms`}>
                <ListItemButton selected={pathname === '/chatRooms'}>
                    <MeetingRoom />
                    จัดการห้องแชท
                </ListItemButton>
            </ListItem>
            <ListItem component={Link} to={'/shortChats'}>
                <ListItemButton selected={pathname === '/shortChats'}>
                    <ManageAccounts />
                    จัดการข้อความส่งด่วน
                </ListItemButton>
            </ListItem>
            <ListItem component={Link} to={`/tags`}>
                <ListItemButton selected={pathname === '/tags'}>
                    <LocalOffer />
                    จัดการ tag การจบสนทนา
                </ListItemButton>
            </ListItem>
            <ListItem component={Link} to={'/customers'}>
                <ListItemButton selected={pathname === '/customers'}>
                    <PeopleAlt />
                    จัดการลูกค้า
                </ListItemButton>
            </ListItem>
            <ListItem component={Link} to={'/users'}>
                <ListItemButton selected={pathname === '/users'}>
                    <ManageAccounts />
                    จัดการผู้ใช้
                </ListItemButton>
            </ListItem>
            <ListItem component={Link} to={'/helpChat'}>
                <ListItemButton selected={pathname === '/helpChat'}>
                    <LiveHelp />
                    จัดการ help Chat
                </ListItemButton>
            </ListItem>
            {
                user.empCode === 'adminIT' && (
                    <>
                        <ListItem component={Link} to={'/accessToken'}>
                            <ListItemButton selected={pathname === '/accessToken'}>
                                <Token />
                                จัดการ token
                            </ListItemButton>
                        </ListItem>
                        <ListItem component={Link} to={'/accessToken'}>
                            <ListItemButton selected={pathname === '/accessToken'}>
                                <CircleNotifications />
                                แจ้งเตือน
                            </ListItemButton>
                        </ListItem>
                    </>
                )
            }
        </List>
    </>
)