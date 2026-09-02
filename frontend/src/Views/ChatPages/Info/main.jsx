import { MessageStyle } from "../../../styles/MessageStyle.js";
import { Box, Sheet, IconButton, Divider } from "@mui/joy";
import Typography from "@mui/joy/Typography";
import { useEffect, useRef, useState } from "react";
import { Notes } from "./Notes.jsx";
import { Feedback } from "./Feedback.jsx";
import AIPanel from "./AIPanel.jsx";
import axiosClient from "../../../Axios.js";
import { sendChatOcAnyApi } from "../../../Api/ChatOcAny.js";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import LocalMallIcon from "@mui/icons-material/LocalMall";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import CloseIcon from "@mui/icons-material/Close";

const RAIL_WIDTH_EXPANDED = '84px';
const RAIL_WIDTH_COLLAPSED = '28px';
const PANEL_WIDTH = 'clamp(300px, 28vw, 400px)';

const SECTION_TITLES = {
    ai: 'AI วิเคราะห์การสนทนา',
    notes: 'โน้ต',
    feedback: 'ประวัติการประเมิน',
    lazadaOrders: 'ประวัติออเดอร์ Lazada',
    shopeeOrders: 'ประวัติออเดอร์ Shopee',
};

export default function Info(props) {
    const { sender, check, setMsg, activeId, latestCustomerMessage } = props;
    const [notes, setNotes] = useState([]);
    const [starList, setStarList] = useState([]);
    const [newNote, setNewNote] = useState("");

    const [orders, setOrders] = useState([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [ordersPlatform, setOrdersPlatform] = useState('');

    // ส่วนที่กำลังเปิดใน Bar เมนูขวามือ: 'ai' | 'notes' | 'feedback' | 'lazadaOrders' | 'shopeeOrders' | null
    const [openSection, setOpenSection] = useState(null);
    // ย่อ/ขยาย Bar เมนูขวามือ
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        document.documentElement.style.setProperty(
            '--InfoRail-width',
            collapsed ? RAIL_WIDTH_COLLAPSED : RAIL_WIDTH_EXPANDED
        );
        return () => {
            document.documentElement.style.removeProperty('--InfoRail-width');
        };
    }, [collapsed]);

    useEffect(() => {
        const showPanel = !collapsed && openSection !== null;
        document.documentElement.style.setProperty('--InfoPanel-width', showPanel ? PANEL_WIDTH : '0px');
        return () => {
            document.documentElement.style.removeProperty('--InfoPanel-width');
        };
    }, [collapsed, openSection]);

    const handleUseDraft = (text) => {
        setMsg?.({ content: text, contentType: 'text', sender });
    };

    // อยู่ที่นี่ (ไม่ใช่ใน AIPanel) เพราะต้องทำงานเบื้องหลังตลอดเวลา ไม่ใช่แค่ตอนเปิดแท็บ AI อยู่
    // ทันทีที่ลูกค้าทักข้อความใหม่เข้ามา ให้ยิงไปที่ chat-oc-any อัตโนมัติ แล้วเอาผลลัพธ์มาแสดงเป็นการ์ดคำแนะนำ
    const [liveSuggestions, setLiveSuggestions] = useState([]);
    const [liveLoading, setLiveLoading] = useState(false);
    const lastProcessedMessageKeyRef = useRef(null);

    useEffect(() => {
        if (!latestCustomerMessage) return;
        const key = latestCustomerMessage.id ?? latestCustomerMessage.created_at;
        if (!key || key === lastProcessedMessageKeyRef.current) return;
        lastProcessedMessageKeyRef.current = key;

        const isImage = latestCustomerMessage.contentType === 'image';
        const questionText = isImage ? '[ลูกค้าส่งรูปภาพ]' : latestCustomerMessage.content;

        const run = async () => {
            setLiveLoading(true);
            try {
                const data = await sendChatOcAnyApi({
                    message: isImage ? '' : latestCustomerMessage.content,
                    imageUrl: isImage ? latestCustomerMessage.content : undefined,
                    custId: sender?.custId,
                });
                setLiveSuggestions((prev) => [
                    {
                        id: `live-${key}`,
                        // summarytxt = สรุปสั้นๆ ว่าลูกค้าต้องการอะไร, answer = ร่างคำตอบจริงที่ AI แนะนำ
                        question: data.summarytxt || questionText,
                        content: data.answer || data.reply,
                        source: data.source || 'ai',
                        reference: data.resolved_product
                            ? Object.entries(data.resolved_product).map(([k, v]) => `${k}: ${v}`).join(' · ')
                            : undefined,
                    },
                    ...prev,
                ]);
            } catch (err) {
                console.error('เรียก chat-oc-any อัตโนมัติไม่สำเร็จ', err);
            } finally {
                setLiveLoading(false);
            }
        };

        run();
    }, [latestCustomerMessage]);

    useEffect(() => {
        setNotes(props.notes);
    }, [props.notes]);

    useEffect(() => {
        setStarList(props.starList);
    }, [props.starList]);

    const isShopeeCustomer = sender?.description?.toLowerCase().includes('shopee') || sender?.custName?.toLowerCase().includes('shopee');
    const isLazadaCustomer = sender?.description?.toLowerCase().includes('lazada') || sender?.custName?.toLowerCase().includes('laz');

    const fetchLazadaOrders = async () => {
        setOpenSection('lazadaOrders');
        setOrdersPlatform('Lazada');
        setIsLoadingOrders(true);
        try {
            const res = await axiosClient.get(`/webhook-new/lazada/customer-orders/${sender?.custId}`);
            setOrders(res.data.orders || []);
        } catch (err) {
            console.error("โหลดออเดอร์ Lazada ไม่สำเร็จ", err);
            setOrders([]);
        } finally {
            setIsLoadingOrders(false);
        }
    };

    const fetchShopeeOrders = async () => {
        setOpenSection('shopeeOrders');
        setOrdersPlatform('Shopee');
        setIsLoadingOrders(true);
        try {
            const res = await axiosClient.get(`/webhook-new/shopee/customer-orders/${sender?.custId}`);
            setOrders(res.data.orders || []);
        } catch (err) {
            console.error("โหลดออเดอร์ Shopee ไม่สำเร็จ", err);
            setOrders([]);
        } finally {
            setIsLoadingOrders(false);
        }
    };

    const formatCurrency = (amount, currency = 'THB') => {
        const formatter = new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        });
        return formatter.format(amount);
    };

    const getStatusColor = (status) => {
        const statusLower = status?.toLowerCase() || '';
        if (statusLower.includes('complete') || statusLower.includes('delivered')) return 'success';
        if (statusLower.includes('cancel')) return 'danger';
        if (statusLower.includes('pending') || statusLower.includes('processing')) return 'warning';
        return 'neutral';
    };

    const renderLazadaOrder = (order, index) => (
        <Box key={index} sx={{ my: 1, p: 2, borderRadius: 1, bgcolor: 'background.level1' }}>
            <Typography level="body-sm" fontWeight="bold">
                📦 Order No: {order.order_number}
            </Typography>
            <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.5, fontStyle: 'italic' }}>
                🛒 {order.product_names || 'ไม่มีข้อมูลสินค้า'}
            </Typography>
            <Typography level="body-sm" color={getStatusColor(order.statuses?.[0])}>
                📌 สถานะ: {order.statuses?.join(", ") || order.status || '-'}
            </Typography>
            <Typography level="body-sm">
                💰 ยอดรวม: {formatCurrency(order.price || 0)}
            </Typography>
            <Typography level="body-sm" color="neutral">
                🗓️ วันที่: {order.created_at || '-'}
            </Typography>
            {order.items_count && (
                <Typography level="body-sm" color="neutral">
                    🛒 จำนวนสินค้า: {order.items_count} รายการ
                </Typography>
            )}
        </Box>
    );

    const renderShopeeOrder = (order, index) => (
        <Box key={index} sx={{ my: 1, p: 2, borderRadius: 1, bgcolor: 'background.level1' }}>
            <Typography level="body-sm" fontWeight="bold">
                📦 Order SN: {order.order_sn}
            </Typography>
            <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.5, fontStyle: 'italic' }}>
                🛒 {order.product_names || 'ไม่มีข้อมูลสินค้า'}
            </Typography>
            <Typography level="body-sm" color={getStatusColor(order.status)}>
                📌 สถานะ: {order.status}
            </Typography>
            <Typography level="body-sm">
                💰 ยอดรวม: {formatCurrency(order.price, order.currency)}
            </Typography>
            <Typography level="body-sm" color="neutral">
                🗓️ วันที่: {order.created_at || '-'}
            </Typography>
        </Box>
    );

    const renderOrdersSection = (platform) => (
        <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
            {orders.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography color="neutral">
                        {isLoadingOrders
                            ? "กำลังโหลด..."
                            : `ลูกค้าคนนี้ยังไม่มีประวัติการสั่งซื้อใน ${platform}`
                        }
                    </Typography>
                </Box>
            ) : (
                orders.map((order, index) =>
                    platform === 'Lazada'
                        ? renderLazadaOrder(order, index)
                        : renderShopeeOrder(order, index)
                )
            )}
        </Box>
    );

    return (
        <>
            {/* Panel ถาวรกินพื้นที่จริง (ไม่ใช่ Drawer) ใช้ร่วมกันทุก section เพราะต้องดูควบคู่กับการพิมพ์ตอบ */}
            <Box sx={MessageStyle.Info.panelWrapper}>
                {!collapsed && openSection && (
                    <Sheet sx={MessageStyle.Info.panel} variant="outlined">
                        <Box sx={MessageStyle.Info.panelHeader}>
                            <Typography level="title-md">{SECTION_TITLES[openSection]}</Typography>
                            <IconButton size="sm" variant="plain" color="neutral" onClick={() => setOpenSection(null)}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>

                        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                            {openSection === 'ai' && (
                                <AIPanel
                                    activeId={activeId}
                                    custId={sender?.custId}
                                    onUseDraft={handleUseDraft}
                                    liveSuggestions={liveSuggestions}
                                    liveLoading={liveLoading}
                                />
                            )}

                            {openSection === 'notes' && (
                                <Notes
                                    notes={notes}
                                    setNotes={setNotes}
                                    check={check}
                                    newNote={newNote}
                                    setNewNote={setNewNote}
                                    sender={sender}>
                                </Notes>
                            )}

                            {openSection === 'feedback' && (
                                <Feedback starList={starList} />
                            )}

                            {openSection === 'lazadaOrders' && renderOrdersSection('Lazada')}

                            {openSection === 'shopeeOrders' && renderOrdersSection('Shopee')}
                        </Box>
                    </Sheet>
                )}
            </Box>

            {/* Bar เมนูขวามือ: กดเพื่อเปิดแต่ละส่วนแทนการแสดงตลอด */}
            {collapsed ? (
                <Box sx={MessageStyle.Info.collapsedRail} onClick={() => setCollapsed(false)}>
                    <KeyboardDoubleArrowLeftIcon fontSize="small" />
                </Box>
            ) : (
                <Sheet sx={MessageStyle.Info.rail} variant="outlined">
                    {/* AI: เตรียมช่องไว้สำหรับฟีเจอร์ AI ที่จะเพิ่มภายหลัง */}
                    <Box sx={MessageStyle.Info.railItem} onClick={() => setOpenSection('ai')}>
                        <IconButton size="sm" sx={MessageStyle.Info.aiIconButton}>
                            <AutoAwesomeIcon fontSize="small" />
                        </IconButton>
                        <Typography sx={{ ...MessageStyle.Info.railLabel, color: '#6c5dd3', fontWeight: 700 }}>
                            AI
                        </Typography>
                    </Box>

                    <Divider sx={{ width: '70%' }} />

                    <Box sx={MessageStyle.Info.railItem} onClick={() => setOpenSection('notes')}>
                        <IconButton size="sm" variant={openSection === 'notes' ? 'soft' : 'plain'} color="neutral">
                            <DescriptionOutlinedIcon fontSize="small" />
                        </IconButton>
                        <Typography sx={MessageStyle.Info.railLabel}>โน้ต</Typography>
                    </Box>

                    <Box sx={MessageStyle.Info.railItem} onClick={() => setOpenSection('feedback')}>
                        <IconButton size="sm" variant={openSection === 'feedback' ? 'soft' : 'plain'} color="neutral">
                            <StarBorderRoundedIcon fontSize="small" />
                        </IconButton>
                        <Typography sx={MessageStyle.Info.railLabel}>ประเมิน</Typography>
                    </Box>

                    {isLazadaCustomer && (
                        <Box sx={MessageStyle.Info.railItem} onClick={fetchLazadaOrders}>
                            <IconButton
                                size="sm"
                                variant={openSection === 'lazadaOrders' ? 'soft' : 'plain'}
                                loading={isLoadingOrders && ordersPlatform === 'Lazada'}
                                disabled={isLoadingOrders}
                                sx={{ color: '#0f146d' }}
                            >
                                <LocalMallIcon fontSize="small" />
                            </IconButton>
                            <Typography sx={MessageStyle.Info.railLabel}>Lazada</Typography>
                        </Box>
                    )}

                    {isShopeeCustomer && (
                        <Box sx={MessageStyle.Info.railItem} onClick={fetchShopeeOrders}>
                            <IconButton
                                size="sm"
                                variant={openSection === 'shopeeOrders' ? 'soft' : 'plain'}
                                loading={isLoadingOrders && ordersPlatform === 'Shopee'}
                                disabled={isLoadingOrders}
                                sx={{ color: '#ff5722' }}
                            >
                                <LocalMallIcon fontSize="small" />
                            </IconButton>
                            <Typography sx={MessageStyle.Info.railLabel}>Shopee</Typography>
                        </Box>
                    )}

                    <Box sx={{ flex: { xs: 0, md: 1 } }} />

                    <Divider sx={{ width: '70%' }} />

                    <Box sx={MessageStyle.Info.railItem} onClick={() => setCollapsed(true)}>
                        <KeyboardDoubleArrowRightIcon fontSize="small" />
                        <Typography sx={MessageStyle.Info.railLabel}>ซ่อน</Typography>
                    </Box>
                </Sheet>
            )}
        </>
    );
}
