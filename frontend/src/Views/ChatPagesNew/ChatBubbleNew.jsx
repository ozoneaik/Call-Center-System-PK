import React from "react";
import { Box, Typography, Sheet } from "@mui/joy";
export default function ChatBubbleNew({ text, sender, time }) {
    const isAgent = sender === "agent";
  return (
    <Box sx={{ display: "flex", justifyContent: isAgent ? "flex-end" : "flex-start", mb: 1 }}>
      <Sheet
        variant={isAgent ? "solid" : "soft"}
        color={isAgent ? "primary" : "neutral"}
        sx={{ maxWidth: "70%", borderRadius: "lg", px: 2, py: 1 }}
      >
        <Typography level="body-sm">{text}</Typography>
        <Typography level="body-xs" textAlign="right" sx={{ opacity: 0.6, mt: 0.5 }}>{time}</Typography>
      </Sheet>
    </Box>
  );
}