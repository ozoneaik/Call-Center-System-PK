import { MessageStyle } from "../../../styles/MessageStyle.js";
import { Box, Sheet, IconButton, Divider } from "@mui/joy";
import Typography from "@mui/joy/Typography";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Notes } from "./Notes.jsx";
import { Feedback } from "./Feedback.jsx";
import AIPanel from "./AIPanel.jsx";
import axiosClient from "../../../Axios.js";
import { sendChatOcAnyApi } from "../../../Api/ChatOcAny.js";
import { getAiLiveSuggestionsHistoryApi } from "../../../Api/AiAssistant.js";
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

const Info = forwardRef(function Info(props, ref) {
    // latestCustomerMessage ไม่ได้ใช้ auto-trigger แล้ว (ปิดไปแล้ว — generate เฉพาะกดปุ่มเท่านั้น) แต่ยังรับ
    // มาจาก props เผื่ออนาคตอยากเปิดกลับมาใช้ ไม่ต้องแก้ MessagePane/main.jsx ที่ยังส่งมาให้อยู่
    const { sender, check, setMsg, activeId } = props;
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
    // true เมื่อโหลดประวัติเก่าของห้องนี้เสร็จแล้ว (หรือไม่มี activeId ให้โหลด) — กันเอฟเฟกต์ข้อความล่าสุด
    // ด้านล่างยิง chat-oc-any ซ้ำข้อความที่เคยวิเคราะห์ไว้แล้วก่อนที่ lastProcessedMessageKeyRef จะทันเซ็ต
    const [historyReady, setHistoryReady] = useState(false);
    const lastProcessedMessageKeyRef = useRef(null);

    // โหลดประวัติการ์ดวิเคราะห์ AI ที่เคยบันทึกไว้ (ai_live_suggestions) ตอนเปิด/รีเฟรชหน้าจอ
    // กันการ์ดที่เคยวิเคราะห์ไว้หายไปหมด เหลือแต่ของข้อความล่าสุด (เดิมเก็บแค่ React state)
    useEffect(() => {
        let isMounted = true;
        // สลับห้องแชท/รีเฟรช ให้เคลียร์ของเก่าก่อน กันการ์ดห้องก่อนหน้าค้างปน
        setLiveSuggestions([]);
        lastProcessedMessageKeyRef.current = null;
        setHistoryReady(false);
        // เคลียร์จุดตัด "Generate AI ล่าสุด" ของห้องก่อนหน้าออกก่อน กันเส้นคั่นค้างผิดห้องระหว่างรอโหลด
        props.onLastGeneratedChange?.(null);

        if (!activeId) {
            setHistoryReady(true);
            return;
        }

        const loadHistory = async () => {
            const { data, status } = await getAiLiveSuggestionsHistoryApi(activeId);
            if (!isMounted) return;
            if (status === 200) {
                const history = data.suggestions || [];
                setLiveSuggestions(history);
                // รายการแรก = ใหม่สุด (backend เรียงใหม่สุดก่อน) — กันวิเคราะห์ข้อความเดิมซ้ำตอนรีเฟรช
                if (history[0]?.message_ref) {
                    lastProcessedMessageKeyRef.current = history[0].message_ref;
                }
                // แจ้ง MessagePane ว่าข้อความไหนคือจุดที่ Generate AI ล่าสุด (ใช้โชว์เส้นคั่นในหน้าแชท)
                props.onLastGeneratedChange?.(history[0]?.message_ref ?? null);
            }
            setHistoryReady(true);
        };

        loadHistory();

        return () => {
            isMounted = false;
        };
    }, [activeId]);

    // สร้างการ์ดวิเคราะห์ AI สำหรับข้อความหนึ่งข้อความ (context = ประวัติแชทย้อนกลับไปถึงข้อความนั้น)
    // เรียกจากปุ่ม "Generate AI" ที่ข้อความใดข้อความหนึ่ง (เปิดผ่าน ref จาก MessagePane/main.jsx — ดู ChatBubble.jsx)
    // opts.force = true ใช้ตอนกดปุ่มเอง ให้ generate ได้แม้ข้อความนี้เคย generate ไปแล้ว (ข้ามการกันซ้ำ)
    const generateForMessage = useCallback(async (message, opts = {}) => {
        if (!message) return;
        const key = message.id ?? message.created_at;
        if (!key) return;
        if (!opts.force && String(key) === String(lastProcessedMessageKeyRef.current)) return;
        lastProcessedMessageKeyRef.current = key;

        const isImage = message.contentType === 'image';
        const questionText = isImage ? '[ลูกค้าส่งรูปภาพ]' : message.content;

        setLiveLoading(true);
        try {
            const data = await sendChatOcAnyApi({
                custId: sender?.custId,
                activeId,
                messageRef: key,
                // จำกัด context ("lines") ย้อนกลับไปแค่ถึงข้อความนี้ — ตอนออโต้ทริกเกอร์ (ข้อความล่าสุด)
                // ผลจะเหมือนไม่จำกัดอยู่แล้วเพราะเป็นข้อความใหม่สุด ณ ตอนนั้นพอดี
                upToMessageId: Number.isFinite(message.id) ? message.id : undefined,
            });
            setLiveSuggestions((prev) => [
                {
                    // ใส่ timestamp กันซ้ำ key เผื่อกด Generate ซ้ำที่ข้อความเดิม (force ข้ามการกันซ้ำด้านบนได้)
                    id: `live-${key}-${Date.now()}`,
                    // อ้างอิงข้อความต้นทาง (id ของ chat_histories หรือ created_at) — ใช้ตอนกด "เพิ่มเข้า KB"
                    // เพื่อให้รู้ว่ารายการที่บันทึกมาจากข้อความไหนในบทสนทนา (ดู AIPanel.jsx@saveToKb)
                    message_ref: String(key),
                    // เวลาที่ AI ตอบกลับมาจริง ๆ (ตอนนี้) ใช้โชว์ในการ์ด — ของที่โหลดจากประวัติจะมี created_at จาก backend มาแล้ว
                    created_at: new Date().toISOString(),
                    // summarytxt = สรุปสั้นๆ ว่าลูกค้าต้องการอะไร, answer = ร่างคำตอบจริงที่ AI แนะนำ
                    question: data.summarytxt || questionText,
                    content: data.answer || data.reply,
                    // source เก็บเป็นแท็กสั้น ๆ (kb/web/ai) เท่านั้น — service อาจส่งค่าอื่น/ยาวเกินคอลัมน์ ให้ปัดเป็น 'ai'
                    source: ['kb', 'web', 'ai'].includes(data.source) ? data.source : 'ai',
                    // resolved_product มีฟิลด์ spec_rows เป็น array ซ้อน array (เช่น [["Rated Power","20V"], ...])
                    // กรองออกก่อน ไม่งั้น `${v}` จะ stringify array ออกมาเป็นข้อความรกๆ ปนอยู่ในการ์ด
                    reference: data.resolved_product
                        ? Object.entries(data.resolved_product)
                            .filter(([, v]) => v !== null && v !== '' && !Array.isArray(v) && typeof v !== 'object')
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' · ')
                        : undefined,
                    // รูปหน้าแคตตาล็อก/โบรชัวร์ (ถ้ามี) — backend เติม URL เต็มให้แล้วใน liveSuggest()
                    attachment_url: data.brochure_page_url || undefined,
                },
                ...prev,
            ]);
            // แจ้ง MessagePane ว่าข้อความนี้คือจุด Generate AI ล่าสุด ให้ไปโชว์เส้นคั่นต่อจากข้อความนี้ในหน้าแชท
            props.onLastGeneratedChange?.(key);
        } catch (err) {
            console.error('เรียก chat-oc-any ไม่สำเร็จ', err);
            throw err;
        } finally {
            setLiveLoading(false);
        }
    }, [sender?.custId, activeId]);

    // เปิดแผง AI (กาง Bar เมนูขวามือ + สลับไปแท็บ 'ai') — ใช้ตอนกดปุ่ม "Generate AI" ที่ข้อความ ให้เห็นผลลัพธ์
    // ทันทีโดยไม่ต้องกดเปิดแผงเอง แม้ตอนนั้นแผงจะปิดอยู่ หรือเปิดค้างที่แท็บอื่น (โน้ต/ประเมิน ฯลฯ)
    const openAiPanel = useCallback(() => {
        setCollapsed(false);
        setOpenSection('ai');
    }, []);

    // เปิดให้ MessagePane/main.jsx เรียก generateForMessage/openAiPanel ได้ตรง ๆ ผ่าน ref (ปุ่ม "Generate AI" ต่อข้อความ)
    useImperativeHandle(ref, () => ({ generateForMessage, openAiPanel }), [generateForMessage, openAiPanel]);

    // ปิดออโต้ทริกเกอร์แล้วตามที่ตกลง — AI จะ generate เฉพาะตอนกดปุ่ม "Generate AI" ที่ข้อความ (ผ่าน ref
    // generateForMessage ด้านบน) เท่านั้น ไม่ยิงอัตโนมัติทันทีที่ลูกค้าทักข้อความใหม่เข้ามาอีกต่อไป
    // (เดิมมี useEffect คอยเช็ค latestCustomerMessage แล้วเรียก generateForMessage ให้เองตรงนี้)

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
});

export default Info;
