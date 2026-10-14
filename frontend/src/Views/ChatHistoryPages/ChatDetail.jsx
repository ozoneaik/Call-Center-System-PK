import { useEffect, useMemo, useRef, useState } from 'react';
import { Sheet, Typography, Box, Avatar, Button, Stack, Chip, IconButton } from '@mui/joy';
import CircularProgress from '@mui/joy/CircularProgress';
import { AddComment, ArrowBack, InsertDriveFile, SmartToy, ChatBubbleOutline, LocationOn } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../../Axios';
import CreateCase from './CreateCase';
import ChatMediaPreview from '../ChatPages/MessagePane/ChatMediaPreview.jsx';
import ChatBubbleProduct from '../ChatPages/MessagePane/ChatBubbleProduct.jsx';
import { forceHttps } from '../../utils.js';

const STATUS_CHIP = {
    pending: { color: 'warning', label: (room) => `รอรับเรื่อง · ${room ?? '-'}` },
    progress: { color: 'primary', label: (room) => `กำลังดำเนินการ · ${room ?? '-'}` },
    success: { color: 'success', label: () => 'ปิดเคสแล้ว' },
};

// ข้อความที่ส่งติดกันจากคนเดิมภายในช่วงนี้ จะรวมเป็นกลุ่มเดียว (ไม่แสดงชื่อ/รูปซ้ำ)
const GROUP_GAP_MS = 2 * 60 * 1000;

const parseSender = (raw) => {
    if (raw && typeof raw === 'object') return raw;
    try {
        return JSON.parse(raw) ?? {};
    } catch {
        return {};
    }
};

// customer = ลูกค้า (ซ้าย), bot = BOT (ขวา สีเทา), agent = พนักงาน (ขวา สีหลัก)
const senderRole = (sender) => {
    if (sender?.custId) return 'customer';
    if (sender?.empCode === 'BOT') return 'bot';
    return 'agent';
};

const senderName = (sender) =>
    sender?.custName
        ? sender.custName
        : `${sender?.name ?? 'ไม่ทราบชื่อ'}${sender?.real_name ? ` (${sender.real_name})` : ''}`;

const senderKey = (sender) => sender?.custId ?? sender?.empCode ?? sender?.name ?? '';

const dateLabel = (date) =>
    date.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const timeLabel = (date) => date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

