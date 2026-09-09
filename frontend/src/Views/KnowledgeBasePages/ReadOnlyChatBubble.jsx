import { Stack, Box, Typography, Avatar, Sheet, Chip } from "@mui/joy";
import { InsertDriveFile, PlayCircle, VolumeUp, MyLocation } from '@mui/icons-material';
import { MessageStyle } from "../../styles/MessageStyle.js";
import ChatBubbleProduct from "../ChatPages/MessagePane/ChatBubbleProduct.jsx";
import ChatBubbleItemList from "../ChatPages/MessagePane/ChatBubbleItemList.jsx";
import { forceHttps } from "../../utils.js";

/**
 * บับเบิลข้อความแบบ read-only สำหรับจำลองหน้าแชท ตัดฟีเจอร์ที่ใช้เฉพาะตอนคุยสด
 * (pusher read receipt, retry media, context menu ตอบกลับ, ปุ่ม Generate AI ต่อข้อความ) ออก
 * แต่ยังใช้ MessageStyle token เดียวกับ ChatBubble.jsx จริง เพื่อให้หน้าตาเหมือนกัน
 *
 * highlighted = ข้อความนี้คือ "จุดต้นทาง" ที่พนักงานกด "เพิ่มเข้า KB" (เทียบจาก ai_kb_entries.message_ref)
 * inSession = ข้อความนี้อยู่ใน "ช่วง/session" เดียวกับตอนที่เพิ่มเข้า KB (ai_kb_entries.active_conversation_id)
 * — กว้างกว่า highlighted อีกชั้น (highlighted คือข้อความเดียว, inSession คือทั้งช่วงบทสนทนา)
 */
export default function ReadOnlyChatBubble({ message, highlighted = false, inSession = false, bubbleId }) {
    const { sender = {}, contentType, content, created_at, role } = message;
    // isSent ตรงกับ logic ของหน้าแชทจริง (isYou = !!sender.empCode) — agent และ bot ถือเป็นฝั่ง "ส่ง"
    const isSent = role !== 'customer';

    const senderLabel = role === 'customer'
        ? (sender.custName || sender.name || 'ลูกค้า')
        : (sender.name || '') + (sender.real_name ? ` (${sender.real_name})` : '') || (role === 'bot' ? 'BOT' : '-');

    const createdAtText = (() => {
        try { return new Date(created_at).toLocaleString('th-TH'); } catch { return String(created_at ?? ''); }
    })();

    return (
        <Stack
            id={bubbleId} direction="row" spacing={2}
            sx={{
                flexDirection: isSent ? 'row-reverse' : 'row',
                ...(inSession ? { bgcolor: 'primary.softBg', borderRadius: 'md', py: 0.75, mx: -1, px: 1 } : {}),
            }}
        >
            <Avatar src={role === 'customer' ? forceHttps(sender.avatar) : undefined} />
            <Box sx={{ maxWidth: '60%', minWidth: 'auto' }}>
                <Stack direction="row" spacing={2} sx={MessageStyle.Bubble.Main} alignItems="center">
                    <Typography level="body-xs">{senderLabel}</Typography>
                    <Typography level="body-xs">{createdAtText}</Typography>
                    {highlighted && (
                        <Chip size="sm" color="primary" variant="soft" startDecorator={<MyLocation sx={{ fontSize: 12 }} />}>
                            จุดเริ่มต้นของ KB นี้
                        </Chip>
                    )}
                </Stack>

                <Sheet sx={[
                    isSent ? MessageStyle.Bubble.IsSent : MessageStyle.Bubble.IsNotSent,
                    highlighted ? { outline: '2px solid', outlineColor: 'primary.500', outlineOffset: '2px' } : {},
                ]}>
                    {(contentType === 'sticker' || contentType === 'image') ? (
                        <Sheet
                            variant="outlined"
                            onClick={() => window.open(forceHttps(content), '_blank', 'noopener,noreferrer')}
                            sx={{
                                ...(isSent ? MessageStyle.Bubble.ImageIsSent : MessageStyle.Bubble.ImageIsNotSent),
                                cursor: 'pointer',
                            }}
                        >
                            <img src={forceHttps(content)} alt="" width={165} loading="lazy" />
                        </Sheet>
                    ) : (contentType === 'file' || contentType === 'video' || contentType === 'audio') ? (
                        <Sheet
                            variant="outlined"
                            sx={[
                                { px: 1.75, py: 1.25, borderRadius: 'lg' },
                                isSent ? { borderTopRightRadius: 0, borderTopLeftRadius: 'lg' } : { borderTopRightRadius: 'lg', borderTopLeftRadius: 0 },
                            ]}
                        >
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar color="primary" size="lg">
                                    {contentType === 'file' ? <InsertDriveFile /> : contentType === 'video' ? <PlayCircle /> : <VolumeUp />}
                                </Avatar>
                                <Typography
                                    level="body-sm" component="a" href={forceHttps(content)}
                                    target="_blank" rel="noopener noreferrer"
                                >
                                    เปิดไฟล์แนบ
                                </Typography>
                            </Stack>
                        </Sheet>
                    ) : contentType === 'product' ? (
                        <ChatBubbleProduct content={content} />
                    ) : contentType === 'item_list' ? (
                        <Box sx={{ p: 0.5 }}>
                            <ChatBubbleItemList content={content} />
                        </Box>
                    ) : (
                        <Typography
                            component="pre" level="body-sm"
                            sx={{
                                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                ...(isSent ? MessageStyle.Bubble.TextIsSent : MessageStyle.Bubble.TextIsNotSent),
                            }}
                        >
                            {String(content ?? '')}
                        </Typography>
                    )}
                </Sheet>
            </Box>
        </Stack>
    );
}
