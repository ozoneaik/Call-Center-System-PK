import * as React from "react";
import { Card, CardContent, Typography, Button, Box } from "@mui/joy";

function ItemCard({ item }) {
    const currency = item.currency || "THB";
    const unit = currency === "THB" ? "บาท" : currency;
    const nf = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 });

    const fmt = (n) => {
        if (n === null || n === undefined) return "-";
        const num = Number(n);
        if (Number.isNaN(num)) return "-";
        return `${nf.format(num)} ${unit}`;
    };

    const hasRange =
        item.priceMin != null &&
        item.priceMax != null &&
        Number(item.priceMin) !== Number(item.priceMax);

    const priceNode = hasRange ? (
        <Typography level="body-md" textColor="primary.plainColor" fontWeight="lg" sx={{ mt: 0.5 }}>
            {fmt(item.priceMin)} - {fmt(item.priceMax)}
        </Typography>
    ) : (
        <Typography level="body-md" textColor="primary.plainColor" fontWeight="lg" sx={{ mt: 0.5 }}>
            {fmt(item.price)}
        </Typography>
    );

    const showOriginal =
        !hasRange &&
        item.originalPrice != null &&
        Number(item.originalPrice) > Number(item.price);

    return (
        <Card
            component="a"
            href={item.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            sx={{
                p: 1,
                maxWidth: 160,
                boxShadow: "sm",
                display: "flex",
                flexDirection: "column",
                textDecoration: "none",
                transition: "transform .12s ease",
                "&:hover": { transform: "translateY(-2px)" },
            }}
        >
            {item.image ? (
                <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        objectFit: "contain",
                        borderRadius: 8,
                        background: "var(--joy-palette-neutral-plainActiveBg)",
                    }}
                />
            ) : (
                <Box
                    sx={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        borderRadius: 8,
                        bgcolor: "neutral.plainActiveBg",
                    }}
                />
            )}

            <CardContent sx={{ mt: 1 }}>
                <Typography
                    level="title-sm"
                    fontWeight="lg"
                    sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: 36, // กัน layout กระดิกเวลา 1–2 บรรทัด
                    }}
                    title={item.name}
                >
                    {item.name}
                </Typography>

                {priceNode}

                {showOriginal && (
                    <Typography level="body-sm" sx={{ textDecoration: "line-through", opacity: 0.7, mt: 0.25 }}>
                        {fmt(item.originalPrice)}
                    </Typography>
                )}

                <Button
                    size="sm"
                    variant="solid"
                    color="primary"
                    sx={{ mt: 1, borderRadius: "xl" }}
                >
                    ดูสินค้า
                </Button>
            </CardContent>
        </Card>
    );
}

export default function ChatBubbleItemList({ content }) {
    let items = [];
    if (typeof content === "string") {
        try {
            const obj = JSON.parse(content);
            if (obj && Array.isArray(obj.items)) items = obj.items;
        } catch { }
    }
    if (!items.length && content && content.chat_product_infos) {
        items = (content.chat_product_infos || []).map((p) => {
            const thumbId = p.thumb_url || "";
            const imageId = thumbId.endsWith("_tn") ? thumbId.slice(0, -3) : thumbId;
            const image = imageId ? `https://cf.shopee.co.th/file/${imageId}` : null;

            const priceMin = p.min_price != null ? Number(p.min_price) : null;
            const priceMax = p.max_price != null ? Number(p.max_price) : null;
            const price = p.price != null ? Number(p.price) : priceMin ?? 0;
            const orig = p.price_before_discount != null ? Number(p.price_before_discount) : null;

            return {
                id: String(p.item_id || "0"),
                shop_id: String(p.shop_id || ""),
                name: p.name || "ไม่ทราบชื่อสินค้า",
                image,
                url: p.item_id && p.shop_id ? `https://shopee.co.th/product/${p.shop_id}/${p.item_id}` : null,
                currency: "THB",
                price,
                priceMin,
                priceMax,
                originalPrice: orig,
            };
        });
    }

    if (!items.length) {
        return (
            <Typography level="body-sm" color="neutral">
                (ไม่มีสินค้าที่จะแสดง)
            </Typography>
        );
    }

    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: "100%",
                display: "grid",
                gridTemplateColumns: {
                    xs: "repeat(auto-fit, minmax(140px, 1fr))",
                    sm: "repeat(auto-fit, minmax(160px, 1fr))",
                },
                gap: 1,
                overflowX: { xs: "auto", sm: "visible" },
                pb: { xs: 0.5, sm: 0 },
            }}
        >
            {items.map((it) => (
                <ItemCard key={`${it.id}-${it.shop_id}`} item={it} />
            ))}
        </Box>
    );
}