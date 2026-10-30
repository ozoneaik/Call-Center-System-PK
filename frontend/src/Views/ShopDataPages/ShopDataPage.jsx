import { useEffect, useRef, useState } from "react";
import {
    Alert, AspectRatio, Box, Button, Chip, CircularProgress, DialogContent, DialogTitle, Divider, Drawer, IconButton, Input, ModalClose, Option, Select, Sheet, Stack, Tab, TabList, TabPanel, Table, Tabs,
    Tooltip, Typography,
} from "@mui/joy";
import { ChatBubbleOutline, Close, ContentCopy, ImageNotSupported, Refresh, Search, Storefront } from "@mui/icons-material";
import { Link } from "react-router-dom";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import { shopAccountsApi, shopInfoApi, shopOrderDetailApi, shopOrdersApi, shopProductsApi } from "../../Api/ShopData.js";

/** หน้าแสดงออเดอร์/สินค้าของร้าน — ใช้ร่วมกันทุกแพลตฟอร์ม (route: /tiktok-shop, /shopee-shop, /lazada-shop) */
const PLATFORM_LABEL = { tiktok: 'TikTok Shop', shopee: 'Shopee', lazada: 'Lazada' };

/** สถานะที่ใช้กรองออเดอร์ — ค่าตรงตามที่ API ของแต่ละแพลตฟอร์มรับ */
const ORDER_STATUSES = {
    tiktok: ['UNPAID', 'ON_HOLD', 'AWAITING_SHIPMENT', 'PARTIALLY_SHIPPING', 'AWAITING_COLLECTION', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED'],
    shopee: ['UNPAID', 'READY_TO_SHIP', 'PROCESSED', 'SHIPPED', 'TO_CONFIRM_RECEIVE', 'COMPLETED', 'IN_CANCEL', 'CANCELLED', 'TO_RETURN'],
    lazada: ['unpaid', 'pending', 'topack', 'ready_to_ship', 'shipped', 'delivered', 'canceled', 'returned', 'failed'],
};

/** สิ่งที่ API ของแต่ละแพลตฟอร์มให้ค้นสินค้าได้ (TikTok / Lazada ค้นด้วยชื่อสินค้าไม่ได้) */
const PRODUCT_SEARCH_HINT = {
    tiktok: 'ค้นหารหัสสินค้า / SKU (Product ID / SKU)',
    shopee: 'ค้นหาชื่อสินค้า / รหัสสินค้า (Name / Product ID)',
    lazada: 'ค้นหารหัสสินค้า / SKU (Product ID / SKU)',
};

/** แพลตฟอร์มที่ backend ส่งข้อมูลผู้ซื้อ + การเคยแชทเข้ามา (buyer.chat) มากับออเดอร์ */
const BUYER_CHAT_PLATFORMS = ['shopee'];

const statusLabel = (status) => (status ? status.replaceAll('_', ' ').toLowerCase() : '-');

/** แสดงสินค้าในออเดอร์ได้สูงสุดเท่านี้ ที่เหลือพับไว้ */
const MAX_ITEMS = 2;

const STATUS_COLOR = {
    // TikTok
    UNPAID: 'neutral', ON_HOLD: 'neutral', AWAITING_SHIPMENT: 'warning', PARTIALLY_SHIPPING: 'warning',
    AWAITING_COLLECTION: 'warning', IN_TRANSIT: 'primary', DELIVERED: 'success', COMPLETED: 'success', CANCELLED: 'danger',
    ACTIVATE: 'success', DRAFT: 'neutral', PENDING: 'warning', FAILED: 'danger',
    // Shopee
    READY_TO_SHIP: 'warning', PROCESSED: 'warning', SHIPPED: 'primary', TO_CONFIRM_RECEIVE: 'primary', TO_RETURN: 'danger',
    IN_CANCEL: 'danger', NORMAL: 'success', UNLIST: 'neutral',
    // Lazada
    READY_TO_SHIP_PENDING: 'warning', CANCELED: 'danger', RETURNED: 'danger', ACTIVE: 'success', INACTIVE: 'neutral',
};

// เวลาจากแพลตฟอร์มเป็น unix timestamp (วินาที)
function DateCell({ ts }) {
    if (!ts) return <Typography level="body-sm">-</Typography>;
    const d = new Date(ts * 1000);
    return (
        <>
            <Typography level="body-sm">{d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</Typography>
            <Typography level="body-xs" textColor="text.tertiary">{d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</Typography>
        </>
    );
}

const formatMoney = (amount, currency) =>
    amount === null || amount === undefined || amount === '' ? '-' : `${Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ${currency ?? ''}`.trim();

const StatusChip = ({ status }) => (
    <Chip size="sm" variant="soft" color={STATUS_COLOR[status] ?? 'neutral'} sx={{ textTransform: 'capitalize' }}>
        {statusLabel(status)}
    </Chip>
);

/** รหัสแบบ monospace พร้อมปุ่มคัดลอก */
function IdCell({ id }) {
    const [copied, setCopied] = useState(false);
    const copy = (e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(id).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        });
    };
    return (
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
            <Typography level="body-sm" fontFamily="monospace" fontWeight="md" noWrap>{id}</Typography>
            <Tooltip title={copied ? 'คัดลอกแล้ว' : 'คัดลอก'} size="sm" variant="soft">
                <IconButton size="sm" variant="plain" color="neutral" onClick={copy} sx={{ '--IconButton-size': '24px' }}>
                    <ContentCopy sx={{ fontSize: 14 }} />
                </IconButton>
            </Tooltip>
        </Stack>
    );
}

/** ข้อความยาวตัดเหลือ n บรรทัด แสดงเต็มใน tooltip */
const Clamp = ({ lines = 1, children, ...props }) => (
    <Typography
        title={typeof children === 'string' ? children : undefined}
        sx={{ display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}
        {...props}
    >
        {children}
    </Typography>
);

/** ผู้ซื้อเคยแชทเข้ามาในระบบหรือไม่ — เคยแชทกดเปิดประวัติแชทได้ */
function ChatChip({ chat }) {
    if (!chat) return <Chip size="sm" variant="soft" color="neutral">ยังไม่เคยแชท (No chat)</Chip>;
    return (
        <Tooltip title={`ดูประวัติแชท: ${chat.name}`} size="sm" variant="soft">
            <Chip size="sm" variant="soft" color="success" startDecorator={<ChatBubbleOutline sx={{ fontSize: 14 }} />}
                slotProps={{ action: { component: Link, to: `/chatHistory/detail/${chat.custId}`, onClick: (e) => e.stopPropagation() } }}>
                เคยแชท (Chatted)
            </Chip>
        </Tooltip>
    );
}

function BuyerCell({ buyer }) {
    if (!buyer?.id) return <Typography level="body-sm">-</Typography>;
    return (
        <Stack spacing={0.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
            <Clamp level="body-sm">{buyer.name || buyer.id}</Clamp>
            <ChatChip chat={buyer.chat} />
        </Stack>
    );
}

function OrderItems({ items }) {
    const [expanded, setExpanded] = useState(false);
    const shown = expanded ? items : items.slice(0, MAX_ITEMS);
    return (
        <Stack spacing={0.75}>
            {shown.map((it, i) => (
                <Box key={`${it.product_id}-${it.sku_name}-${i}`} sx={{ minWidth: 0 }}>
                    <Clamp level="body-sm">{it.product_name}</Clamp>
                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                        {it.sku_name && (
                            <Chip size="sm" variant="outlined" color="neutral" sx={{ maxWidth: 260 }}>
                                <Typography level="body-xs" noWrap>{it.sku_name}</Typography>
                            </Chip>
                        )}
                        {it.quantity ? <Typography level="body-xs" fontWeight="lg">× {it.quantity}</Typography> : null}
                        {it.product_id && (
                            <Typography level="body-xs" textColor="text.tertiary" fontFamily="monospace">ID {it.product_id}</Typography>
                        )}
                    </Stack>
                </Box>
            ))}
            {items.length > MAX_ITEMS && (
                <Button size="sm" variant="plain" sx={{ alignSelf: 'flex-start', px: 0.5, minHeight: 0 }} onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}>
                    {expanded ? 'ย่อ (Show less)' : `+ อีก ${items.length - MAX_ITEMS} รายการ (Show all)`}
                </Button>
            )}
        </Stack>
    );
}

/**
 * ตารางที่โหลดทีละหน้าด้วย next_page_token
 * จำตัวกรองล่าสุดไว้ — โหลดเพิ่ม/รีเฟรชใช้ตัวกรองเดิม, ส่ง filters มาใหม่เมื่อกดค้นหา
 */
function usePagedList(fetcher, key) {
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(null);
    const [note, setNote] = useState(null);
    const [nextToken, setNextToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({});
    const filtersRef = useRef({});
    const requestId = useRef(0);

    const load = async (accountId, pageToken = null, nextFilters = filtersRef.current) => {
        if (!accountId) return;
        filtersRef.current = nextFilters;
        setFilters(nextFilters);
        // ค้นหาซ้อนกันเร็วๆ — ใช้เฉพาะผลของคำขอล่าสุด
        const id = ++requestId.current;
        setLoading(true);
        setError(null);
        if (!pageToken) setRows([]);
        const { data, status } = await fetcher(accountId, pageToken, nextFilters);
        if (id !== requestId.current) return;
        if (status === 200) {
            setRows((prev) => (pageToken ? [...prev, ...data[key]] : data[key]));
            setTotal(data.total_count ?? null);
            setNote(data.note ?? null);
            setNextToken(data.next_page_token || null);
        } else {
            if (!pageToken) setRows([]);
            setError(data.detail || data.message);
        }
        setLoading(false);
    };

    return { rows, total, note, nextToken, loading, error, filters, load };
}

function TableState({ loading, error, empty, colSpan }) {
    if (loading) return <tr><td colSpan={colSpan} style={{ textAlign: 'center', padding: 32 }}><CircularProgress size="sm" /></td></tr>;
    if (error) return <tr><td colSpan={colSpan}><Alert color="danger" variant="soft">{error}</Alert></td></tr>;
    if (empty) return <tr><td colSpan={colSpan} style={{ textAlign: 'center', padding: 32 }}><Typography level="body-sm" textColor="text.tertiary">{empty === 'search' ? 'ไม่พบข้อมูลที่ค้นหา (No results)' : 'ไม่มีข้อมูล (No data)'}</Typography></td></tr>;
    return null;
}

/** กรอบตารางที่เลื่อนได้ในตัว (หัวตารางติดด้านบน) + ปุ่มโหลดเพิ่มท้ายตาราง */
function ScrollTable({ list, accountId, children }) {
    return (
        <Sheet variant="outlined" sx={{ flex: 1, minHeight: 0, overflow: 'auto', borderRadius: 'sm' }}>
            <Table stickyHeader hoverRow size="sm" sx={{
                ...ChatPageStyle.Table,
                tableLayout: 'fixed',
                '& td': { verticalAlign: 'top', py: 1.25 },
                '& th': { py: 1 },
            }}>
                {children}
            </Table>
            {list.nextToken && list.rows.length > 0 && (
                <Box sx={{ textAlign: 'center', py: 1.5 }}>
                    <Button size="sm" variant="outlined" loading={list.loading} onClick={() => list.load(accountId, list.nextToken)}>
                        โหลดเพิ่ม (Load more)
                    </Button>
                </Box>
            )}
        </Sheet>
    );
}

const fullDateTime = (ts) => new Date(ts * 1000).toLocaleString('th-TH', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

function DetailSection({ title, children }) {
    return (
        <Box>
            <Typography level="title-sm" sx={{ mb: 1 }}>{title}</Typography>
            {children}
        </Box>
    );
}

/** แถว label : value — ไม่แสดงถ้าไม่มีค่า */
function InfoRow({ label, children }) {
    if (children === null || children === undefined || children === '') return null;
    return (
        <Stack direction="row" spacing={2} sx={{ py: 0.4 }}>
            <Typography level="body-sm" textColor="text.tertiary" sx={{ width: 150, flexShrink: 0 }}>{label}</Typography>
            <Typography component="div" level="body-sm" sx={{ minWidth: 0, wordBreak: 'break-word' }}>{children}</Typography>
        </Stack>
    );
}

function DetailItem({ item, currency }) {
    const discounted = item.original_price && Number(item.original_price) !== Number(item.unit_price);
    return (
        <Stack direction="row" spacing={1.5}>
            <AspectRatio ratio="1" sx={{ width: 56, flexShrink: 0, borderRadius: 'sm' }}>
                {item.image
                    ? <img src={item.image} alt="" loading="lazy" />
                    : <div><ImageNotSupported sx={{ color: 'text.tertiary' }} /></div>}
            </AspectRatio>
            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Clamp lines={2} level="body-sm">{item.name}</Clamp>
                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.25 }}>
                    {item.variant && <Chip size="sm" variant="outlined" color="neutral">{item.variant}</Chip>}
                    {item.sku && <Typography level="body-xs" textColor="text.tertiary" fontFamily="monospace">SKU {item.sku}</Typography>}
                </Stack>
            </Box>
            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                <Typography level="body-sm" fontWeight="lg">{formatMoney(item.unit_price, currency)}</Typography>
                {discounted && (
                    <Typography level="body-xs" textColor="text.tertiary" sx={{ textDecoration: 'line-through' }}>
                        {formatMoney(item.original_price)}
                    </Typography>
                )}
                <Typography level="body-xs" fontWeight="lg">× {item.quantity}</Typography>
            </Box>
        </Stack>
    );
}

/** รายละเอียดออเดอร์ — โหลดเมื่อเปิด (orderId ไม่ว่าง) */
function OrderDetailDrawer({ platform, accountId, orderId, onClose }) {
    const [order, setOrder] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!orderId) return;
        let active = true;
        setOrder(null);
        setError(null);
        shopOrderDetailApi(platform, accountId, orderId).then(({ data, status }) => {
            if (!active) return;
            if (status === 200) setOrder(data.order);
            else setError(data.detail || data.message);
        });
        return () => { active = false; };
    }, [platform, accountId, orderId]);

    const amounts = (order?.amounts ?? []).filter((a) => a.total || Number(a.amount) !== 0);
    const firstTotal = amounts.findIndex((a) => a.total);

    return (
        <Drawer anchor="right" size="md" open={Boolean(orderId)} onClose={onClose}
            slotProps={{ content: { sx: { width: { xs: '100%', sm: 520 } } } }}>
            <ModalClose />
            <DialogTitle sx={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                <Typography level="body-xs" textColor="text.tertiary">รายละเอียดออเดอร์ (Order detail)</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                    {orderId && <IdCell id={orderId} />}
                    {order && <StatusChip status={order.status} />}
                </Stack>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 2 }}>
                {error ? (
                    <Alert color="danger" variant="soft">{error}</Alert>
                ) : !order ? (
                    <CircularProgress size="sm" sx={{ alignSelf: 'center', mt: 4 }} />
                ) : (
                    <Stack spacing={2.5}>
                        {order.cancel_reason && (
                            <Alert color="danger" variant="soft" size="sm">เหตุผลที่ยกเลิก (Cancel reason): {order.cancel_reason}</Alert>
                        )}

                        <DetailSection title="ข้อมูลทั่วไป (General)">
                            <InfoRow label="ชำระเงินด้วย (Payment)">{order.payment_method}</InfoRow>
                            {order.times.filter((t) => t.ts).map((t) => (
                                <InfoRow key={t.label} label={t.label}>{fullDateTime(t.ts)} น.</InfoRow>
                            ))}
                        </DetailSection>

                        <DetailSection title={`สินค้า (Items) · ${order.items.reduce((n, it) => n + Number(it.quantity || 0), 0)} ชิ้น`}>
                            <Stack spacing={1.5} divider={<Divider />}>
                                {order.items.map((it, i) => <DetailItem key={`${it.product_id}-${it.sku}-${i}`} item={it} currency={order.currency} />)}
                            </Stack>
                        </DetailSection>

                        <DetailSection title="ยอดเงิน (Amount)">
                            <Sheet variant="soft" sx={{ borderRadius: 'sm', px: 1.5, py: 1 }}>
                                {amounts.map((a, i) => (
                                    <Box key={a.label}>
                                        {i === firstTotal && i > 0 && <Divider sx={{ my: 0.75 }} />}
                                        <Stack direction="row" justifyContent="space-between" sx={{ py: 0.25 }}>
                                            <Typography level="body-sm" fontWeight={a.total ? 'lg' : undefined}
                                                textColor={a.total ? 'text.primary' : 'text.secondary'}>{a.label}</Typography>
                                            <Typography level="body-sm" fontWeight={a.total ? 'lg' : undefined}
                                                color={Number(a.amount) < 0 ? 'danger' : undefined}>
                                                {formatMoney(a.amount, order.currency)}
                                            </Typography>
                                        </Stack>
                                    </Box>
                                ))}
                            </Sheet>
                        </DetailSection>

                        <DetailSection title="การจัดส่ง (Shipping)">
                            <InfoRow label="ขนส่ง (Carrier)">{order.shipping.carrier || '-'}</InfoRow>
                            <InfoRow label="เลขพัสดุ (Tracking)">
                                {order.shipping.tracking.length ? order.shipping.tracking.map((t) => <IdCell key={t} id={t} />) : '-'}
                            </InfoRow>
                        </DetailSection>

                        <DetailSection title="ผู้ซื้อและผู้รับ (Buyer & Recipient)">
                            <InfoRow label="ผู้ซื้อ (Buyer)">{order.buyer.name}</InfoRow>
                            {'chat' in order.buyer && <InfoRow label="แชท (Chat)"><ChatChip chat={order.buyer.chat} /></InfoRow>}
                            <InfoRow label="ข้อความจากผู้ซื้อ (Note)">{order.buyer.note}</InfoRow>
                            <InfoRow label="ผู้รับ (Name)">{order.recipient.name}</InfoRow>
                            <InfoRow label="เบอร์โทร (Phone)">{order.recipient.phone}</InfoRow>
                            <InfoRow label="ที่อยู่ (Address)">{order.recipient.address}</InfoRow>
                            <Typography level="body-xs" textColor="text.tertiary" sx={{ mt: 0.5 }}>
                                * ข้อมูลที่เป็น **** ถูกปิดโดยแพลตฟอร์ม (Masked by platform)
                            </Typography>
                        </DetailSection>
                    </Stack>
                )}
            </DialogContent>
        </Drawer>
    );
}

