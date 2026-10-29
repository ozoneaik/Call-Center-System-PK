import { useEffect, useState } from "react";
import {
    Alert, Box, Button, Chip, CircularProgress, IconButton, Option, Select, Sheet, Stack, Tab, TabList, TabPanel, Table, Tabs,
    Tooltip, Typography,
} from "@mui/joy";
import { ContentCopy, Refresh, Storefront } from "@mui/icons-material";
import { Link } from "react-router-dom";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import { shopAccountsApi, shopInfoApi, shopOrdersApi, shopProductsApi } from "../../Api/ShopData.js";

/** หน้าแสดงออเดอร์/สินค้าของร้าน — ใช้ร่วมกันทุกแพลตฟอร์ม (route: /tiktok-shop, /shopee-shop, /lazada-shop) */
const PLATFORM_LABEL = { tiktok: 'TikTok Shop', shopee: 'Shopee', lazada: 'Lazada' };

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
        {status ? status.replaceAll('_', ' ').toLowerCase() : '-'}
    </Chip>
);

/** รหัสแบบ monospace พร้อมปุ่มคัดลอก */
function IdCell({ id }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
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
                <Button size="sm" variant="plain" sx={{ alignSelf: 'flex-start', px: 0.5, minHeight: 0 }} onClick={() => setExpanded((v) => !v)}>
                    {expanded ? 'ย่อ (Show less)' : `+ อีก ${items.length - MAX_ITEMS} รายการ (Show all)`}
                </Button>
            )}
        </Stack>
    );
}

/** ตารางที่โหลดทีละหน้าด้วย next_page_token */
function usePagedList(fetcher, key) {
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(null);
    const [note, setNote] = useState(null);
    const [nextToken, setNextToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const load = async (accountId, pageToken = null) => {
        if (!accountId) return;
        setLoading(true);
        setError(null);
        const { data, status } = await fetcher(accountId, pageToken);
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

    return { rows, total, note, nextToken, loading, error, load };
}

function TableState({ loading, error, empty, colSpan }) {
    if (loading) return <tr><td colSpan={colSpan} style={{ textAlign: 'center', padding: 32 }}><CircularProgress size="sm" /></td></tr>;
    if (error) return <tr><td colSpan={colSpan}><Alert color="danger" variant="soft">{error}</Alert></td></tr>;
    if (empty) return <tr><td colSpan={colSpan} style={{ textAlign: 'center', padding: 32 }}><Typography level="body-sm" textColor="text.tertiary">ไม่มีข้อมูล (No data)</Typography></td></tr>;
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

    const orders = usePagedList((id, token) => shopOrdersApi(platform, id, token), 'orders');
    const products = usePagedList((id, token) => shopProductsApi(platform, id, token), 'products');

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

    const reload = (id = accountId) => {
        if (!id) return;
        shopInfoApi(platform, id).then(({ data, status }) => setShops(status === 200 ? data.shops : []));
        orders.load(id);
        products.load(id);
    };

    useEffect(() => {
        reload(accountId);
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
                            <ScrollTable list={orders} accountId={accountId}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '17%' }}>Order ID</th>
                                        <th style={{ width: '14%' }}>สถานะ (Status)</th>
                                        <th>สินค้า (Items)</th>
                                        <th style={{ width: '12%', textAlign: 'right' }}>ยอดรวม (Total)</th>
                                        <th style={{ width: '13%', paddingLeft: 24 }}>สั่งเมื่อ (Created)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.rows.map((o) => (
                                        <tr key={o.id}>
                                            <td><IdCell id={o.id} /></td>
                                            <td><StatusChip status={o.status} /></td>
                                            <td><OrderItems items={o.items} /></td>
                                            <td style={{ textAlign: 'right' }}>
                                                <Typography level="body-sm" fontWeight="lg">{formatMoney(o.total_amount, o.currency)}</Typography>
                                            </td>
                                            <td style={{ paddingLeft: 24 }}><DateCell ts={o.create_time} /></td>
                                        </tr>
                                    ))}
                                    <TableState colSpan={5} loading={orders.loading && orders.rows.length === 0}
                                        error={orders.error} empty={!orders.loading && orders.rows.length === 0} />
                                </tbody>
                            </ScrollTable>
                        </TabPanel>

                        <TabPanel value="products" sx={panelSx}>
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
                                        error={products.error} empty={!products.loading && products.rows.length === 0} />
                                </tbody>
                            </ScrollTable>
                        </TabPanel>
                    </Tabs>
                )}
            </Box>
        </Sheet>
    );
}
