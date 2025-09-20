import Stack from "@mui/joy/Stack";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { Avatar, Button, Sheet } from "@mui/joy";
import { MessageStyle } from "../../../styles/MessageStyle.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { InsertDriveFile, PlayCircle, VolumeUp } from '@mui/icons-material';
import Divider from "@mui/joy/Divider";
import ContextMenuButton from "./ContextMenuButton.jsx";
import ImageIcon from '@mui/icons-material/Image';
import ChatMediaPreview from "./ChatMediaPreview.jsx";
import { useState } from "react";
import { Link } from "react-router-dom";
import ChatBubbleProduct from "./ChatBubbleProduct.jsx";
import ChatBubbleItemList from "./ChatBubbleItemList.jsx"; 

export default function Bubble(props) {
    const { user } = useAuth();
    const {
        sender,
        variant,
        content,
        created_at,
        contentType,
        line_message_id,
        line_quote_token,
        line_quoted_message_id,
        messages,
        meta, 
    } = props;

    const isSent = variant === 'sent';
    const [open, setOpen] = useState(false);
    const [previewSelect, setPreviewSelect] = useState('');

    const createdAtText = (() => {
        try {
            return new Date(created_at).toLocaleString();
        } catch {
            return String(created_at ?? "");
        }
    })();

    // ✅ ตรวจว่าเป็น item_list จากสองกรณี
    const isItemList =
        contentType === 'item_list' ||
        (meta?.message_type === 'item_list');

    // ✅ เตรียม content สำหรับ ChatBubbleItemList
    // - ถ้า contentType === 'item_list' คาดว่า content เป็น JSON string {"items":[...]}
    // - ถ้ายังไม่แก้ backend: ใช้ meta.raw_content.chat_product_infos (raw จาก webhook)
    const itemListPayload = (() => {
        if (contentType === 'item_list') {
            return content; // ส่งให้คอมโพเนนต์ไป parse เอง (รองรับ JSON string)
        }
        if (meta?.message_type === 'item_list' && meta?.raw_content) {
            return meta.raw_content; // raw payload ที่มี chat_product_infos
        }
        return null;
    })();

    return (
        <Box sx={{ maxWidth: '60%', minWidth: 'auto' }}>
            {open && <ChatMediaPreview open={open} setOpen={setOpen} url={previewSelect} />}

            {/* Header: ชื่อ + เวลา */}
            <Stack
                direction="row"
                spacing={2}
                sx={MessageStyle.Bubble.Main}
                onClick={() => {
                    // debug id/tokens หากต้องการ
                    // console.log(line_message_id, line_quote_token, line_quoted_message_id);
                }}
            >
                <Typography level="body-xs">
                    {isSent ? sender?.name : (sender?.custName ? sender.custName : sender?.name)}
                </Typography>
                <Typography level="body-xs">{createdAtText}</Typography>
            </Stack>

            <Box
                sx={{
                    position: 'relative',
                    "&:hover .action-buttons": {
                        opacity: 1
                    }
                }}
            >
                {/* เมนู hover ต้องการ ตอบกลับ */}
                {line_message_id && (
                    <ContextMenuButton onReply={(value) => alert(value)} {...{ ...props }} />
                )}

                <Sheet
                    sx={
                        isSent
                            ? (sender?.empCode === user?.empCode
                                ? MessageStyle.Bubble.IsMySent
                                : MessageStyle.Bubble.IsSent)
                            : MessageStyle.Bubble.IsNotSent
                    }
                >
                    {/* ส่วนแสดงข้อความที่อ้างอิง (quote) */}
                    {line_quoted_message_id ? (
                        <div>
                            {messages?.find?.((item) => item.line_message_id === line_quoted_message_id) && (
                                <Box>
                                    {(() => {
                                        const quotedMessage = messages.find(
                                            (item) => item.line_message_id === line_quoted_message_id
                                        );
                                        return quotedMessage ? (
                                            <Stack direction='column' mb={2}>
                                                {!isSent ? (
                                                    <>
                                                        <Typography level='body-sm'>
                                                            {quotedMessage.content}
                                                        </Typography>
                                                        <Divider />
                                                    </>
                                                ) : (
                                                    <>
                                                        <Typography level='body-sm' sx={{ color: 'white' }}>
                                                            {quotedMessage.content}
                                                        </Typography>
                                                        <Divider sx={{ bgcolor: 'white' }} />
                                                    </>
                                                )}
                                            </Stack>
                                        ) : null;
                                    })()}
                                </Box>
                            )}
                        </div>
                    ) : null}

                    {/* เนื้อหาหลักของบับเบิล */}
                    {contentType === 'sticker' ? (
                        <Sheet
                            variant="outlined"
                            sx={isSent ? MessageStyle.Bubble.ImageIsSent : MessageStyle.Bubble.ImageIsNotSent}
                        >
                            <img src={content} alt="" width={165} />
                        </Sheet>
                    ) : contentType === 'image' ? (
                        <Sheet
                            onClick={() => {
                                setPreviewSelect(content);
                                setOpen(true);
                            }}
                            variant="outlined"
                            sx={isSent ? MessageStyle.Bubble.ImageIsSent : MessageStyle.Bubble.ImageIsNotSent}
                        >
                            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                                <img loading="lazy" src={content} width={165} alt={content} />
                            </Stack>
                        </Sheet>
                    ) : (contentType === 'file' || contentType === 'video' || contentType === 'audio') ? (
                        <Sheet
                            variant="outlined"
                            sx={[
                                { px: 1.75, py: 1.25, borderRadius: 'lg' },
                                isSent ? { borderTopRightRadius: 0 } : { borderTopRightRadius: 'lg' },
                                isSent ? { borderTopLeftRadius: 'lg' } : { borderTopLeftRadius: 0 },
                            ]}
                        >
                            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                                <Avatar color="primary" size="lg">
                                    {contentType === 'file'
                                        ? <InsertDriveFile />
                                        : contentType === 'video'
                                            ? <PlayCircle />
                                            : contentType === 'image'
                                                ? <ImageIcon />
                                                : <VolumeUp />}
                                </Avatar>
                                <Stack direction='column' spacing={2} width='100%'>
                                    <Typography sx={{ fontSize: 'sm' }}>
                                        {contentType === 'file'
                                            ? 'ไฟล์ PDF'
                                            : contentType === 'video'
                                                ? 'ไฟล์ Video'
                                                : contentType === 'image'
                                                    ? 'ไฟล์รูปภาพ'
                                                    : 'ไฟล์เสียง'}
                                    </Typography>
                                    <Button
                                        fullWidth
                                        size="sm"
                                        variant="outlined"
                                        onClick={() => {
                                            setPreviewSelect(content);
                                            setOpen(true);
                                        }}
                                    >
                                        ดู preview
                                    </Button>
                                </Stack>
                            </Stack>
                        </Sheet>
                    ) : contentType === 'product' ? (
                        <ChatBubbleProduct content={content} />
                    ) : isItemList ? (
                        <Box sx={{ p: 0.5 }}>
                            <ChatBubbleItemList content={itemListPayload} />
                        </Box>
                    ) : (
                        <Typography
                            component="pre"
                            level="body-sm"
                            sx={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                ...(isSent
                                    ? (sender?.empCode === user?.empCode
                                        ? MessageStyle.Bubble.TextMySent
                                        : MessageStyle.Bubble.TextIsSent)
                                    : MessageStyle.Bubble.TextIsNotSent)
                            }}
                        >
                            {String(content ?? "")}
                        </Typography>
                    )}
                </Sheet>
            </Box>
        </Box>
    );
}
