import { useEffect, useState } from "react";
import {
    Alert, Box, Button, Chip, CircularProgress, Option, Select, Sheet, Stack, Tab, TabList, TabPanel, Table, Tabs, Typography,
} from "@mui/joy";
import { Refresh, Storefront } from "@mui/icons-material";
import { Link } from "react-router-dom";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import { convertFullDate } from "../../Components/Options.jsx";
import { tiktokAccountsApi, tiktokOrdersApi, tiktokProductsApi, tiktokShopsApi } from "../../Api/TikTokShop.js";

const BreadcrumbsPath = [{ name: 'TikTok Shop' }, { name: 'ออเดอร์และสินค้า' }];

// เวลาจาก TikTok เป็น unix timestamp (วินาที)
const fromUnix = (ts) => (ts ? convertFullDate(ts * 1000) : '-');

const formatMoney = (amount, currency) =>
    amount === null || amount === undefined || amount === '' ? '-' : `${Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ${currency ?? ''}`;

const ORDER_STATUS_COLOR = {
    UNPAID: 'neutral', ON_HOLD: 'neutral', AWAITING_SHIPMENT: 'warning', PARTIALLY_SHIPPING: 'warning',
    AWAITING_COLLECTION: 'warning', IN_TRANSIT: 'primary', DELIVERED: 'success', COMPLETED: 'success', CANCELLED: 'danger',
};
const PRODUCT_STATUS_COLOR = { ACTIVATE: 'success', DRAFT: 'neutral', PENDING: 'warning', FAILED: 'danger' };

/** ตารางที่โหลดทีละหน้าด้วย next_page_token */
function usePagedList(fetcher, key) {
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
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
            setTotal(data.total_count ?? 0);
            setNextToken(data.next_page_token || null);
        } else {
            if (!pageToken) setRows([]);
            setError(data.detail || data.message);
        }
        setLoading(false);
    };

    return { rows, total, nextToken, loading, error, load };
}

function TableState({ loading, error, empty, colSpan }) {
    if (loading) return <tr><td colSpan={colSpan} style={{ textAlign: 'center' }}><CircularProgress size="sm" /></td></tr>;
    if (error) return <tr><td colSpan={colSpan}><Alert color="danger" variant="soft">{error}</Alert></td></tr>;
    if (empty) return <tr><td colSpan={colSpan} style={{ textAlign: 'center' }}><Chip color="neutral">ไม่มีข้อมูล (No data)</Chip></td></tr>;
    return null;
}

function LoadMore({ list, accountId }) {
    if (!list.nextToken || list.rows.length === 0) return null;
    return (
        <Box sx={{ textAlign: 'center', p: 1 }}>
            <Button size="sm" variant="outlined" loading={list.loading} onClick={() => list.load(accountId, list.nextToken)}>
                โหลดเพิ่ม (Load more)
            </Button>
        </Box>
    );
}