/** แถบค้นหาเหนือตาราง — กด Enter หรือปุ่มค้นหา, ล้างแล้วกลับไปแสดงทั้งหมด
 *  chatFilter: แสดงตัวกรองผู้ซื้อเคยแชท (เฉพาะแพลตฟอร์มใน BUYER_CHAT_PLATFORMS) */
function SearchBar({ placeholder, statuses, chatFilter, onSearch, active }) {
    const [q, setQ] = useState('');
    const [status, setStatus] = useState(null);
    const [chat, setChat] = useState(null);

    const submit = (next = {}) => {
        const f = { q, status, chat, ...next };
        onSearch({ q: f.q.trim(), status: f.status, chat: f.chat });
    };
    const clear = () => {
        setQ('');
        setStatus(null);
        setChat(null);
        submit({ q: '', status: null, chat: null });
    };

    return (
        <Stack component="form" direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1 }}
            onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <Input size="sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder}
                startDecorator={<Search fontSize="small" />} sx={{ flex: 1, maxWidth: { sm: 420 } }}
                endDecorator={q && (
                    <IconButton size="sm" variant="plain" onClick={() => setQ('')} sx={{ '--IconButton-size': '24px' }}>
                        <Close sx={{ fontSize: 16 }} />
                    </IconButton>
                )} />
            {statuses && (
                // เลือกสถานะแล้วค้นทันที
                <Select size="sm" value={status} placeholder="ทุกสถานะ (All status)" sx={{ minWidth: 200 }}
                    onChange={(_, v) => { setStatus(v); submit({ status: v }); }}>
                    <Option value={null}>ทุกสถานะ (All status)</Option>
                    {statuses.map((s) => (
                        <Option key={s} value={s} sx={{ textTransform: 'capitalize' }}>{statusLabel(s)}</Option>
                    ))}
                </Select>
            )}
            {chatFilter && (
                <Select size="sm" value={chat} placeholder="ผู้ซื้อทั้งหมด (All buyers)" sx={{ minWidth: 200 }}
                    onChange={(_, v) => { setChat(v); submit({ chat: v }); }}>
                    <Option value={null}>ผู้ซื้อทั้งหมด (All buyers)</Option>
                    <Option value="yes">เคยแชท (Chatted)</Option>
                    <Option value="no">ยังไม่เคยแชท (No chat)</Option>
                </Select>
            )}
            <Button size="sm" type="submit" startDecorator={<Search fontSize="small" />}>ค้นหา (Search)</Button>
            {active && <Button size="sm" variant="plain" color="neutral" onClick={clear}>ล้าง (Clear)</Button>}
        </Stack>
    );
}

