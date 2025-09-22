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
  LabelOutlined,
  SubdirectoryArrowRight,
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

export const SidebarAdmin = ({ pathname, user, searchQuery }) => {
  // util สำหรับ filter ข้อความ
  const matchSearch = (label) =>
    label.toLowerCase().includes(searchQuery.toLowerCase());

  return (
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
        {matchSearch("จัดการคีย์เวิร์ด") && (
          <ListItem component={Link} to="/keywords">
            <ListItemButton selected={pathname === "/keywords"}>
              <Keyboard />
              <Typography level="title-sm">จัดการคีย์เวิร์ด</Typography>
            </ListItemButton>
          </ListItem>
        )}

        {matchSearch("จัดการเมนูของบอท") && (
          <ListItem component={Link} to="/botManage">
            <ListItemButton selected={pathname === "/botManage"}>
              <SmartToy />
              <Typography level="title-sm">จัดการเมนูของบอท</Typography>
            </ListItemButton>
          </ListItem>
        )}

        {matchSearch("จัดการห้องแชท") && (
          <ListItem component={Link} to="/chatRooms">
            <ListItemButton selected={pathname === "/chatRooms"}>
              <MeetingRoom />
              <Typography level="title-sm">จัดการห้องแชท</Typography>
            </ListItemButton>
          </ListItem>
        )}

        {matchSearch("จัดการข้อความส่งด่วน") && (
          <ListItem component={Link} to="/shortChats">
            <ListItemButton selected={pathname === "/shortChats"}>
              <ManageAccounts />
              <Typography level="title-sm">จัดการข้อความส่งด่วน</Typography>
            </ListItemButton>
          </ListItem>
        )}

        {matchSearch("จัดการลูกค้า") && (
          <ListItem component={Link} to="/customers">
            <ListItemButton selected={pathname === "/customers"}>
              <PeopleAlt />
              <Typography level="title-sm">จัดการลูกค้า</Typography>
            </ListItemButton>
          </ListItem>
        )}

        {matchSearch("จัดการผู้ใช้") && (
          <ListItem component={Link} to="/users">
            <ListItemButton selected={pathname === "/users"}>
              <ManageAccounts />
              <Typography level="title-sm">จัดการผู้ใช้</Typography>
            </ListItemButton>
          </ListItem>
        )}

        {matchSearch("จัดการ help Chat") && (
          <ListItem component={Link} to="/helpChat">
            <ListItemButton selected={pathname === "/helpChat"}>
              <LiveHelp />
              <Typography level="title-sm">จัดการ help Chat</Typography>
            </ListItemButton>
          </ListItem>
        )}

        {matchSearch("จัดการ Sticker") && (
          <ListItem component={Link} to="/sticker">
            <ListItemButton selected={pathname === "/sticker"}>
              <EmojiEmotions />
              <Typography level="title-sm">จัดการ Sticker</Typography>
            </ListItemButton>
          </ListItem>
        )}

        {/* Tag Group */}
        {(matchSearch("จัดการ Tag") || matchSearch("tags")) && (
          <ListItem nested>
            <Toggler
              defaultExpanded={
                pathname === "/tags" ||
                pathname === "/tags/groups" ||
                pathname === "/tags-by-platforms"
              }
              renderToggle={({ open, setOpen }) => (
                <ListItemButton onClick={() => setOpen(!open)}>
                  <LocalOffer />
                  <ListItemContent>
                    <Typography level="title-sm">
                      จัดการ Tag จบสนทนา
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
                  <ListItemButton selected={pathname === "/tags"} sx={{ pl: 5 }}>
                    <LabelOutlined fontSize="small" sx={{ mr: 0 }} />
                    <Typography level="body-sm">จัดการ Tag Menu</Typography>
                  </ListItemButton>
                </ListItem>

                <ListItem component={Link} to="/tags/groups">
                  <ListItemButton
                    selected={pathname === "/tags/groups"}
                    sx={{ pl: 5 }}
                  >
                    <SubdirectoryArrowRight fontSize="small" sx={{ mr: 0 }} />
                    <Typography level="body-sm">จัดการ Tag Group</Typography>
                  </ListItemButton>
                </ListItem>

                <ListItem component={Link} to="/tags-by-platforms">
                  <ListItemButton
                    selected={pathname === "/tags-by-platforms"}
                    sx={{ pl: 5 }}
                  >
                    <SubdirectoryArrowRight fontSize="small" sx={{ mr: 0 }} />
                    <Typography level="body-sm">
                      จัดการ Tags By Platforms
                    </Typography>
                  </ListItemButton>
                </ListItem>
              </List>
            </Toggler>
          </ListItem>
        )}

        {matchSearch("หน้ารายงาน") && (
          <ListItem component={Link} to="/report">
            <ListItemButton selected={pathname === "/report"}>
              <SmartToy />
              <Typography level="title-sm">หน้ารายงาน</Typography>
            </ListItemButton>
          </ListItem>
        )}

        {/* AdminIT */}
        {user.empCode === "adminIT" && matchSearch("จัดการ token") && (
          <ListItem>
            <ListItemButton
              component={Link}
              to="/accessToken"
              selected={pathname === "/accessToken"}
            >
              <Token />
              <Typography level="title-sm">จัดการ token</Typography>
            </ListItemButton>
          </ListItem>
        )}

        {user.empCode === "adminIT" && matchSearch("Auto Access Token") && (
          <ListItem>
            <ListItemButton
              component={Link}
              to="/TokenManager"
              selected={pathname === "/TokenManager"}
            >
              <Token />
              <Typography level="title-sm">Auto Access Token</Typography>
            </ListItemButton>
          </ListItem>
        )}

        {user.empCode === "adminIT" && matchSearch("แจ้งเตือน") && (
          <ListItem component={Link} to="/announces">
            <ListItemButton selected={pathname === "/announces"}>
              <CircleNotifications />
              <Typography level="title-sm">แจ้งเตือน</Typography>
            </ListItemButton>
          </ListItem>
        )}
      </List>
    </>
  );
};
