import * as React from 'react';
import {
    Avatar, Badge, Box, Button, Dropdown, IconButton, Input, ListDivider,
    Menu, MenuButton, MenuItem, Typography
} from '@mui/joy';
import SearchIcon from '@mui/icons-material/Search';
import {
    ChatBubble, ChatBubbleOutline, History, HourglassBottom, HourglassEmpty, MoreVert, Send
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertDiaLog } from '../../Dialogs/Alert';
import { endTalkAllProgressApi, receiveApi } from '../../Api/Messages';

const LINE_GREEN = '#06C755';

// เวลาของข้อความล่าสุดแบบ LINE: วันนี้ -> HH:mm, เมื่อวาน, อื่นๆ -> d/m
const formatChatTime = (date) => {
    if (!date) return '';
    const D = new Date(date);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.floor((startOfToday - new Date(D.getFullYear(), D.getMonth(), D.getDate())) / 86400000);
    if (diffDays <= 0) {
        return `${String(D.getHours()).padStart(2, '0')}:${String(D.getMinutes()).padStart(2, '0')}`;
    }
    if (diffDays === 1) return 'เมื่อวาน';
    return `${D.getDate()}/${D.getMonth() + 1}`;
};

// ระยะเวลาแบบสั้น เช่น "2 ชม. 15 นาที"
const formatElapsed = (startTime, now) => {
    if (!startTime) return 'ยังไม่เริ่มสนทนา';
    let sec = Math.max(0, Math.floor((now - new Date(startTime)) / 1000));
    const days = Math.floor(sec / 86400);
    sec %= 86400;
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    if (days > 0) return `${days} วัน ${hours} ชม.`;
    if (hours > 0) return `${hours} ชม. ${minutes} นาที`;
    return `${minutes} นาที`;
};

const previewText = (msg) => {
    if (!msg) return '';
    return msg.contentType === 'text' ? msg.content : 'ส่งรูปภาพหรือสติกเกอร์';
};