export default function TikTokShopPage() {
    const [accounts, setAccounts] = useState([]);
    const [accountId, setAccountId] = useState(null);
    const [shops, setShops] = useState([]);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [tab, setTab] = useState('orders');

    const orders = usePagedList(tiktokOrdersApi, 'orders');
    const products = usePagedList(tiktokProductsApi, 'products');

    useEffect(() => {
        (async () => {
            const { data, status } = await tiktokAccountsApi();
            if (status === 200) {
                setAccounts(data.accounts);
                if (data.accounts.length > 0) setAccountId(data.accounts[data.accounts.length - 1].id);
            }
            setLoadingAccounts(false);
        })();
    }, []);

    const reload = (id = accountId) => {
        if (!id) return;
        tiktokShopsApi(id).then(({ data, status }) => setShops(status === 200 ? data.shops : []));
        orders.load(id);
        products.load(id);
    };

    useEffect(() => {
        reload(accountId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountId]);

    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                </Box>
                <Box sx={ChatPageStyle.BoxTable}>
                    <Typography level="h2" component="h1">TikTok Shop — Orders & Products</Typography>
                </Box>

                {loadingAccounts ? (
                    <CircularProgress />
                ) : accounts.length === 0 ? (
                    <Alert color="warning" variant="soft">
                        ยังไม่มีร้าน TikTok ที่เชื่อมต่อ (No TikTok Shop connected) — เชื่อมร้านได้ที่เมนู&nbsp;
                        <Link to="/TokenManager">Auto Access Token</Link>
                    </Alert>
                ) : (
                    <>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} mb={1.5} flexWrap="wrap" useFlexGap>
                            <Select size="sm" value={accountId} onChange={(_, v) => setAccountId(v)} sx={{ minWidth: 260 }}
                                startDecorator={<Storefront />}>
                                {accounts.map((a) => (
                                    <Option key={a.id} value={a.id}>
                                        {a.tiktok_seller_name || a.description || `TikTok #${a.id}`}{a.tiktok_region ? ` (${a.tiktok_region})` : ''}
                                    </Option>
                                ))}
                            </Select>
                            {shops.map((s) => (
                                <Chip key={s.id} size="sm" variant="soft" color="primary">
                                    Shop: {s.name} · ID {s.id} · {s.region}
                                </Chip>
                            ))}
                            <Button size="sm" variant="plain" startDecorator={<Refresh />} onClick={() => reload()}>
                                รีเฟรช (Refresh)
                            </Button>
                        </Stack>

                        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ bgcolor: 'transparent' }}>
                            <TabList sx={{ mb: 1 }}>
                                <Tab value="orders">ออเดอร์ (Orders) <Chip size="sm" variant="soft">{orders.total}</Chip></Tab>
                                <Tab value="products">สินค้า (Products) <Chip size="sm" variant="soft">{products.total}</Chip></Tab>
                            </TabList>

                            <TabPanel value="orders" sx={{ p: 0 }}>
                                <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
                                    <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
                                        <thead>
                                            <tr>
                                                <th style={{ width: 200 }}>Order ID</th>
                                                <th style={{ width: 170 }}>สถานะ (Status)</th>
                                                <th style={{ width: 360 }}>สินค้า (Items)</th>
                                                <th style={{ width: 140 }}>ยอดรวม (Total)</th>
                                                <th style={{ width: 170 }}>สั่งเมื่อ (Created)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.rows.map((o) => (
                                                <tr key={o.id}>
                                                    <td><Typography level="body-sm" fontFamily="monospace">{o.id}</Typography></td>
                                                    <td><Chip size="sm" color={ORDER_STATUS_COLOR[o.status] ?? 'neutral'}>{o.status}</Chip></td>
                                                    <td>
                                                        {o.items.map((it) => (
                                                            <Typography key={`${it.product_id}-${it.sku_name}`} level="body-xs">
                                                                {it.product_name}{it.sku_name ? ` (${it.sku_name})` : ''} × {it.quantity}
                                                                <Typography level="body-xs" color="neutral" fontFamily="monospace"> · Product ID {it.product_id}</Typography>
                                                            </Typography>
                                                        ))}
                                                    </td>
                                                    <td>{formatMoney(o.total_amount, o.currency)}</td>
                                                    <td>{fromUnix(o.create_time)}</td>
                                                </tr>
                                            ))}
                                            <TableState colSpan={5} loading={orders.loading && orders.rows.length === 0}
                                                error={orders.error} empty={!orders.loading && orders.rows.length === 0} />
                                        </tbody>
                                    </Table>
                                    <LoadMore list={orders} accountId={accountId} />
                                </Sheet>
                            </TabPanel>

                            <TabPanel value="products" sx={{ p: 0 }}>
                                <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
                                    <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
                                        <thead>
                                            <tr>
                                                <th style={{ width: 200 }}>Product ID</th>
                                                <th style={{ width: 320 }}>ชื่อสินค้า (Title)</th>
                                                <th style={{ width: 130 }}>สถานะ (Status)</th>
                                                <th style={{ width: 160 }}>ราคา (Price)</th>
                                                <th style={{ width: 90 }}>SKU</th>
                                                <th style={{ width: 90 }}>สต็อก (Stock)</th>
                                                <th style={{ width: 170 }}>อัปเดต (Updated)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.rows.map((p) => (
                                                <tr key={p.id}>
                                                    <td><Typography level="body-sm" fontFamily="monospace">{p.id}</Typography></td>
                                                    <td>{p.title}</td>
                                                    <td><Chip size="sm" color={PRODUCT_STATUS_COLOR[p.status] ?? 'neutral'}>{p.status}</Chip></td>
                                                    <td>
                                                        {p.min_price === p.max_price
                                                            ? formatMoney(p.min_price, p.currency)
                                                            : `${formatMoney(p.min_price, '')}– ${formatMoney(p.max_price, p.currency)}`}
                                                    </td>
                                                    <td>{p.sku_count}</td>
                                                    <td>{p.stock}</td>
                                                    <td>{fromUnix(p.update_time || p.create_time)}</td>
                                                </tr>
                                            ))}
                                            <TableState colSpan={7} loading={products.loading && products.rows.length === 0}
                                                error={products.error} empty={!products.loading && products.rows.length === 0} />
                                        </tbody>
                                    </Table>
                                    <LoadMore list={products} accountId={accountId} />
                                </Sheet>
                            </TabPanel>
                        </Tabs>
                    </>
                )}
            </Box>
        </Sheet>
    );
}
