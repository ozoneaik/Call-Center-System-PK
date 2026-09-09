import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    CircularProgress, Sheet, Box, Stack, Avatar, Typography, Button, IconButton, Divider, Chip,
} from "@mui/joy";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import CloseIcon from "@mui/icons-material/Close";
import { MessageStyle } from "../../styles/MessageStyle.js";
import { kbConversationApi } from "../../Api/KnowledgeBase.js";
import ReadOnlyChatBubble from "./ReadOnlyChatBubble.jsx";
import EntryReviewPanel from "./EntryReviewPanel.jsx";
import { forceHttps } from "../../utils.js";

const RAIL_WIDTH_EXPANDED  = '84px';
const RAIL_WIDTH_COLLAPSED = '28px';
const PANEL_WIDTH          = 'clamp(320px, 30vw, 420px)';

const statusColor = { pending: 'warning', approved: 'success', rejected: 'danger' };
const statusLabel = { pending: 'รอตรวจสอบ', approved: 'อนุมัติแล้ว', rejected: 'ปรับแก้แล้ว' };

/**
 * จำลองหน้าแชทจริง (แบบ read-only) ของบทสนทนาที่ผูกกับ ai_kb_entries รายการหนึ่ง
 * ใช้ตอนกด "ตรวจสอบ" จากหน้าจัดการ Knowledge Base — sidebar ขวามีแท็บ AI เดียว
 * แสดงบล็อคที่พนักงานเพิ่มเข้า KB พร้อมพื้นที่ให้แอดมินแก้ไข/อนุมัติ (EntryReviewPanel)
 */