function ChatRow({ row, now, onClick, trailing, subtitle }) {
    const unread = row.unread_count || 0;
    return (
        <Box
            onClick={onClick}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1.25,
                cursor: 'pointer',
                '&:active': { bgcolor: 'background.level1' },
            }}
        >
            <Avatar src={row.avatar || ''} sx={{ width: 52, height: 52, flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography level="title-md" noWrap sx={{ flex: 1, minWidth: 0, fontWeight: 600 }}>
                        {row.custName}
                    </Typography>
                    <Typography level="body-xs" sx={{ flexShrink: 0, color: 'text.tertiary' }}>
                        {formatChatTime(row.latest_message?.created_at || row.updated_at)}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                    <Typography
                        level="body-sm"
                        noWrap
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            color: unread > 0 ? 'text.primary' : 'text.tertiary',
                            fontWeight: unread > 0 ? 600 : 400,
                        }}
                    >
                        {previewText(row.latest_message)}
                    </Typography>
                    {unread > 0 && (
                        <Box
                            sx={{
                                flexShrink: 0,
                                minWidth: 20,
                                height: 20,
                                px: 0.75,
                                borderRadius: 10,
                                bgcolor: LINE_GREEN,
                                color: '#fff',
                                fontSize: 12,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {unread > 99 ? '99+' : unread}
                        </Box>
                    )}
                </Box>
                <Typography level="body-xs" noWrap sx={{ mt: 0.25, color: 'text.tertiary' }}>
                    {subtitle(row, now)}
                </Typography>
            </Box>
            {trailing && (
                <Box sx={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    {trailing(row)}
                </Box>
            )}
        </Box>
    );
}

export default function MobileCaseList({
    roomId,
    roomName,
    progress,
    filterProgress,
    setFilterProgress,
    showMyCasesOnly,
    setShowMyCasesOnly,
    filterPending,
}) {
    const [tab, setTab] = React.useState('progress');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [now, setNow] = React.useState(() => Date.now());
    const [receiving, setReceiving] = React.useState({});
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    React.useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(interval);
    }, []);

    const isMine = (data) => data.empCode === user.empCode || data.empId === user.id;

    const handleMyCases = (checked) => {
        setShowMyCasesOnly(checked);
        setFilterProgress(checked ? progress.filter(isMine) : progress);
        localStorage.setItem("showMyCasesOnly", JSON.stringify(checked));
    };

    const term = searchTerm.trim().toLowerCase();
    const matches = (row) => !term || row.custName?.toLowerCase().includes(term);
    const progressList = filterProgress.filter(matches);
    const pendingList = filterPending.filter(matches);

    const openProgressChat = (row) => {
        setFilterProgress((prev) =>
            prev.map((item) => item.custId === row.custId ? { ...item, isUnread: false } : item)
        );
        let unreadIds = JSON.parse(localStorage.getItem("unreadCustIds") || "[]");
        unreadIds = unreadIds.filter((id) => id !== row.custId);
        localStorage.setItem("unreadCustIds", JSON.stringify(unreadIds));
        navigate(`/select/message/${row.rateRef}/${row.id}/${row.custId}/1`, {
            state: { from: location },
        });
    };

    const openPendingChat = (row) => {
        navigate(`/select/message/${row.rateRef}/${row.id}/${row.custId}/0`, {
            state: { from: location },
        });
    };

    const handleReceive = (row) => {
        AlertDiaLog({
            title: 'ต้องการรับเรื่องหรือไม่',
            text: 'กด "ตกลง" เพื่อยืนยันรับเรื่อง',
            icon: 'info',
            onPassed: async (confirm) => {
                if (!confirm) return;
                setReceiving((prev) => ({ ...prev, [row.id]: true }));
                try {
                    const { data, status } = await receiveApi(row.rateRef, row.roomId);
                    if (status !== 200) {
                        AlertDiaLog({ title: data.message, text: data.detail });
                    }
                } catch (error) {
                    AlertDiaLog({
                        title: 'เกิดข้อผิดพลาด',
                        text: 'ไม่สามารถรับเรื่องได้ กรุณาลองใหม่อีกครั้ง'
                    });
                } finally {
                    setReceiving((prev) => ({ ...prev, [row.id]: false }));
                }
            }
        });
    };

    const handleEndTalkAll = () => {
        AlertDiaLog({
            title: "จบการสนทนาทั้งหมด",
            text: "คุณต้องการจบการสนทนาทั้งหมดที่กำลังดำเนินการอยู่หรือไม่ ?",
            icon: "question",
            onPassed: async (confirm) => {
                if (confirm) {
                    const { data, status } = await endTalkAllProgressApi({ roomId, list: progress });
                    AlertDiaLog({
                        title: data.message,
                        text: data.detail,
                        icon: status === 200 ? "success" : "error",
                        onPassed: () => status === 200 && window.location.reload(),
                    });
                }
            },
        });
    };

    const tabs = [
        {
            key: 'progress', label: 'กำลังดำเนินการ', count: filterProgress.length,
            icon: ChatBubbleOutline, activeIcon: ChatBubble,
        },
        {
            key: 'pending', label: 'รอดำเนินการ', count: filterPending.length,
            icon: HourglassEmpty, activeIcon: HourglassBottom,
        },
    ];

    const list = tab === 'progress' ? progressList : pendingList;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, width: '100%', maxWidth: '100vw', overflow: 'hidden', bgcolor: 'background.surface' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', px: 2, pt: 1.5, pb: 1 }}>
                <Typography level="h4" noWrap sx={{ flex: 1, fontWeight: 700 }}>
                    {roomName || 'แชท'}
                </Typography>
                <Dropdown>
                    <MenuButton slots={{ root: IconButton }} slotProps={{ root: { variant: 'plain', color: 'neutral' } }}>
                        <MoreVert />
                    </MenuButton>
                    <Menu placement="bottom-end" size="sm">
                        <MenuItem selected={!showMyCasesOnly} onClick={() => handleMyCases(false)}>เคสทั้งหมด</MenuItem>
                        <MenuItem selected={showMyCasesOnly} onClick={() => handleMyCases(true)}>เคสของฉัน</MenuItem>
                        <ListDivider />
                        <MenuItem onClick={() => navigate('/chatHistory')}>
                            <History fontSize="small" /> ประวัติแชททั้งหมด
                        </MenuItem>
                        <MenuItem color="warning" onClick={handleEndTalkAll}>
                            <Send fontSize="small" /> จบการสนทนาทั้งหมด
                        </MenuItem>
                    </Menu>
                </Dropdown>
            </Box>

            {/* Search */}
            <Box sx={{ px: 2, pb: 1 }}>
                <Input
                    placeholder="ค้นหาชื่อลูกค้า"
                    startDecorator={<SearchIcon />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    variant="soft"
                    sx={{ borderRadius: 10, '--Input-minHeight': '38px' }}
                />
            </Box>

            {showMyCasesOnly && tab === 'progress' && (
                <Typography level="body-xs" sx={{ px: 2, py: 0.75, bgcolor: 'background.level1', color: 'text.secondary' }}>
                    แสดงเฉพาะเคสของฉัน
                </Typography>
            )}

            {/* List */}
            <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
                {list.length === 0 ? (
                    <Typography level="body-sm" sx={{ textAlign: 'center', color: 'text.tertiary', py: 6 }}>
                        ไม่มีรายการ
                    </Typography>
                ) : tab === 'progress' ? (
                    list.map((row) => (
                        <ChatRow
                            key={row.id}
                            row={row}
                            now={now}
                            onClick={() => openProgressChat(row)}
                            subtitle={(r, n) => `${r.description || ''} · ${r.empName || '-'} · ${formatElapsed(r.startTime, n)}`}
                        />
                    ))
                ) : (
                    list.map((row) => (
                        <ChatRow
                            key={row.id}
                            row={row}
                            now={now}
                            onClick={() => openPendingChat(row)}
                            subtitle={(r, n) => `${r.description || ''} · รอ ${formatElapsed(r.created_at, n)}`}
                            trailing={(r) => (
                                <Button
                                    size="sm"
                                    loading={!!receiving[r.id]}
                                    onClick={() => handleReceive(r)}
                                    sx={{
                                        borderRadius: 20,
                                        bgcolor: LINE_GREEN,
                                        '&:hover': { bgcolor: '#05B34C' },
                                    }}
                                >
                                    รับเรื่อง
                                </Button>
                            )}
                        />
                    ))
                )}
            </Box>

            {/* Bottom tab bar */}
            <Box
                sx={{
                    display: 'flex',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.surface',
                    pb: 'env(safe-area-inset-bottom)',
                    flexShrink: 0,
                }}
            >
                {tabs.map((t) => {
                    const active = tab === t.key;
                    const Icon = active ? t.activeIcon : t.icon;
                    return (
                        <Box
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            sx={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 0.25,
                                py: 0.75,
                                cursor: 'pointer',
                                color: active ? 'text.primary' : 'text.tertiary',
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            <Badge
                                badgeContent={t.count > 99 ? '99+' : t.count}
                                invisible={t.count === 0}
                                color="danger"
                                size="sm"
                                badgeInset="10%"
                            >
                                <Icon sx={{ fontSize: 26 }} />
                            </Badge>
                            <Typography level="body-xs" sx={{ color: 'inherit', fontWeight: active ? 700 : 500, fontSize: 11 }}>
                                {t.label}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
