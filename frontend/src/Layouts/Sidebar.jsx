import { hasAnyAdminMenu } from "../Components/adminMenus.js";
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
import { SidebarAdmin, Toggler } from "./SidebarAdmin.jsx";
import ShopeeLogo from "../assets/ShopeeLogo.svg";
import LazadaLogo from "../assets/LazadaLogo.svg";
import TiktokLogo from "../assets/TikTok.svg";
import {
  Search,
  History,
  ThreeP,
  Home,
  Person,
  LogoutRounded,
  QuestionAnswerRounded,
  Storefront,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from "@mui/icons-material";
import { useState, useEffect, useMemo } from "react";

const menuList = [
  { label: "หน้าหลัก", icon: <Home />, path: "/home" },
  { label: "เคสของฉัน", icon: <ThreeP />, path: "/chat/myCase" },
  { label: "ค้นหา note", icon: <Search />, path: "/search-notes" },
];

// ห้องแชท Marketplace แยกตามชื่อห้องที่มีชื่อแพลตฟอร์มอยู่
const marketplacePlatforms = [
  { key: "shopee", label: "Shopee", logo: ShopeeLogo },
  { key: "lazada", label: "Lazada", logo: LazadaLogo },
  { key: "tiktok", label: "TikTok", logo: TiktokLogo },
];

const getRoomPlatform = (roomName) =>
  marketplacePlatforms.find((p) => roomName.toLowerCase().includes(p.key))?.key;

const ArrowIcon = ({ open }) => (
  <KeyboardArrowDownIcon
    sx={{ transform: open ? "rotate(180deg)" : "none", transition: "0.2s" }}
  />
);

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

  const filteredRooms = (myRoomContext || []).filter((chatRoom) =>
    chatRoom.roomName.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const generalRooms = filteredRooms.filter((r) => !getRoomPlatform(r.roomName));
  const marketplaceGroups = marketplacePlatforms
    .map((p) => ({
      ...p,
      rooms: filteredRooms.filter((r) => getRoomPlatform(r.roomName) === p.key),
    }))
    .filter((g) => g.rooms.length > 0);
  const sumCount = (rooms) =>
    rooms.reduce((sum, r) => sum + getRoomNotificationCount(r.roomId), 0);

  const renderRoom = (chatRoom, sx, textSx) => {
    const totalCount = getRoomNotificationCount(chatRoom.roomId);
    return (
      <ListItem
        key={chatRoom.roomId}
        component={Link}
        to={`/chat/room/${chatRoom.roomId}/${chatRoom.roomName}`}
      >
        <ListItemButton selected={currentRoomId === chatRoom.roomId} sx={sx}>
          <QuestionAnswerRounded />
          <ListItemContent>
            <Typography level="title-sm" sx={textSx}>
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
  };

  const renderCountChip = (count) =>
    count > 0 && (
      <Chip size="sm" color="success" variant="solid">
        {count}
      </Chip>
    );

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
          {generalRooms.map((chatRoom) => renderRoom(chatRoom))}

          {/* ห้องแชท Marketplace (Shopee / Lazada / TikTok) */}
          {marketplaceGroups.length > 0 && (
            <ListItem nested>
              <Toggler
                defaultExpanded={marketplaceGroups.some((g) =>
                  g.rooms.some((r) => r.roomId === currentRoomId),
                )}
                renderToggle={({ open, setOpen }) => (
                  <ListItemButton onClick={() => setOpen(!open)}>
                    <Storefront />
                    <ListItemContent>
                      <Typography level="title-sm">Marketplace</Typography>
                    </ListItemContent>
                    {renderCountChip(
                      sumCount(marketplaceGroups.flatMap((g) => g.rooms)),
                    )}
                    <ArrowIcon open={open} />
                  </ListItemButton>
                )}
              >
                <List sx={{ gap: 0.5 }}>
                  {marketplaceGroups.map((group) => (
                    <ListItem nested key={group.key}>
                      <Toggler
                        defaultExpanded={group.rooms.some(
                          (r) => r.roomId === currentRoomId,
                        )}
                        renderToggle={({ open, setOpen }) => (
                          <ListItemButton
                            onClick={() => setOpen(!open)}
                            sx={{ pl: 3 }}
                          >
                            <img
                              src={group.logo}
                              alt={group.label}
                              width={18}
                              height={18}
                              style={{ filter: "brightness(0) invert(1)" }} // โลโก้สีขาว
                            />
                            <ListItemContent>
                              <Typography level="title-sm" fontWeight="lg">
                                {group.label}
                              </Typography>
                            </ListItemContent>
                            {renderCountChip(sumCount(group.rooms))}
                            <ArrowIcon open={open} />
                          </ListItemButton>
                        )}
                      >
                        <List sx={{ gap: 0.5 }}>
                          {group.rooms.map((chatRoom) =>
                            // ขนาดฟอนต์ชื่อห้องใน Marketplace
                            renderRoom(chatRoom, { pl: 5 }, { fontSize: 12 }),
                          )}
                        </List>
                      </Toggler>
                    </ListItem>
                  ))}
                </List>
              </Toggler>
            </ListItem>
          )}
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
        </List>
        {/* {user.role === 'admin' && <SidebarAdmin pathname={pathname} user={user} />} */}
        {hasAnyAdminMenu(user) && (
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
