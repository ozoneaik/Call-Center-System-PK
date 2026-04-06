import {
  Avatar,
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  listItemButtonClasses,
  ListItemContent,
  Typography,
  Sheet,
  GlobalStyles,
  Button,
  Input,
} from "@mui/joy";
import Logo from "../assets/logo.png";
import ColorSchemeToggle from "../ColorSchemeToggle";
import { closeSidebar } from "../utils";
import { LayoutStyle } from "../styles/LayoutStyle.js";
import { useAuth } from "../context/AuthContext.jsx";
import { AlertDiaLog } from "../Dialogs/Alert.js";
import { logoutApi } from "../Api/Auth.js";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useChatRooms } from "../context/ChatRoomContext.jsx";
import { Chip } from "@mui/joy";
import { SidebarAdmin } from "./SidebarAdmin.jsx";
import {
  Search,
  History,
  ThreeP,
  Home,
  Person,
  LogoutRounded,
  QuestionAnswerRounded,
  LiveHelp,
} from "@mui/icons-material";
import { useState, useEffect, useMemo } from "react";

const menuList = [
  { label: "หน้าหลัก", icon: <Home />, path: "/home" },
  { label: "เคสของฉัน", icon: <ThreeP />, path: "/chat/myCase" },
  { label: "ค้นหา note", icon: <Search />, path: "/search-notes" },
];

export default function Sidebar() {
  const { myRoomContext, roomUnread, roomPending, clearRoomUnread } = useChatRooms();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const currentRoomId = pathname.split("/")[3];

  // 🔍 state สำหรับค้นหาเมนู
  const [searchQuery, setSearchQuery] = useState("");

  // คำนวณจำนวนแจ้งเตือนรวมต่อห้อง (Pending เคส + Progress ข้อความ)
  const getRoomNotificationCount = (roomId) => {
    const pendingCases = roomPending[roomId] || 0;    // นับตามจำนวนเคส
    const unreadMessages = roomUnread[roomId] || 0;   // นับตามจำนวนข้อความ
    return pendingCases + unreadMessages;
  };

  const Logout = () => {
    AlertDiaLog({
      text: "ต้องการออกจากระบบหรือไม่",
      icon: "info",
      Outside: true,
      onPassed: async (confirm) => {
        if (confirm) {
          const { data, status } = await logoutApi();
          status === 200 && setUser(null);
          AlertDiaLog({
            icon: status === 200 ? "success" : "error",
            text: data.message,
            onPassed: (confirm) => {
              if (confirm) {
                localStorage.removeItem("notification");
                localStorage.removeItem("myChatRooms");
                localStorage.removeItem("chatRooms");
                localStorage.removeItem("roomUnread");
                localStorage.removeItem("roomPending");
                navigate("/");
              }
            },
          });
        }
      },
    });
  };

  return (
    <Sheet className="Sidebar" sx={[LayoutStyle.Sidebar.Layout]}>
      <GlobalStyles
        styles={(theme) => ({
          ":root": {
            "--Sidebar-width": "220px",
            [theme.breakpoints.up("lg")]: {
              "--Sidebar-width": "240px",
            },
          },
        })}
      />
      <Box sx={LayoutStyle.Sidebar.Overlay} onClick={() => closeSidebar()} />
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <IconButton
          variant="soft"
          color="danger"
          size="sm"
          onClick={() => navigate("/home")}
        >
          <img src={Logo || ""} alt="logo" width={25} />
        </IconButton>
        <Typography level="title-lg">Pumpkin Co.</Typography>
        <ColorSchemeToggle sx={{ ml: "auto" }} />
      </Box>
      <Box
        sx={{
          ...LayoutStyle.Sidebar.ListItemButton,
          [`& .${listItemButtonClasses.root}`]: { gap: 1.5 },
        }}
      >
        {/* 🔍 กล่องค้นหาเมนู */}
        <Box sx={{ my: 1 }}>
          <Input
            size="sm"
            placeholder="ค้นหาเมนู..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Box>

        <List size="sm" sx={LayoutStyle.Sidebar.List}>
          {menuList
            .filter((item) =>
              item.label.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .map((item, index) => (
              <ListItem component={Link} to={item.path} key={index}>
                <ListItemButton selected={pathname === item.path}>
                  {item.icon}
                  <ListItemContent>
                    <Typography level="title-sm">{item.label}</Typography>
                  </ListItemContent>
                </ListItemButton>
              </ListItem>
            ))}

          {/* รายการห้องแชท */}
          {myRoomContext &&
            myRoomContext.length > 0 &&
            myRoomContext
              .filter((chatRoom) =>
                chatRoom.roomName
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()),
              )
              .map((chatRoom, index) => {
                const pendingCases = roomPending[chatRoom.roomId] || 0;
                const unreadMessages = roomUnread[chatRoom.roomId] || 0;
                const totalCount = pendingCases + unreadMessages;

                return (
                  <ListItem
                    key={index}
                    component={Link}
                    to={`/chat/room/${chatRoom.roomId}/${chatRoom.roomName}`}
                  >
                    <ListItemButton selected={currentRoomId === chatRoom.roomId}>
                      <QuestionAnswerRounded />
                      <ListItemContent>
                        <Typography level="title-sm">
                          {chatRoom.roomName}
                        </Typography>
                      </ListItemContent>
                      {totalCount > 0 && (
                        <Chip size="sm" color="success" variant="solid">
                          {totalCount}
                        </Chip>
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
        </List>

        <Typography startDecorator={<Person />} level="body-sm" mt={3}>
          รายการของท่าน
        </Typography>
        <Divider />
        <List size="sm" sx={LayoutStyle.Sidebar.ListButton}>
          <ListItem component={Link} to={`/chatHistory`}>
            <ListItemButton selected={pathname === "/chatHistory"}>
              <History />
              <Typography level="title-sm">ประวัติการสนทนาทั้งหมด</Typography>
            </ListItemButton>
          </ListItem>
          {["68501", "68426", "68292"].includes(user.empCode) && (
            <ListItem component={Link} to="/helpChat">
              <ListItemButton selected={pathname === "/helpChat"}>
                <LiveHelp />
                <Typography level="title-sm">จัดการ help Chat</Typography>
              </ListItemButton>
            </ListItem>
          )}
        </List>
        {/* {user.role === 'admin' && <SidebarAdmin pathname={pathname} user={user} />} */}
        {user.role === "admin" && (
          <SidebarAdmin
            pathname={pathname}
            user={user}
            searchQuery={searchQuery}
          />
        )}
      </Box>
      <Divider />
      <Box
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "center",
          cursor: "pointer",
        }}
        component={Link}
        to={"/profile"}
      >
        <Avatar src={user.avatar} variant="outlined" size="sm" />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography level="title-sm" mb={1}>
            {user.name}
          </Typography>
          <Typography level="body-xs">สิทธิ์&nbsp;{user.role}</Typography>
        </Box>
        <Button onClick={Logout} size="sm" variant="solid" color="danger">
          <LogoutRounded />
        </Button>
      </Box>
    </Sheet>
  );
}
