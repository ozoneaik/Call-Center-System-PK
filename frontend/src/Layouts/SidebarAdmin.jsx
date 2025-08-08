import { useState } from "react";
import {
  Typography,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
  Box,
} from "@mui/joy";
import {
  Keyboard,
  SmartToy,
  MeetingRoom,
  ManageAccounts,
  PeopleAlt,
  LiveHelp,
  EmojiEmotions,
  LocalOffer,
  Token,
  CircleNotifications,
  AdminPanelSettings,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import { LayoutStyle } from "../styles/LayoutStyle.js";

function Toggler({ defaultExpanded = false, renderToggle, children }) {
  const [open, setOpen] = useState(defaultExpanded);
  return (
    <>
      {renderToggle({ open, setOpen })}
      <Box
        sx={[
          {
            display: "grid",
            transition: "0.2s ease",
            "& > *": {
              overflow: "hidden",
            },
          },
          open ? { gridTemplateRows: "1fr" } : { gridTemplateRows: "0fr" },
        ]}
      >
        {children}
      </Box>
    </>
  );
}

export const SidebarAdmin = ({ pathname, user }) => (
  <>
    <Typography
      startDecorator={<AdminPanelSettings />}
      mt={2}
      mb={1}
      level="body-sm"
    >
      สำหรับผู้ดูแลระบบ
    </Typography>
    <Divider />
    <List size="sm" sx={LayoutStyle.Sidebar.ListButton}>
      {/* เมนูทั่วไป */}
      <ListItem component={Link} to="/keywords">
        <ListItemButton selected={pathname === "/keywords"}>
          <Keyboard />
          <Typography level="title-sm">จัดการคีย์เวิร์ด</Typography>
        </ListItemButton>
      </ListItem>

      <ListItem component={Link} to="/botManage">
        <ListItemButton selected={pathname === "/botManage"}>
          <SmartToy />
          <Typography level="title-sm">จัดการเมนูของบอท</Typography>
        </ListItemButton>
      </ListItem>

      <ListItem component={Link} to="/chatRooms">
        <ListItemButton selected={pathname === "/chatRooms"}>
          <MeetingRoom />
          <Typography level="title-sm">จัดการห้องแชท</Typography>
        </ListItemButton>
      </ListItem>

      <ListItem component={Link} to="/shortChats">
        <ListItemButton selected={pathname === "/shortChats"}>
          <ManageAccounts />
          <Typography level="title-sm">จัดการข้อความส่งด่วน</Typography>
        </ListItemButton>
      </ListItem>

      <ListItem component={Link} to="/customers">
        <ListItemButton selected={pathname === "/customers"}>
          <PeopleAlt />
          <Typography level="title-sm">จัดการลูกค้า</Typography>
        </ListItemButton>
      </ListItem>

      <ListItem component={Link} to="/users">
        <ListItemButton selected={pathname === "/users"}>
          <ManageAccounts />
          <Typography level="title-sm">จัดการผู้ใช้</Typography>
        </ListItemButton>
      </ListItem>

      <ListItem component={Link} to="/helpChat">
        <ListItemButton selected={pathname === "/helpChat"}>
          <LiveHelp />
          <Typography level="title-sm">จัดการ help Chat</Typography>
        </ListItemButton>
      </ListItem>

      <ListItem component={Link} to="/sticker">
        <ListItemButton selected={pathname === "/sticker"}>
          <EmojiEmotions />
          <Typography level="title-sm">จัดการ Sticker</Typography>
        </ListItemButton>
      </ListItem>

      <ListItem nested>
        <Toggler
          defaultExpanded={
            pathname === "/tags" || pathname === "/tags/groups"
          }
          renderToggle={({ open, setOpen }) => (
            <ListItemButton onClick={() => setOpen(!open)}>
              <LocalOffer />
              <ListItemContent>
                <Typography level="title-sm">
                  จัดการ tag การจบสนทนา
                </Typography>
              </ListItemContent>
              <KeyboardArrowDownIcon
                sx={{
                  transform: open ? "rotate(180deg)" : "none",
                  transition: "0.2s",
                }}
              />
            </ListItemButton>
          )}
        >
          <List sx={{ gap: 0.5 }}>
            <ListItem component={Link} to="/tags">
              <ListItemButton selected={pathname === "/tags"}>
                <Typography level="body-sm">จัดการ Tag การสนทนา</Typography>
              </ListItemButton>
            </ListItem>
            <ListItem component={Link} to="/tags/groups">
              <ListItemButton selected={pathname === "/tags/groups"}>
                <Typography level="body-sm">
                  จัดการ Group การสนทนา
                </Typography>
              </ListItemButton>
            </ListItem>
          </List>
        </Toggler>
      </ListItem>

      {/* รายงาน */}
      <ListItem component={Link} to="/report">
        <ListItemButton selected={pathname === "/report"}>
          <SmartToy />
          <Typography level="title-sm">หน้ารายงาน</Typography>
        </ListItemButton>
      </ListItem>

      {/* AdminIT */}
      {user.empCode === "adminIT" && (
        <>
          <ListItem component={Link} to="/accessToken">
            <ListItemButton selected={pathname === "/accessToken"}>
              <Token />
              <Typography level="title-sm">จัดการ token</Typography>
            </ListItemButton>
          </ListItem>
          <ListItem component={Link} to="/announces">
            <ListItemButton selected={pathname === "/announces"}>
              <CircleNotifications />
              <Typography level="title-sm">แจ้งเตือน</Typography>
            </ListItemButton>
          </ListItem>
        </>
      )}
    </List>
  </>
);