export default function ChatDetail() {
    const [loading, setLoading] = useState(true);
    const [customer, setCustomer] = useState({});
    const [messages, setMessages] = useState([]);
    const [currentRate, setCurrentRate] = useState({});
    const [openCreateCase, setOpenCreateCase] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    const { custId } = useParams();
    const navigate = useNavigate();
    const bottomRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await axiosClient.post(`/chatHistory/${custId}`);
                setCustomer(data.data.customer ?? {});
                setMessages(data.data.chatHistory ?? []);
                setCurrentRate(data.data.current_rate ?? {});
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [custId]);

    // เปิดหน้ามาให้เห็นข้อความล่าสุดก่อน
    useEffect(() => {
        if (!loading) bottomRef.current?.scrollIntoView({ block: 'end' });
    }, [loading]);

    // เตรียมข้อมูลสำหรับแสดงผล: วันที่ใหม่ → ตัวคั่นวันที่, ข้อความติดกันจากคนเดิม → รวมกลุ่ม
    const rows = useMemo(() => {
        let prev = null;
        return messages.map((message) => {
            const sender = parseSender(message.sender);
            const date = new Date(message.created_at);
            const key = senderKey(sender);
            const newDay = !prev || prev.date.toDateString() !== date.toDateString();
            const grouped = !newDay && prev.key === key && date - prev.date < GROUP_GAP_MS;
            prev = { date, key };
            return { message, sender, role: senderRole(sender), date, newDay, grouped };
        });
    }, [messages]);

    const status = STATUS_CHIP[currentRate?.status];

    return (
        <>
            {openCreateCase && (
                <CreateCase open={openCreateCase} setOpen={setOpenCreateCase} custId={custId} tokenId={customer?.platformRef} />
            )}
            {previewUrl && <ChatMediaPreview open={!!previewUrl} setOpen={() => setPreviewUrl(null)} url={previewUrl} />}

            {/* มือถือ: เว้นที่ให้ Navbar ที่ fixed อยู่ด้านบน (เหมือนหน้า ChatHistory/MessagePane) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%', minWidth: 0, pt: { xs: 'var(--Header-height)', md: 0 }, bgcolor: 'background.level1' }}>
                {/* ส่วนหัว */}
                <Sheet sx={HeaderStyle}>
                    <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                        <IconButton onClick={() => navigate(-1)} variant="outlined" size="sm" color="neutral">
                            <ArrowBack />
                        </IconButton>
                        <Avatar src={customer?.avatar} sx={{ width: { xs: 36, sm: 48 }, height: { xs: 36, sm: 48 }, flexShrink: 0 }} />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ minWidth: 0 }}>
                                <Typography level="title-lg" noWrap sx={{ minWidth: 0, maxWidth: '100%', fontSize: { xs: 'md', sm: 'lg' } }}>
                                    {customer?.custName ?? '-'}
                                </Typography>
                                <Chip size="sm" variant="soft" color={status?.color ?? 'danger'} sx={{ maxWidth: '100%' }}>
                                    {status ? status.label(currentRate.roomName) : 'ไม่พบสถานะเคส'}
                                </Chip>
                            </Stack>
                            <Typography level="body-sm" sx={{ color: 'text.tertiary', fontSize: { xs: 'xs', sm: 'sm' } }} noWrap>
                                {customer?.description}
                                {messages.length > 0 && ` · ${messages.length.toLocaleString('th-TH')} ข้อความ`}
                            </Typography>
                        </Box>
                    </Stack>

                    {/* มือถือแสดงเป็นปุ่มไอคอน ประหยัดพื้นที่ส่วนหัว */}
                    <Button
                        size="sm"
                        color="success"
                        startDecorator={<AddComment />}
                        disabled={currentRate?.status !== 'success'}
                        onClick={() => setOpenCreateCase(true)}
                        title={currentRate?.status !== 'success' ? 'สร้างเคสใหม่ได้เมื่อเคสปัจจุบันถูกปิดแล้ว' : undefined}
                        sx={{ display: { xs: 'none', sm: 'inline-flex' }, flexShrink: 0 }}
                    >
                        สร้างเคสใหม่
                    </Button>
                    <IconButton
                        size="sm"
                        color="success"
                        variant="solid"
                        aria-label="สร้างเคสใหม่"
                        disabled={currentRate?.status !== 'success'}
                        onClick={() => setOpenCreateCase(true)}
                        sx={{ display: { xs: 'inline-flex', sm: 'none' }, flexShrink: 0 }}
                    >
                        <AddComment />
                    </IconButton>
                </Sheet>

                {/* ส่วนแสดงข้อความ */}
                <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', bgcolor: LINE.chatBg }}>
                    {loading ? (
                        <Box sx={CenterStyle}><CircularProgress sx={{ '--CircularProgress-progressColor': LINE.sent }} /></Box>
                    ) : rows.length === 0 ? (
                        <Box sx={CenterStyle}>
                            <ChatBubbleOutline sx={{ fontSize: 40, color: LINE.meta }} />
                            <Typography level="body-md" sx={{ color: LINE.meta }}>ยังไม่มีประวัติการสนทนา</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ maxWidth: 820, mx: 'auto', px: { xs: 1, sm: 3 }, pt: 2, pb: 'calc(16px + env(safe-area-inset-bottom))' }}>
                            {rows.map((row, index) => (
                                <Box key={row.message.id ?? index}>
                                    {row.newDay && <DateSeparator date={row.date} />}
                                    <MessageRow row={row} onPreview={setPreviewUrl} />
                                </Box>
                            ))}
                            <div ref={bottomRef} />
                        </Box>
                    )}
                </Box>
            </Box>
        </>
    );
}

// เลย์เอาต์แบบแอป LINE ในโทนส้ม Pumpkin — ใช้ค่าคงที่ (ไม่ตามธีม) ให้หน้าตาเหมือนกันทั้งโหมดสว่าง/มืด
const LINE = {
    chatBg: '#FDEBDC',      // พื้นหลังห้องแชท (ครีมส้ม)
    sent: '#FF9F57',        // ฟองฝั่งร้าน (พนักงาน)
    sentBot: '#FFD3AE',     // ฟองฝั่งร้าน (BOT) — ส้มอ่อนกว่า แยกจากพนักงานจริง
    received: '#FFFFFF',    // ฟองลูกค้า
    text: '#2B1608',
    meta: '#8A4A1C',        // ชื่อผู้ส่ง/เวลา (น้ำตาลส้ม อ่านออกบนพื้นครีม)
    pill: 'rgba(214,104,30,0.16)',
    pillText: '#9A4A12',
};

const shortDateLabel = (date) =>
    date.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' });

function DateSeparator({ date }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <Typography
                level="body-xs"
                title={dateLabel(date)}
                sx={{ bgcolor: LINE.pill, color: LINE.pillText, px: 1.5, py: 0.25, borderRadius: 999, fontWeight: 500 }}
            >
                {shortDateLabel(date)}
            </Typography>
        </Box>
    );
}

