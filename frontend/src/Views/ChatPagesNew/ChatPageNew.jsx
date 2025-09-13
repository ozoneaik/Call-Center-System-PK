import React, { useState } from "react";
import { Box, Typography, Sheet, List, ListItemButton, Avatar, Stack, Divider } from "@mui/joy";
import ChatMsgNew from "./ChatMsgNew";
import ChatBubbleNew from "./ChatBubbleNew";

export default function ChatPageNew({
    setFilterPending,
    filterPending,
    disable,
    pending,
    roomId,
    roomName,
    progress,
    filterProgress,
    setFilterProgress,
    showMyCasesOnly,
    setShowMyCasesOnly
}) {
    const [messages, setMessages] = useState([
        { id: 1, text: "สวัสดีครับ 👋", sender: "customer", time: "10:20" },
        { id: 2, text: "สวัสดีครับ ต้องการความช่วยเหลือเรื่องอะไรครับ?", sender: "agent", time: "10:21" },
        { id: 1, text: "สวัสดีครับ 👋", sender: "customer", time: "10:20" },
        { id: 1, text: "สวัสดีครับ 👋", sender: "customer", time: "10:20" },
        { id: 3, text: "สวัสดีครับ ต้องการความช่วยเหลือเรื่องอะไรครับ?", sender: "agent", time: "10:21" },
        { id: 4, text: "สวัสดีครับ ต้องการความช่วยเหลือเรื่องอะไรครับ?", sender: "agent", time: "10:21" },
        { id: 1, text: "สวัสดีครับ 👋", sender: "customer", time: "10:20" },
        { id: 1, text: "สวัสดีครับ 👋", sender: "customer", time: "10:20" },
        { id: 1, text: "สวัสดีครับ 👋", sender: "customer", time: "10:20" },
        { id: 1, text: "สวัสดีครับ 👋", sender: "customer", time: "10:20" },
        { id: 1, text: "สวัสดีครับ 👋", sender: "customer", time: "10:20" },
        { id: 1, text: "สวัสดีครับ 👋", sender: "customer", time: "10:20" },
        { id: 1, text: "สวัสดีครับ 👋", sender: "customer", time: "10:20" },
        { id: 1, text: "สวัสดีครับ 👋", sender: "customer", time: "10:20" },
        { id: 1, text: "สวัสดีครับ 👋", sender: "customer", time: "10:20" },
        { id: 1, text: "สวัสดีครับ 👋", sender: "customer", time: "10:20" },
        { id: 1, text: "สวัสดีครับ 👋", sender: "customer", time: "10:20" },
        { id: 1, text: "สวัสดีครับ 👋", sender: "customer", time: "10:20" },
        { id: 1, text: "สวัสดีครับ 👋", sender: "customer", time: "10:20" },
        { id: 1, text: "สวัสดีครับ 👋", sender: "customer", time: "10:20" },
        { id: 1, text: "สวัสดีครับ 👋", sender: "customer", time: "10:20" },
        { id: 1, text: "สวัสดีครับ 👋", sender: "customer", time: "10:20" },
    ]);

    const handleSend = (text) => {
        if (!text.trim()) return;
        setMessages((prev) => [
            ...prev,
            { id: Date.now(), text, sender: "agent", time: new Date().toLocaleTimeString() }
        ]);
    };

    return (
        <Sheet
            variant="plain"
            sx={{
                height: "100vh",
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "400px 1fr" },
                bgcolor: "neutral.100"
            }}
        >
            {/* Sidebar */}
            <Sheet
                variant="outlined"
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    p: 2,
                    borderRight: "1px solid",
                    borderColor: "divider",
                    overflow: "hidden"
                }}
            >
                {/* List 1 */}
                <Typography>กำลังดำเนินการ</Typography>
                <List sx={SidebarStyle}>
                    {progress.map((item, index) => (
                        <ListItemButton key={index} sx={{ borderRadius: 8 }} selected={index === 0}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Avatar src={item.avatar}/>
                                <Stack spacing={1}>
                                    <Typography level="body-sm">{item.custName}</Typography>
                                    <Typography level="body-xs" sx={{ opacity: 0.6 }}>
                                        {item.description}
                                    </Typography>
                                </Stack>
                            </Box>
                        </ListItemButton>
                    ))}
                </List>

                <Divider sx={{ my: 1 }} />

                {/* List 2 */}
                <Typography>รอดำเนินการ</Typography>
                <List sx={SidebarStyle}>
                    {pending.map((item, index) => (
                        <ListItemButton key={index} sx={{ borderRadius: 8 }}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Avatar />
                                <Stack spacing={1}>
                                    <Typography level="body-sm">ลูกค้า A{index + 1}</Typography>
                                    <Typography level="body-xs" sx={{ opacity: 0.6 }}>
                                        ติดต่อมาจาก cal-center
                                    </Typography>
                                </Stack>
                            </Box>
                        </ListItemButton>
                    ))}
                </List>
            </Sheet>

            {/* Chat Area */}
            <Sheet variant="plain" sx={{ display: "flex", flexDirection: "column" }}>
                {/* Chat header */}
                <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Typography level="title-md">ลูกค้า A</Typography>
                </Box>

                {/* Chat messages */}
                <Box sx={{ flex: 1, maxHeight: "calc(100vh - 130px)", overflowY: "auto", p: 2 }}>
                    {messages.map((msg) => (
                        <ChatBubbleNew key={msg.id} text={msg.text} sender={msg.sender} time={msg.time} />
                    ))}
                </Box>

                {/* Message input */}
                <Box sx={{borderTop: "1px solid", borderColor: "divider", p: 2 }}>
                    <ChatMsgNew onSend={handleSend} />
                </Box>
            </Sheet>
        </Sheet>
    );
}

const SidebarStyle = {
    gap: 1, flex: 1, overflowY: "auto", '&::-webkit-scrollbar': {
        width: '0px',
    },
    '&:hover::-webkit-scrollbar': {
        width: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
        backgroundColor: '#555',
        borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
        backgroundColor: '#ff7922',
    },
    '&::-webkit-scrollbar-track': {
        background: 'none',
    }
}