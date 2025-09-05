import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Box, Button, Chip, CircularProgress, Divider,
    IconButton, Sheet, Typography
} from "@mui/joy";
import RefreshIcon from "@mui/icons-material/Refresh";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

export default function OrderHistory({
    visible = false,
    platform = "shopee",       // "shopee" | "lazada"
    // Shopee
    buyerId,
    buyerUsername,
    shopId,
    // Lazada
    sessionId,
    sellerId,                  // (เผื่ออนาคต)
    // common
    daysBack = 90,
    status = "ALL",
    timeField = "update_time",
    baseUrl = "",
    path = "/api/webhook-new/shopee/orders-by-buyer",
    pageSize = 5,
}) {
    const [loading, setLoading] = useState(false);
    const [resp, setResp] = useState(null);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [openDetail, setOpenDetail] = useState({});
    const ready = useMemo(() => {
        if (platform === "shopee") return !!shopId && (!!buyerId || !!buyerUsername);
        if (platform === "lazada") return !!sessionId;
        return false;
    }, [platform, shopId, buyerId, buyerUsername, sessionId]);

    const queryString = useMemo(() => {
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
        p.set("with_detail", "1");
        return p.toString();
    }, [platform, buyerId, buyerUsername, shopId, sessionId, sellerId, daysBack, status, timeField]);

    const url = `${baseUrl}${path}?${queryString}`;

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");
        setPage(1);
        try {
            const r = await fetch(url, { headers: { Accept: "application/json" } });
            const j = await r.json();
            if (!r.ok || j.ok === false) throw new Error(j?.message || `HTTP ${r.status}`);
            setResp(j);
        } catch (e) {
            setError(e.message || "Fetch error");
            setResp(null);
        } finally {
            setLoading(false);
        }
    }, [url]);

    useEffect(() => {
        if (visible && ready) fetchData();
    }, [visible, ready, fetchData]);

    const rows = useMemo(() => {
        if (!resp || !Array.isArray(resp.summary)) return [];
        const orderMap = new Map((resp.orders || []).map((od) => [od.order_sn, od]));
        const joined = resp.summary.map((s) => ({ ...s, _detail: orderMap.get(s.order_sn) || {} }));
        joined.sort((a, b) => (b.update_time || b.create_time || 0) - (a.update_time || a.create_time || 0));
        return joined;
    }, [resp]);

    const shown = rows.slice(0, page * pageSize);
    const hasMore = rows.length > shown.length;

    const fmtMoney = (num, currency = "THB") => {
        if (num == null) return "-";
        try {
            return new Intl.NumberFormat("th-TH", { style: "currency", currency, maximumFractionDigits: 0 }).format(num);
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
            const r = (it.reason_detail || it.reason || "").trim();
            if (r) pool.push(r);
        }
        return [...new Set(pool)];
    };

    const getCancelReasonShopee = (od) => {
        if (!od) return null;
        return od.cancel_reason || od.buyer_cancel_reason || null;
    };

    const isCanceled = (st) => String(st || "").toUpperCase().includes("CANCEL");
    const copy = (t) => navigator.clipboard?.writeText(t).catch(() => { });

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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Typography level="h5">
                    {platform === "shopee" ? "ประวัติออเดอร์ Shopee" : "ประวัติออเดอร์ Lazada"}
                </Typography>
                <Box sx={{ flex: 1 }} />
                <IconButton size="sm" onClick={fetchData} disabled={loading} variant="plain">
                    <RefreshIcon />
                </IconButton>
            </Box>
            {!ready && (
                <Typography level="body-sm" color="neutral">กำลังเตรียมข้อมูล…</Typography>
            )}

            {loading && ready && (
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

            {!loading && !error && ready && resp && (
                <>
                    <Typography level="body-sm" sx={{ mb: 1 }}>
                        ทั้งหมด {resp.count ?? rows.length} รายการ • แสดง {shown.length}/{rows.length}
                    </Typography>
                    {shown.map((s) => {
                        const od = s._detail || {};
                        const items = od.item_list || [];
                        const paymentText =
                            od.cod === true ? "เก็บเงินปลายทาง (COD)" :
                                s.pay_time ? `ชำระแล้ว: ${fmtDateTime(s.pay_time)}` : "—";
                        const host = platform === "shopee" ? regionHost(od.region) : null;
                        const recipient = getRecipient(od);
                        const buyerIdView =
                            s.buyer_id
                            || (od.item_list || []).find(it => it?.buyer_id)?.buyer_id
                            || (platform === "shopee" ? buyerId : null);
                        const trackingCodesPre = [
                            ...new Set(
                                (od.item_list || [])
                                    .map(it => (it?.tracking_code_pre ?? "").toString().trim())
                                    .filter(Boolean)
                            )
                        ];
                        const invoice = od.invoice || null;
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
                                        onClick={() => setOpenDetail((m) => ({ ...m, [s.order_sn]: !m[s.order_sn] }))}
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
                                        {`ยกเลิกเมื่อ ${fmtDateTime(s.cancel_time ?? od.cancel_time ?? s.update_time)}`}
                                        {getCancelReasons(od).length > 0 ? ` • เหตุผล: ${getCancelReasons(od).join(" • ")}` : ""}
                                        {getCancelReasonShopee(od) ? ` • เหตุผล: ${getCancelReasonShopee(od)}` : ""}
                                    </Typography>
                                )}
                                {openDetail[s.order_sn] && (
                                    <Sheet variant="soft" sx={{ p: 1, borderRadius: "sm", mt: 1 }}>
                                        {recipient ? (
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
                                {items.length === 0 && (
                                    <Typography level="body-sm" color="neutral">ไม่มีรายการสินค้า</Typography>
                                )}

                                {items.map((it, i) => {
                                    let productUrl = null;
                                    if (platform === "shopee" && it.item_id && host && shopId) {
                                        productUrl = `https://${host}/product/${shopId}/${it.item_id}`;
                                    }
                                    if (platform === "lazada" && it.product_id) {
                                        productUrl = `https://www.lazada.co.th/products/i${it.product_id}.html`;
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
                                                {it.image_info?.image_url && (
                                                    <img
                                                        src={it.image_info.image_url}
                                                        alt={it.item_name || "item"}
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
                                                    title={it.item_name || ""}
                                                >
                                                    {it.item_name || "-"} {it.model_name ? `• ${it.model_name}` : ""}
                                                </Typography>
                                                <Typography level="body-xs" color="neutral">
                                                    SKU: {it.item_sku || "-"}{it.model_sku ? ` • รุ่น: ${it.model_sku}` : ""} • x{it.model_quantity_purchased ?? 0}
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
                                                {fmtMoney(
                                                    it.model_discounted_price ?? it.model_original_price ?? 0,
                                                    s.currency || "THB"
                                                )}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Sheet>
                        );
                    })}

                    {hasMore ? (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                            <Button size="sm" variant="outlined" onClick={() => setPage((p) => p + 1)}>
                                Load more
                            </Button>
                        </Box>
                    ) : rows.length > 0 ? (
                        <Typography level="body-xs" color="neutral" textAlign="center" sx={{ mt: 1 }}>
                            แสดงครบแล้ว
                        </Typography>
                    ) : null}
                </>
            )}
        </Sheet>
    );
}