function MessageRow({ row, onPreview }) {
    const { message, sender, role, date, grouped } = row;
    const isCustomer = role === 'customer';
    const isBubble = !['image', 'sticker', 'video', 'product'].includes(message.contentType);

    return (
        <Stack direction="row" spacing={1} sx={{ mt: grouped ? 0.5 : 1.5, justifyContent: isCustomer ? 'flex-start' : 'flex-end' }}>
            {/* LINE แสดงรูปโปรไฟล์เฉพาะฝั่งคู่สนทนา และเฉพาะข้อความแรกของกลุ่ม */}
            {isCustomer && (
                <Box sx={{ width: { xs: 30, sm: 36 }, flexShrink: 0 }}>
                    {!grouped && <Avatar src={sender?.avatar} sx={{ width: { xs: 30, sm: 36 }, height: { xs: 30, sm: 36 } }} />}
                </Box>
            )}

            <Stack sx={{ minWidth: 0, maxWidth: { xs: '84%', md: '65%' }, alignItems: isCustomer ? 'flex-start' : 'flex-end' }}>
                {!grouped && (
                    <Typography
                        level="body-xs"
                        startDecorator={role === 'bot' ? <SmartToy sx={{ fontSize: 14 }} /> : undefined}
                        sx={{ color: LINE.meta, mb: 0.5, px: 0.5, fontWeight: 500 }}
                    >
                        {senderName(sender)}
                    </Typography>
                )}

                {/* เวลาอยู่ข้างฟองด้านล่าง: ลูกค้า = ขวาของฟอง, ร้าน = ซ้ายของฟอง */}
                <Stack direction={isCustomer ? 'row' : 'row-reverse'} spacing={0.75} alignItems="flex-end" sx={{ minWidth: 0, maxWidth: '100%' }}>
                    <Box sx={{ minWidth: 0 }}>
                        <MessageContent message={message} role={role} onPreview={onPreview} tail={isBubble && !grouped} />
                    </Box>
                    <Typography sx={{ color: LINE.meta, fontSize: 10, lineHeight: 1.2, flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {timeLabel(date)}
                    </Typography>
                </Stack>
            </Stack>
        </Stack>
    );
}

function MessageContent({ message, role, onPreview, tail }) {
    const { content, contentType } = message;
    const url = typeof content === 'string' ? forceHttps(content) : content;

    if (contentType === 'image' || contentType === 'sticker') {
        const isSticker = contentType === 'sticker';
        return (
            <Box
                component="img"
                src={url}
                alt={contentType}
                loading="lazy"
                onClick={() => onPreview(url)}
                sx={{
                    display: 'block',
                    maxWidth: isSticker ? { xs: 110, sm: 130 } : { xs: 200, sm: 240 },
                    maxHeight: 260,
                    borderRadius: isSticker ? 0 : '14px',
                    cursor: 'zoom-in',
                    objectFit: 'cover',
                }}
            />
        );
    }

    if (contentType === 'video') {
        return <Box component="video" src={url} controls preload="metadata" sx={{ display: 'block', maxWidth: 300, width: '100%', borderRadius: '14px', bgcolor: '#000' }} />;
    }

    if (contentType === 'product') {
        return <ChatBubbleProduct content={content} />;
    }

    const isCustomer = role === 'customer';
    const bg = isCustomer ? LINE.received : role === 'bot' ? LINE.sentBot : LINE.sent;

    // หางของฟอง (แบบ LINE) เฉพาะข้อความแรกของกลุ่ม
    const tailSx = tail ? {
        '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            [isCustomer ? 'left' : 'right']: -6,
            width: 12,
            height: 12,
            bgcolor: bg,
            clipPath: isCustomer ? 'polygon(100% 0, 0 0, 100% 100%)' : 'polygon(0 0, 100% 0, 0 100%)',
        },
    } : {};

    return (
        <Box
            sx={{
                position: 'relative',
                bgcolor: bg,
                color: LINE.text,
                px: 1.5,
                py: 1,
                borderRadius: '18px',
                ...(tail && (isCustomer ? { borderTopLeftRadius: 4 } : { borderTopRightRadius: 4 })),
                ...tailSx,
            }}
        >
            {contentType === 'audio' ? (
                <Box component="audio" src={url} controls sx={{ display: 'block', maxWidth: 260, height: 36 }} />
            ) : contentType === 'file' ? (
                <Box
                    component="a" href={url} target="_blank" rel="noopener noreferrer"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'inherit', textDecoration: 'none' }}
                >
                    <InsertDriveFile fontSize="small" />
                    <Typography level="body-sm" sx={{ color: 'inherit', textDecoration: 'underline' }}>เปิดไฟล์</Typography>
                </Box>
            ) : (
                <Typography
                    level="body-md"
                    startDecorator={contentType === 'location' ? <LocationOn fontSize="small" /> : undefined}
                    sx={{ color: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.5 }}
                >
                    {String(content ?? '')}
                </Typography>
            )}
        </Box>
    );
}

const HeaderStyle = {
    px: { xs: 1.5, sm: 2.5 },
    py: { xs: 1, sm: 1.5 },
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 1.5,
    borderBottom: '1px solid',
    borderColor: 'divider',
    flexShrink: 0,
};

const CenterStyle = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
};
