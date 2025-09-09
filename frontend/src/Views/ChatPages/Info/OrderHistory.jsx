import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Box, Button, Chip, CircularProgress, Divider,
    IconButton, Sheet, Typography
} from "@mui/joy";
import RefreshIcon from "@mui/icons-material/Refresh";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Snackbar from "@mui/joy/Snackbar";

const DEFAULT_PAGE_SIZE = 10;

export default function OrderHistory({
    visible = false,
    platform = "shopee",
    // Shopee
    buyerId,
    buyerUsername,
    shopId,
    // Lazada
    sessionId,
    sellerId,
    // common
    daysBack = 90,
    status = "ALL",
    timeField = "update_time",
    baseUrl = "",
    pageSize = DEFAULT_PAGE_SIZE,
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);

    // summaries
    const [summaryRows, setSummaryRows] = useState([]);
    const [hasMore, setHasMore] = useState(false);

    // detail (lazy)
    const [detailMap, setDetailMap] = useState({});
    const [openDetail, setOpenDetail] = useState({});

    const [snackbar, setSnackbar] = useState("");
    const abortRef = useRef(null);

    const ready = useMemo(() => {
        if (platform === "shopee") return !!shopId && (!!buyerId || !!buyerUsername);
        if (platform === "lazada") return !!sessionId;
        return false;
    }, [platform, shopId, buyerId, buyerUsername, sessionId]);

    const listPath = platform === "shopee"
        ? "/api/webhook-new/shopee/orders-by-buyer"
        : "/api/webhook-new/lazada/orders-by-session";

    const buildListQuery = (pageNum) => {
        const p = new URLSearchParams();
        if (platform === "shopee") {
            if (buyerId) p.set("buyer_id", String(buyerId));
            else if (buyerUsername) p.set("buyer_username", buyerUsername);
            p.set("shop_id", String(shopId));
        } else {
            p.set("session_id", String(sessionId));
            if (sellerId) p.set("seller_id", String(sellerId));
        }
        p.set("days_back", String(daysBack));
        p.set("status", status);
        p.set("time_field", timeField);
        p.set("summary_only", "1");
        p.set("page", String(pageNum));
        p.set("page_size", String(pageSize));
        return p.toString();
    };

    const safeFetch = useCallback(
        async (input, init, timeoutMs = 20000, retries = 1) => {
            for (let attempt = 0; attempt <= retries; attempt++) {
                abortRef.current?.abort();
                const controller = new AbortController();
                abortRef.current = controller;
                const timer = setTimeout(() => controller.abort(), timeoutMs);
                try {
                    const resp = await fetch(input, { ...init, signal: controller.signal });
                    clearTimeout(timer);
                    if (!resp.ok) return resp;
                    return resp;
                } catch (e) {
                    clearTimeout(timer);
                    if (attempt === retries) throw e;
                    await new Promise((r) => setTimeout(r, 400));
                }
            }
            throw new Error("Fetch failed");
        },
        []
    );

    const resetState = useCallback(() => {
        setError("");
        setSummaryRows([]);
        setDetailMap({});
        setOpenDetail({});
        setHasMore(false);
        setPage(1);
    }, []);

    const fetchPage = useCallback(
        async (pageNum) => {
            const url = `${baseUrl}${listPath}?${buildListQuery(pageNum)}`;
            setLoading(true);
            setError("");

            try {
                const r = await safeFetch(url, { headers: { Accept: "application/json" } }, 20000, 1);
                const j = await r.json();
                if (!r.ok || j.ok === false) {
                    throw new Error(j?.message || `HTTP ${r.status}`);
                }
                const incoming = Array.isArray(j.summary) ? j.summary : [];
                setSummaryRows((prev) => (pageNum === 1 ? incoming : [...prev, ...incoming]));
                setHasMore(Boolean(j.has_more));
            } catch (e) {
                setError(e?.message || "Fetch error");
            } finally {
                setLoading(false);
            }
        },
        [baseUrl, listPath, safeFetch]
    );

    useEffect(() => {
        if (!visible || !ready) return;
        resetState();
        fetchPage(1);
    }, [visible, ready, platform, shopId, buyerId, buyerUsername, sessionId, sellerId, daysBack, status, timeField, pageSize, resetState, fetchPage]);

    const loadMore = useCallback(() => {
        if (loading || !hasMore) return;
        const next = page + 1;
        setPage(next);
        fetchPage(next);
    }, [loading, hasMore, page, fetchPage]);

    const detailPath = platform === "shopee"
        ? "/api/webhook-new/shopee/order-detail"
        : "/api/webhook-new/lazada/order-detail";

    const fetchDetail = useCallback(async (summaryRow) => {
        const key = summaryRow.order_sn;
        if (!key) return;
        if (detailMap[key]) return;

        try {
            const p = new URLSearchParams();
            if (platform === "shopee") {
                p.set("order_sn", key);
                if (shopId) p.set("shop_id", String(shopId));
            } else {
                const orderId = summaryRow.order_id || summaryRow._detail?.order_id;
                if (!orderId) return;
                p.set("order_id", String(orderId));
            }
            const url = `${baseUrl}${detailPath}?${p.toString()}`;
            const r = await safeFetch(url, { headers: { Accept: "application/json" } }, 20000, 1);
            const j = await r.json();
            if (!r.ok || j.ok === false) {
                throw new Error(j?.message || `HTTP ${r.status}`);
            }

            const od = platform === "shopee"
                ? j.order
                : { ...(j.detail || {}), item_list: j.items || [], invoice: j.invoice, trace: j.trace };

            setDetailMap((m) => ({ ...m, [key]: od || {} }));
        } catch (e) {
            setDetailMap((m) => ({ ...m, [key]: { __error: e?.message || "load detail failed" } }));
        }
    }, [platform, shopId, baseUrl, detailPath, detailMap, safeFetch]);

    const rows = useMemo(() => {
        return summaryRows.map((s) => ({
            ...s,
            _detail: detailMap[s.order_sn] || null,
        }));
    }, [summaryRows, detailMap]);

    const fmtMoney = (num, currency = "THB") => {
        if (num == null) return "-";
        try {
            return new Intl.NumberFormat("th-TH", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(num));
        } catch {
            return `${num} ${currency}`;
        }
    };

    const fmtDateTime = (ts) =>
        ts
            ? new Date(ts * 1000).toLocaleString("th-TH", {
                timeZone: "Asia/Bangkok",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            })
            : "—";

    const statusColor = (st) => {
        const s = String(st || "").toUpperCase();
        if (s.includes("UNPAID")) return "warning";
        if (s.includes("COMPLETED")) return "success";
        if (s.includes("CANCEL")) return "danger";
        if (s.includes("READY") || s.includes("SHIP")) return "primary";
        return "neutral";
    };

    const getCancelReasons = (od) => {
        const list = od?.item_list || [];
        const pool = [];
        for (const it of list) {
            const r = (it?.reason_detail || it?.reason || "").toString().trim();
            if (r) pool.push(r);
        }
        return [...new Set(pool)];
    };

    const getCancelReasonShopee = (od) => {
        if (!od) return null;
        return od.cancel_reason || od.buyer_cancel_reason || null;
    };

    const isCanceled = (st) => String(st || "").toUpperCase().includes("CANCEL");

    const copy = (t) => {
        navigator.clipboard?.writeText(t)
            .then(() => {
                setSnackbar("คัดลอกแล้ว: " + t);
                setTimeout(() => setSnackbar(""), 1800);
            })
            .catch(() => {
                setSnackbar("ไม่สามารถคัดลอกได้");
                setTimeout(() => setSnackbar(""), 1800);
            });
    };

    const getRecipient = (od) => {
        const r = od?.recipient_address;
        if (r) {
            const parts = [r.full_address, r.town, r.district, r.city, r.state, r.zipcode].filter(Boolean);
            return {
                name: r.name || "-",
                phone: r.phone || "-",
                address: parts.length ? parts.join(" ") : "-",
            };
        }
        if (od?.customer || od?.shipping_address) {
            return {
                name: od.customer?.name || "-",
                phone: od.customer?.phone || "-",
                address: (typeof od.shipping_address === "string" ? od.shipping_address : "") || "-",
            };
        }
        return null;
    };

    const regionHost = (region) => {
        switch ((region || "TH").toUpperCase()) {
            case "SG": return "shopee.sg";
            case "MY": return "shopee.com.my";
            case "VN": return "shopee.vn";
            case "ID": return "shopee.co.id";
            case "PH": return "shopee.ph";
            case "TW": return "shopee.tw";
            default: return "shopee.co.th";
        }
    };

    if (!visible) return null;

    return (
        <Sheet variant="soft" sx={{ p: 1.5, borderRadius: "xl" }}>
            {snackbar && (
                <Snackbar open color="success" anchorOrigin={{ vertical: "top", horizontal: "center" }}>
                    {snackbar}
                </Snackbar>
            )}

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Typography level="h5">
                    {platform === "shopee" ? "ประวัติออเดอร์ Shopee" : "ประวัติออเดอร์ Lazada"}
                </Typography>
                <Box sx={{ flex: 1 }} />
                <IconButton
                    size="sm"
                    onClick={() => {
                        resetState();
                        fetchPage(1);
                    }}
                    disabled={loading}
                    variant="plain"
                >
                    <RefreshIcon />
                </IconButton>
            </Box>

            {!ready && <Typography level="body-sm" color="neutral">กำลังเตรียมข้อมูล…</Typography>}

            {loading && summaryRows.length === 0 && ready && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, my: 1 }}>
                    <CircularProgress size="sm" />
                    <Typography level="body-sm">กำลังโหลด…</Typography>
                </Box>
            )}

            {error && (
                <Typography color="danger" level="body-sm" sx={{ my: 1 }}>
                    ผิดพลาด: {error}
                </Typography>
            )}

            {!error && ready && (
                <>
                    {summaryRows.length > 0 && (
                        <Typography level="body-sm" sx={{ mb: 1 }}>
                            ทั้งหมด {summaryRows.length} รายการ • แสดง {summaryRows.length}
                        </Typography>
                    )}

                    {summaryRows.map((s) => {
                        const od = rows.find((r) => r.order_sn === s.order_sn)?._detail || null;
                        const items = od?.item_list || [];
                        const paymentText =
                            od?.cod === true
                                ? "เก็บเงินปลายทาง (COD)"
                                : s.pay_time
                                    ? `ชำระแล้ว: ${fmtDateTime(s.pay_time)}`
                                    : "—";

                        const host = platform === "shopee" ? regionHost(od?.region) : null;
                        const recipient = getRecipient(od);
                        const buyerIdView =
                            s.buyer_id
                            || (od?.item_list || []).find((it) => it?.buyer_id)?.buyer_id
                            || (platform === "shopee" ? buyerId : null);

                        const trackingCodesPre = [
                            ...new Set(
                                (od?.item_list || [])
                                    .map((it) => (it?.tracking_code_pre ?? "").toString().trim())
                                    .filter(Boolean)
                            )
                        ];
                        const invoice = od?.invoice || null;

                        return (
                            <Sheet key={s.order_sn} variant="plain" sx={{ p: 1, borderRadius: "md", mb: 1 }}>
                                {/* Header */}
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <Typography level="title-sm" fontFamily="monospace">{s.order_sn}</Typography>
                                    <IconButton size="sm" onClick={() => copy(s.order_sn)} variant="plain">
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                    <Chip size="sm" color={statusColor(s.status)} variant="soft">
                                        {s.status || "-"}
                                    </Chip>
                                    <Box sx={{ flex: 1 }} />
                                    <Button
                                        size="sm"
                                        variant="soft"
                                        onClick={async () => {
                                            const willOpen = !openDetail[s.order_sn];
                                            setOpenDetail((m) => ({ ...m, [s.order_sn]: willOpen }));
                                            if (willOpen) await fetchDetail(s);
                                        }}
                                        sx={{ mr: 1 }}
                                    >
                                        {openDetail[s.order_sn] ? "ซ่อนรายละเอียด" : "รายละเอียด"}
                                    </Button>
                                    <Typography level="title-sm">{fmtMoney(s.total, s.currency || "THB")}</Typography>
                                </Box>

                                <Typography level="body-xs" color="neutral" sx={{ mt: 0.5, mb: 1 }}>
                                    สั่งซื้อเมื่อ {fmtDateTime(s.create_time)} • อัปเดต {fmtDateTime(s.update_time)} • {paymentText}
                                </Typography>

                                {isCanceled(s.status) && (
                                    <Typography
                                        level="body-xs"
                                        color="danger"
                                        sx={{ mt: -0.5, mb: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                                    >
                                        {`ยกเลิกเมื่อ ${fmtDateTime(s.cancel_time ?? od?.cancel_time ?? s.update_time)}`}
                                        {getCancelReasons(od).length > 0 ? ` • เหตุผล: ${getCancelReasons(od).join(" • ")}` : ""}
                                        {getCancelReasonShopee(od) ? ` • เหตุผล: ${getCancelReasonShopee(od)}` : ""}
                                    </Typography>
                                )}

                                {openDetail[s.order_sn] && (
                                    <Sheet variant="soft" sx={{ p: 1, borderRadius: "sm", mt: 1 }}>
                                        {!od ? (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <CircularProgress size="sm" />
                                                <Typography level="body-sm">กำลังโหลดรายละเอียด…</Typography>
                                            </Box>
                                        ) : od.__error ? (
                                            <Typography level="body-sm" color="danger">
                                                ดึงรายละเอียดไม่สำเร็จ: {od.__error}
                                            </Typography>
                                        ) : recipient ? (
                                            <>
                                                <Typography
                                                    level="body-sm"
                                                    color="neutral"
                                                    sx={{ mt: 0.25, mb: 0.5, display: "flex", gap: 1, flexWrap: "wrap" }}
                                                >
                                                    {buyerIdView ? (
                                                        <span>
                                                            <b>buyer_id: </b>{String(buyerIdView)}
                                                        </span>
                                                    ) : null}
                                                    {trackingCodesPre.length > 0 ? (
                                                        <span>
                                                            tracking_code_pre:{" "}
                                                            <b style={{ fontFamily: "monospace" }}>
                                                                {trackingCodesPre.join(", ")}
                                                            </b>
                                                        </span>
                                                    ) : null}
                                                </Typography>
                                                <Typography level="body-sm"><b>ผู้รับ:</b> {recipient.name}</Typography>
                                                <Typography level="body-sm"><b>โทร:</b> {recipient.phone}</Typography>
                                                <Typography level="body-sm" sx={{ whiteSpace: "pre-wrap" }}>
                                                    <b>ที่อยู่:</b> {recipient.address}
                                                </Typography>

                                                {invoice && (
                                                    <>
                                                        <Divider sx={{ my: 1 }} />
                                                        <Typography level="body-sm" sx={{ mb: 0.5 }}>
                                                            <b>ใบกำกับภาษี:</b>{" "}
                                                            {invoice.not_requested
                                                                ? "ไม่มีคำขอ"
                                                                : invoice.invoice_type === "company"
                                                                    ? "นิติบุคคล"
                                                                    : invoice.invoice_type === "personal"
                                                                        ? "บุคคลธรรมดา"
                                                                        : "—"}
                                                        </Typography>
                                                        {invoice.not_requested ? (
                                                            <Typography level="body-xs" color="neutral">
                                                                ลูกค้าไม่ได้ร้องขอใบกำกับภาษีสำหรับออเดอร์นี้
                                                            </Typography>
                                                        ) : (
                                                            (invoice.display_name || invoice.display_tax_id || invoice.display_address) && (
                                                                <Typography level="body-xs" color="neutral" sx={{ whiteSpace: "pre-wrap" }}>
                                                                    {invoice.display_name ? `ชื่อ/บริษัท: ${invoice.display_name}\n` : ""}
                                                                    {invoice.display_tax_id ? `เลขภาษี: ${invoice.display_tax_id}\n` : ""}
                                                                    {invoice.display_address ? `ที่อยู่: ${invoice.display_address}` : ""}
                                                                </Typography>
                                                            )
                                                        )}
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <Typography level="body-sm" color="neutral">
                                                ไม่มีข้อมูลผู้รับ/ที่อยู่ในออเดอร์นี้
                                            </Typography>
                                        )}
                                    </Sheet>
                                )}

                                {/* Items */}
                                <Divider sx={{ mb: 1 }} />
                                {(items || []).length === 0 && (
                                    <Typography level="body-sm" color="neutral">
                                        กด "รายละเอียด" เพื่อดูสินค้าภายในออเดอร์นี้
                                    </Typography>
                                )}

                                {(items || []).map((it, i) => {
                                    // ---- normalize fields (Shopee or Lazada) ----
                                    const title = it.item_name ?? it.name ?? "-";
                                    const sku = it.item_sku ?? it.sku ?? "-";
                                    const modelSku = it.model_sku ?? "";
                                    const qty = (it.model_quantity_purchased ?? it.qty ?? 0);
                                    const priceEach =
                                        it.model_discounted_price ??
                                        it.model_original_price ??
                                        it.price ?? 0;

                                    const imageUrl = it.image_info?.image_url ?? it.image_url ?? null;

                                    // product URL
                                    let productUrl = null;
                                    if (platform === "shopee" && it.item_id && host && shopId) {
                                        productUrl = `https://${host}/product/${shopId}/${it.item_id}`;
                                    } else if (platform === "lazada") {
                                        // ใช้ action_url จาก backend ก่อน ถ้าไม่มีค่อย fallback product_id
                                        if (it.action_url) {
                                            productUrl = it.action_url;
                                        } else if (it.product_id) {
                                            productUrl = `https://www.lazada.co.th/products/i${it.product_id}.html`;
                                        }
                                    }

                                    return (
                                        <Box
                                            key={`${s.order_sn}-${i}`}
                                            sx={{
                                                display: "grid",
                                                gridTemplateColumns: "44px 1fr auto",
                                                gap: 1,
                                                alignItems: "center",
                                                py: 0.5,
                                            }}
                                        >
                                            {/* image */}
                                            <Box sx={{ width: 44, height: 44, borderRadius: 1, overflow: "hidden", bgcolor: "neutral.plainHoverBg" }}>
                                                {imageUrl && (
                                                    <img
                                                        src={imageUrl}
                                                        alt={title || "item"}
                                                        width={44}
                                                        height={44}
                                                        style={{ objectFit: "cover", display: "block" }}
                                                        loading="lazy"
                                                    />
                                                )}
                                            </Box>

                                            {/* text */}
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography
                                                    level="body-sm"
                                                    sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                                                    title={title || ""}
                                                >
                                                    {title}{it.model_name ? ` • ${it.model_name}` : ""}
                                                </Typography>
                                                <Typography level="body-xs" color="neutral">
                                                    SKU: {sku}{modelSku ? ` • รุ่น: ${modelSku}` : ""} • x{qty}
                                                </Typography>

                                                {productUrl && (
                                                    <Button
                                                        size="sm"
                                                        variant="plain"
                                                        component="a"
                                                        href={productUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{ px: 0, mt: 0.25 }}
                                                    >
                                                        เปิดหน้าสินค้า
                                                    </Button>
                                                )}
                                            </Box>

                                            {/* price */}
                                            <Typography level="body-sm" sx={{ textAlign: "right" }}>
                                                {fmtMoney(priceEach, s.currency || "THB")}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Sheet>
                        );
                    })}

                    {hasMore ? (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                            <Button size="sm" variant="outlined" onClick={loadMore} disabled={loading}>
                                {loading ? "กำลังโหลด…" : "Load more"}
                            </Button>
                        </Box>
                    ) : summaryRows.length > 0 ? (
                        <Typography level="body-xs" color="neutral" textAlign="center" sx={{ mt: 1 }}>
                            แสดงครบแล้ว
                        </Typography>
                    ) : null}
                </>
            )}
        </Sheet>
    );
}
