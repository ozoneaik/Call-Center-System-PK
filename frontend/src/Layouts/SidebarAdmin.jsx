import Typography from "@mui/joy/Typography";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import Divider from "@mui/joy/Divider";
import List from "@mui/joy/List";
import {LayoutStyle} from "../styles/LayoutStyle.js";
import ListItem from "@mui/joy/ListItem";
import {Link} from "react-router-dom";
import ListItemButton from "@mui/joy/ListItemButton";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import TokenIcon from "@mui/icons-material/Token";

export const SidebarAdmin = ({pathname}) => (
    <>
        <Typography startDecorator={<AdminPanelSettingsIcon/>} mt={2} mb={1} level='body-sm'>
            สำหรับผู้ดูแลระบบ
        </Typography>
        <Divider/>
        <List size="sm" sx={LayoutStyle.Sidebar.ListButton}>
            <ListItem component={Link} to={`/botManage`}>
                <ListItemButton selected={pathname === '/botManage'}>
                    <SmartToyIcon/>
                    จัดการเมนูของบอท
                </ListItemButton>
            </ListItem>
            <ListItem component={Link} to={`/chatRooms`}>
                <ListItemButton selected={pathname === '/chatRooms'}>
                    <MeetingRoomIcon/>
                    จัดการห้องแชท
                </ListItemButton>
            </ListItem>
            <ListItem component={Link} to={'/shortChats'}>
                <ListItemButton selected={pathname === '/shortChats'}>
                    <ManageAccountsIcon/>
                    จัดการข้อความส่งด่วน
                </ListItemButton>
            </ListItem>
            <ListItem component={Link} to={'/customers'}>
                <ListItemButton selected={pathname === '/customers'}>
                    <PeopleAltIcon/>
                    จัดการลูกค้า
                </ListItemButton>
            </ListItem>
            <ListItem component={Link} to={'/users'}>
                <ListItemButton selected={pathname === '/users'}>
                    <ManageAccountsIcon/>
                    จัดการผู้ใช้
                </ListItemButton>
            </ListItem>
            <ListItem component={Link} to={'/accessToken'}>
                <ListItemButton selected={pathname === '/accessToken'}>
                    <TokenIcon/>
                    จัดการ token
                </ListItemButton>
            </ListItem>
        </List>
    </>
)