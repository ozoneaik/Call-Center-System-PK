import React, { useState } from "react";
import { Box, Typography, Sheet, List, ListItemButton, Avatar, Stack, Divider } from "@mui/joy";
import ChatMsgNew from "./ChatMsgNew";
import ChatBubbleNew from "./ChatBubbleNew";

export default function ChatPageNew() {
    const [messages, setMessages] = useState([
        { id: 1, text: "สวัสดีครับ 👋", sender: "customer", time: "10:20" },
        { id: 2, text: "สวัสดีครับ ต้องการความช่วยเหลือเรื่องอะไรครับ?", sender: "agent", time: "10:21" }
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
                <Typography level="h5" mb={2}>
                    ห้องแชท
                </Typography>

                {/* List 1 */}
                <List sx={{ gap: 1, flex: 1, overflowY: "auto" }}>
                    {[1, 2, 3].map((item, index) => (
                        <ListItemButton key={index} sx={{ borderRadius: 8 }} selected={index === 0}>
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

                <Divider sx={{ my: 1 }} />

                {/* List 2 */}
                <List sx={{ gap: 1, flex: 1, overflowY: "auto" }}>
                    {[1, 2, 3, 5, 6, 7, 5, 4, 3, 2, 1].map((item, index) => (
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
            <Sheet variant="plain" sx={{ display: "flex", flexDirection: "column", bgcolor: "background.surface" }}>
                {/* Chat header */}
                <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Typography level="title-md">ลูกค้า A</Typography>
                </Box>

                {/* Chat messages */}
                <Box sx={{ flex: 1, overflowY: "auto", p: 2, bgcolor: "neutral.50" }}>
                    {messages.map((msg) => (
                        <ChatBubbleNew key={msg.id} text={msg.text} sender={msg.sender} time={msg.time} />
                    ))}
                </Box>

                {/* Message input */}
                <Box sx={{ borderTop: "1px solid", borderColor: "divider", p: 2 }}>
                    <ChatMsgNew onSend={handleSend} />
                </Box>
            </Sheet>
        </Sheet>
    );
}