export default function EntryReviewPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [entry,      setEntry]      = useState(null);
    const [customer,   setCustomer]   = useState(null);
    const [messages,   setMessages]   = useState([]);
    const [loading,    setLoading]    = useState(true);
    // collapsed = ยุบทั้งแถบไซด์บาร์เหลือแถบบาง (ปุ่ม "ซ่อน" ด้านล่างแถบ)
    // panelOpen = เปิด/ปิดเฉพาะแผง AI (ปุ่มกากบาทที่หัวแผง) — ปิดแล้วปุ่ม "AI" ในแถบข้างยังอยู่ให้กดเปิดใหม่ได้
    const [collapsed,  setCollapsed]  = useState(false);
    const [panelOpen,  setPanelOpen]  = useState(true);

    const fetchData = async () => {
        setLoading(true);
        const { data, status } = await kbConversationApi(id);
        if (status === 200) {
            setEntry(data.entry);
            setCustomer(data.customer);
            setMessages(data.messages || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // เลื่อนไปยังจุดที่เกี่ยวข้องกับ KB นี้อัตโนมัติ — เจาะจงที่สุดก่อน: ข้อความต้นทาง (message_ref)
    // ถ้าไม่มี/ไม่เจอ ค่อย fallback ไปจุดเริ่มต้นของ "ช่วง session" ที่ใช้สร้าง KB นี้
    const SOURCE_MESSAGE_DOM_ID = 'kb-source-message';
    const SESSION_START_DOM_ID  = 'kb-source-session-start';
    useEffect(() => {
        if (loading) return;
        const target = document.getElementById(SOURCE_MESSAGE_DOM_ID) || document.getElementById(SESSION_START_DOM_ID);
        target?.scrollIntoView({ block: 'center' });
    }, [loading, messages, entry]);

    // ข้อความนี้คือ "จุดต้นทาง" ของ KB นี้หรือไม่ — message_ref เก็บเป็น id ของ chat_histories
    // หรือ created_at เป็น fallback (ดู Info/main.jsx@generateForMessage ฝั่งหน้าแชทจริง)
    const isSourceMessage = (m) => entry?.message_ref != null
        && (String(m.id) === String(entry.message_ref) || String(m.created_at) === String(entry.message_ref));

    // ความกว้าง rail/panel ไซด์บาร์ ใช้ CSS variable แบบเดียวกับหน้าแชทจริง (MessageStyle.MainLayout)
    useEffect(() => {
        document.documentElement.style.setProperty('--InfoRail-width', collapsed ? RAIL_WIDTH_COLLAPSED : RAIL_WIDTH_EXPANDED);
        document.documentElement.style.setProperty('--InfoPanel-width', (!collapsed && panelOpen) ? PANEL_WIDTH : '0px');
        return () => {
            document.documentElement.style.removeProperty('--InfoRail-width');
            document.documentElement.style.removeProperty('--InfoPanel-width');
        };
    }, [collapsed, panelOpen]);

    const handleBack = () => navigate('/knowledge-base');

    return (
        <Sheet sx={MessageStyle.MainLayout}>
            <Sheet>
                <Sheet sx={MessageStyle.Layout}>
                    {/* Header จำลองจาก MessagePaneHeader — ตัดปุ่มจัดการห้อง/ตัวช่วยตอบที่ใช้เฉพาะตอนคุยสดออก */}
                    <Stack direction={{ sm: 'column', md: 'row' }} backgroundColor="background.body"
                        justifyContent="space-between" spacing={2} sx={{ p: 1 }} borderBottom={1} borderColor="divider">
                        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                            <Button onClick={handleBack} variant="outlined">
                                <ArrowBackIosIcon />
                            </Button>
                            <Avatar size="lg" src={forceHttps(customer?.avatar)} />
                            <div>
                                <Typography component="h2" noWrap sx={MessageStyle.PaneHeader.HeadTitle}>
                                    {customer?.custName ?? entry?.cust_id ?? 'ไม่ทราบชื่อลูกค้า'}
                                </Typography>
                                {entry && (
                                    <Stack direction="row" spacing={1} mt={0.5}>
                                        <Chip size="sm" color={statusColor[entry.admin_status]}>
                                            {statusLabel[entry.admin_status] ?? entry.admin_status}
                                        </Chip>
                                        <Chip size="sm" variant="outlined" color="neutral">{entry.cust_id ?? '-'}</Chip>
                                    </Stack>
                                )}
                            </div>
                        </Stack>
                    </Stack>

                    {/* บทสนทนา (read-only) */}
                    <Box sx={MessageStyle.PaneContent}>
                        {loading ? (
                            <CircularProgress />
                        ) : (
                            <Stack spacing={2} sx={{ justifyContent: 'flex-end' }}>
                                {messages.length > 0 ? messages.map((m, idx) => {
                                    const isSource = isSourceMessage(m);
                                    // ขอบเขต "ช่วงบทสนทนา" (session) ที่ใช้สร้าง KB นี้ — ใส่เส้นคั่นบอกจุดเริ่ม/จบ
                                    const prevInSession = idx > 0 && messages[idx - 1].in_source_session;
                                    const nextInSession = idx < messages.length - 1 && messages[idx + 1].in_source_session;
                                    const isSessionStart = m.in_source_session && !prevInSession;
                                    const isSessionEnd   = m.in_source_session && !nextInSession;

                                    return (
                                        <Box key={m.id}>
                                            {isSessionStart && (
                                                <Divider sx={{ my: 1.5, '--Divider-childPosition': '50%' }}>
                                                    <Typography level="body-xs" sx={{ color: 'primary.500', fontWeight: 600 }}>
                                                        ▼ ช่วงบทสนทนาที่ใช้สร้าง KB นี้
                                                    </Typography>
                                                </Divider>
                                            )}
                                            <ReadOnlyChatBubble
                                                message={m} highlighted={isSource} inSession={m.in_source_session}
                                                bubbleId={isSource ? SOURCE_MESSAGE_DOM_ID : (isSessionStart ? SESSION_START_DOM_ID : undefined)}
                                            />
                                            {isSessionEnd && (
                                                <Divider sx={{ my: 1.5, '--Divider-childPosition': '50%' }}>
                                                    <Typography level="body-xs" sx={{ color: 'primary.500', fontWeight: 600 }}>
                                                        ▲ สิ้นสุดช่วงที่ใช้สร้าง KB นี้
                                                    </Typography>
                                                </Divider>
                                            )}
                                        </Box>
                                    );
                                }) : (
                                    <Typography level="body-sm" color="neutral" sx={{ textAlign: 'center', py: 4 }}>
                                        ไม่มีประวัติการสนทนาอ้างอิงสำหรับรายการนี้
                                    </Typography>
                                )}
                            </Stack>
                        )}
                    </Box>
                </Sheet>
            </Sheet>

            {/* Panel ไซด์บาร์ (แท็บ AI เดียว — เนื้อหาคือ EntryReviewPanel) */}
            <Box sx={MessageStyle.Info.panelWrapper}>
                {!collapsed && panelOpen && (
                    <Sheet sx={MessageStyle.Info.panel} variant="outlined">
                        <Box sx={MessageStyle.Info.panelHeader}>
                            <Typography level="title-md">AI วิเคราะห์การสนทนา</Typography>
                            <IconButton size="sm" variant="plain" color="neutral" onClick={() => setPanelOpen(false)}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress size="sm" />
                                </Box>
                            ) : (
                                <EntryReviewPanel entry={entry} onRefresh={fetchData} onDeleted={handleBack} />
                            )}
                        </Box>
                    </Sheet>
                )}
            </Box>

            {/* Bar ไซด์บาร์ขวา — แท็บ AI เดียว (ไม่มีโน้ต/ประเมิน เพราะหน้านี้ไว้ตรวจสอบ KB โดยเฉพาะ) */}
            {collapsed ? (
                <Box sx={MessageStyle.Info.collapsedRail} onClick={() => setCollapsed(false)}>
                    <KeyboardDoubleArrowLeftIcon fontSize="small" />
                </Box>
            ) : (
                <Sheet sx={MessageStyle.Info.rail} variant="outlined">
                    <Box sx={MessageStyle.Info.railItem} onClick={() => setPanelOpen(true)}>
                        <IconButton size="sm" sx={MessageStyle.Info.aiIconButton}>
                            <AutoAwesomeIcon fontSize="small" />
                        </IconButton>
                        <Typography sx={{ ...MessageStyle.Info.railLabel, color: '#6c5dd3', fontWeight: 700 }}>
                            AI
                        </Typography>
                    </Box>

                    <Box sx={{ flex: { xs: 0, md: 1 } }} />

                    <Divider sx={{ width: '70%' }} />

                    <Box sx={MessageStyle.Info.railItem} onClick={() => setCollapsed(true)}>
                        <KeyboardDoubleArrowRightIcon fontSize="small" />
                        <Typography sx={MessageStyle.Info.railLabel}>ซ่อน</Typography>
                    </Box>
                </Sheet>
            )}
        </Sheet>
    );
}
