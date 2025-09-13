import React, { useState } from "react";
import { Input, IconButton } from "@mui/joy";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

export default function ChatMsgNew({ onSend }) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    if (!value.trim()) return;
    onSend(value);
    setValue("");
  };

  return (
    <Input
      placeholder="พิมพ์ข้อความ..."
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && handleSend()}
      endDecorator={
        <IconButton color="primary" variant="solid" onClick={handleSend}>
          <SendRoundedIcon />
        </IconButton>
      }
      sx={{ borderRadius: "full" }}
    />
  );
}