const hasFilters = (filters) => Boolean(filters.q || filters.status || filters.chat);

const countChip = (list) => (
    <Chip size="sm" variant="soft" color="primary">
        {list.total ?? list.rows.length}{list.total === null && list.nextToken ? '+' : ''}
    </Chip>
);

const panelSx = { p: 0, pt: 1, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', '&[hidden]': { display: 'none' } };

export default function ShopDataPage({ platform }) {
    const label = PLATFORM_LABEL[platform];
    const [accounts, setAccounts] = useState([]);
    const [accountId, setAccountId] = useState(null);
    const [shops, setShops] = useState([]);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [tab, setTab] = useState('orders');
    const [detailId, setDetailId] = useState(null);
    const showBuyer = BUYER_CHAT_PLATFORMS.includes(platform);

    const orders = usePagedList((id, token, filters) => shopOrdersApi(platform, id, token, filters), 'orders');
    const products = usePagedList((id, token, filters) => shopProductsApi(platform, id, token, filters), 'products');

    useEffect(() => {
        (async () => {
            const { data, status } = await shopAccountsApi(platform);
            if (status === 200) {
                setAccounts(data.accounts);
                if (data.accounts.length > 0) setAccountId(data.accounts[data.accounts.length - 1].id);
            }
            setLoadingAccounts(false);
        })();
    }, [platform]);

    /** resetFilters: เปลี่ยนร้านแล้วล้างคำค้น, ปุ่มรีเฟรชใช้คำค้นเดิม */
    const reload = (id = accountId, resetFilters = false) => {
        if (!id) return;
        shopInfoApi(platform, id).then(({ data, status }) => setShops(status === 200 ? data.shops : []));
        orders.load(id, null, resetFilters ? {} : undefined);
        products.load(id, null, resetFilters ? {} : undefined);
    };

    useEffect(() => {
        reload(accountId, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountId]);

    return (
        <Sheet sx={ChatPageStyle.Layout}>
            {/* MainContent สูง 100dvh — ให้ตารางยืดเต็มพื้นที่ที่เหลือและเลื่อนในตัว หน้าจะได้ไม่ล้นจนแถบเมนูขาด */}
            <Box component="main" sx={{ ...ChatPageStyle.MainContent, overflow: 'hidden' }}>
                <BreadcrumbsComponent list={[{ name: label }, { name: 'ออเดอร์และสินค้า' }]} />

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} justifyContent="space-between">
                    <Box>
                        <Typography level="h3" component="h1">{label}</Typography>
                        <Typography level="body-sm" textColor="text.tertiary">ออเดอร์และสินค้าของร้าน (Orders & Products)</Typography>
                    </Box>
                    {accounts.length > 0 && (
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Select size="sm" value={accountId} onChange={(_, v) => setAccountId(v)} sx={{ minWidth: 240 }}
                                startDecorator={<Storefront fontSize="small" />}>
                                {accounts.map((a) => (
                                    <Option key={a.id} value={a.id}>{a.tiktok_seller_name || a.description || `#${a.id}`}</Option>
                                ))}
                            </Select>
                            <Tooltip title="รีเฟรช (Refresh)" size="sm" variant="soft">
                                <IconButton size="sm" variant="outlined" onClick={() => reload()}
                                    loading={orders.loading && products.loading}>
                                    <Refresh />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    )}
                </Stack>

                {shops.map((s) => (
                    <Typography key={s.id} level="body-xs" textColor="text.secondary">
                        Shop: <b>{s.name}</b> · ID <span style={{ fontFamily: 'monospace' }}>{s.id}</span>{s.region ? ` · ${s.region}` : ''}
                    </Typography>
                ))}

                {loadingAccounts ? (
                    <CircularProgress sx={{ alignSelf: 'center', mt: 4 }} />
                ) : accounts.length === 0 ? (
                    <Alert color="warning" variant="soft">
                        ยังไม่มีร้าน {label} ที่เชื่อมต่อ (No {label} connected) — เชื่อมร้านได้ที่เมนู&nbsp;
                        <Link to="/TokenManager">Auto Access Token</Link>
                    </Alert>
                ) : (
                    <Tabs value={tab} onChange={(_, v) => setTab(v)}
                        sx={{ bgcolor: 'transparent', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <TabList size="sm">
                            <Tab value="orders" indicatorInset>ออเดอร์ (Orders) {countChip(orders)}</Tab>
                            <Tab value="products" indicatorInset>สินค้า (Products) {countChip(products)}</Tab>
                            {tab === 'orders' && orders.note && (
                                <Typography level="body-xs" textColor="text.tertiary" sx={{ ml: 'auto', alignSelf: 'center', pr: 1 }}>
                                    {orders.note}
                                </Typography>
                            )}
                        </TabList>

                        <TabPanel value="orders" sx={panelSx}>
                            <SearchBar key={accountId} placeholder="ค้นหาเลขออเดอร์ (Order ID)" statuses={ORDER_STATUSES[platform]} chatFilter={showBuyer}
                                active={hasFilters(orders.filters)} onSearch={(f) => orders.load(accountId, null, f)} />
                            <ScrollTable list={orders} accountId={accountId}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '17%' }}>Order ID</th>
                                        <th style={{ width: '14%' }}>สถานะ (Status)</th>
                                        {showBuyer && <th style={{ width: '16%' }}>ผู้ซื้อ (Buyer)</th>}
                                        <th>สินค้า (Items)</th>
                                        <th style={{ width: '12%', textAlign: 'right' }}>ยอดรวม (Total)</th>
                                        <th style={{ width: '13%', paddingLeft: 24 }}>สั่งเมื่อ (Created)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.rows.map((o) => (
                                        <tr key={o.id} onClick={() => setDetailId(o.id)} style={{ cursor: 'pointer' }} title="ดูรายละเอียด (View detail)">
                                            <td><IdCell id={o.id} /></td>
                                            <td><StatusChip status={o.status} /></td>
                                            {showBuyer && <td><BuyerCell buyer={o.buyer} /></td>}
                                            <td><OrderItems items={o.items} /></td>
                                            <td style={{ textAlign: 'right' }}>
                                                <Typography level="body-sm" fontWeight="lg">{formatMoney(o.total_amount, o.currency)}</Typography>
                                            </td>
                                            <td style={{ paddingLeft: 24 }}><DateCell ts={o.create_time} /></td>
                                        </tr>
                                    ))}
                                    <TableState colSpan={showBuyer ? 6 : 5} loading={orders.loading && orders.rows.length === 0}
                                        error={orders.error} empty={!orders.loading && orders.rows.length === 0 && (hasFilters(orders.filters) ? 'search' : true)} />
                                </tbody>
                            </ScrollTable>
                        </TabPanel>

                        <TabPanel value="products" sx={panelSx}>
                            <SearchBar key={accountId} placeholder={PRODUCT_SEARCH_HINT[platform]}
                                active={hasFilters(products.filters)} onSearch={(f) => products.load(accountId, null, f)} />
                            <ScrollTable list={products} accountId={accountId}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '17%' }}>Product ID</th>
                                        <th>ชื่อสินค้า (Title)</th>
                                        <th style={{ width: '11%' }}>สถานะ (Status)</th>
                                        <th style={{ width: '14%', textAlign: 'right' }}>ราคา (Price)</th>
                                        <th style={{ width: '10%', textAlign: 'right' }}>SKU</th>
                                        <th style={{ width: '8%', textAlign: 'right' }}>สต็อก (Stock)</th>
                                        <th style={{ width: '13%', paddingLeft: 24 }}>อัปเดต (Updated)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.rows.map((p) => (
                                        <tr key={p.id}>
                                            <td><IdCell id={p.id} /></td>
                                            <td><Clamp lines={2} level="body-sm">{p.title}</Clamp></td>
                                            <td><StatusChip status={p.status} /></td>
                                            <td style={{ textAlign: 'right' }}>
                                                <Typography level="body-sm" fontWeight="lg">
                                                    {p.min_price === p.max_price
                                                        ? formatMoney(p.min_price, p.currency)
                                                        : `${formatMoney(p.min_price)} – ${formatMoney(p.max_price, p.currency)}`}
                                                </Typography>
                                            </td>
                                            <td style={{ textAlign: 'right' }}><Typography level="body-sm">{p.sku_count}</Typography></td>
                                            <td style={{ textAlign: 'right' }}><Typography level="body-sm">{p.stock ?? '-'}</Typography></td>
                                            <td style={{ paddingLeft: 24 }}><DateCell ts={p.update_time || p.create_time} /></td>
                                        </tr>
                                    ))}
                                    <TableState colSpan={7} loading={products.loading && products.rows.length === 0}
                                        error={products.error} empty={!products.loading && products.rows.length === 0 && (hasFilters(products.filters) ? 'search' : true)} />
                                </tbody>
                            </ScrollTable>
                        </TabPanel>
                    </Tabs>
                )}
            </Box>
            <OrderDetailDrawer platform={platform} accountId={accountId} orderId={detailId} onClose={() => setDetailId(null)} />
        </Sheet>
    );
}
