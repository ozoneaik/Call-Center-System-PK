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
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ChatBubbleProduct from "./ChatBubbleProduct.jsx";
import ChatBubbleItemList from "./ChatBubbleItemList.jsx"; 
import StorefrontIcon from '@mui/icons-material/Storefront';

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
        isShopeeRoom,
    } = props;

    const isSent = variant === 'sent';
    const [open, setOpen] = useState(false);
    const [previewSelect, setPreviewSelect] = useState('');
    const [isRead, setIsRead] = useState(!!props.read_at);

    useEffect(() => {
        const channel = window.pusherChannel;

        const handler = (data) => {
            if (line_message_id && line_message_id <= data.last_read_message_id) {
                setIsRead(true);
            }
        };

        channel?.bind('message-read', handler);
        return () => channel?.unbind('message-read', handler);
    }, [line_message_id]);

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
                    ) : contentType === 'item' ? (
                        <Sheet
                            variant="soft"
                            sx={[
                                { px: 2, py: 1.5, borderRadius: 'lg', maxWidth: '300px' },
                                isSent ? { borderTopRightRadius: 0 } : { borderTopRightRadius: 'lg' },
                                isSent ? { borderTopLeftRadius: 'lg' } : { borderTopLeftRadius: 0 },
                                { bgcolor: '#fff0e5', border: '1px solid #ff7337' } // ธีมสีส้ม Shopee
                            ]}
                        >
                            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                <Avatar sx={{ bgcolor: '#ff7337', color: 'white', mt: 0.5 }} size="sm">
                                    <StorefrontIcon fontSize="small" />
                                </Avatar>
                                <Stack direction="column" sx={{ minWidth: 0, width: '100%' }}>
                                    <Typography level="body-xs" fontWeight="bold" sx={{ color: '#ff7337', mb: 0.5 }}>
                                        ส่งการ์ดสินค้าแล้ว
                                    </Typography>

                                    {/* 💡 แยกชื่อสินค้า และ รหัสสินค้า ให้แสดงผลชัดเจน 💡 */}
                                    {(() => {
                                        try {
                                            const parsed = JSON.parse(content);
                                            const id = parsed.item_id || parsed.id || '';
                                            const name = parsed.name || '';
                                            const image = parsed.image || null;

                                            return (
                                                <Box>
                                                    {/* 👇 แสดงรูปสินค้า ถ้ามี */}
                                                    {image && (
                                                        <Box
                                                            sx={{
                                                                mb: 1,
                                                                borderRadius: 'sm',
                                                                overflow: 'hidden',
                                                                width: '100%',
                                                                maxHeight: 160,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                bgcolor: '#fff',
                                                            }}
                                                        >
                                                            <img
                                                                src={image}
                                                                alt={name}
                                                                loading="lazy"
                                                                style={{
                                                                    width: '100%',
                                                                    maxHeight: 160,
                                                                    objectFit: 'contain',
                                                                }}
                                                            />
                                                        </Box>
                                                    )}

                                                    {name && (
                                                        <Typography
                                                            level="title-sm"
                                                            sx={{
                                                                color: '#ee4d2d',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                                mb: 0.5,
                                                                lineHeight: 1.4
                                                            }}
                                                            title={name} // เอาเมาส์ชี้เพื่อดูชื่อเต็ม
                                                        >
                                                            {name}
                                                        </Typography>
                                                    )}
                                                    {/* ทำรหัสสินค้าเป็น Badge กรอบสีส้มอ่อน */}
                                                    <Typography
                                                        level="body-xs"
                                                        sx={{
                                                            color: '#d03b11',
                                                            bgcolor: '#ffe4d6',
                                                            px: 1,
                                                            py: 0.5,
                                                            borderRadius: 'sm',
                                                            display: 'inline-block'
                                                        }}
                                                    >
                                                        รหัส: {id || content}
                                                    </Typography>
                                                </Box>
                                            );
                                        } catch {
                                            // กรณีแอดมินพิมพ์แค่รหัสตัวเลขลงไปตรงๆ (ไม่มีชื่อสินค้า)
                                            return (
                                                <Typography
                                                    level="body-xs"
                                                    sx={{
                                                        color: '#d03b11',
                                                        bgcolor: '#ffe4d6',
                                                        px: 1,
                                                        py: 0.5,
                                                        borderRadius: 'sm',
                                                        display: 'inline-block'
                                                    }}
                                                >
                                                    รหัส: {content}
                                                </Typography>
                                            );
                                        }
                                    })()}
                                </Stack>
                            </Stack>
                        </Sheet>
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
                {isSent && isShopeeRoom && (
                    <Typography
                        level="body-xs"
                        sx={{ textAlign: 'right', mt: 0.5, color: isRead ? '#1976d2' : 'neutral.400' }}
                    >
                        {isRead ? '✓✓ อ่านแล้ว' : '✓ ส่งแล้ว'}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
