import { Card, CardContent } from "@mui/joy";
import { Typography, Button } from "@mui/joy";

function ChatBubbleProduct({ content }) {
    let product = null;
    try { product = JSON.parse(content); } catch (e) { }

    if (!product || !product.id || !product.name) {
        return (
            <Typography level="body-sm" color="danger">
                ❌ ข้อมูลสินค้าไม่ถูกต้อง
            </Typography>
        );
    }

    const currency = product.currency || "THB";
    const unit = currency === "THB" ? "บาท" : currency;

    const fmt = (n) => {
        if (n === null || n === undefined) return "-";
        const num = Number(n);
        if (Number.isNaN(num)) return "-";
        return `${num.toLocaleString()} ${unit}`;
    };

    const hasRange =
        product.priceMin !== null &&
        product.priceMin !== undefined &&
        product.priceMax !== null &&
        product.priceMax !== undefined;

    return (
        <Card
            variant="outlined"
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 220,
                p: 1,
                boxShadow: "sm",
                backgroundColor: "background.body",
            }}
        >
            {product.image ? (
                <img
                    src={product.image}
                    alt={product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
            ) : null}

            <CardContent sx={{ textAlign: "center", mt: 1 }}>
                <Typography level="title-md" fontWeight="lg">
                    {product.name}
                </Typography>

                {/* ราคา */}
                {hasRange ? (
                    <Typography
                        level="body-md"
                        textColor="primary.plainColor"
                        fontWeight="bold"
                        sx={{ mt: 0.5 }}
                    >
                        {fmt(product.priceMin)} - {fmt(product.priceMax)}
                    </Typography>
                ) : (
                    <Typography
                        level="body-md"
                        textColor="primary.plainColor"
                        fontWeight="bold"
                        sx={{ mt: 0.5 }}
                    >
                        {fmt(product.price)}
                    </Typography>
                )}

                {!hasRange &&
                    product.originalPrice !== null &&
                    product.originalPrice !== undefined &&
                    Number(product.originalPrice) > Number(product.price) && (
                        <Typography
                            level="body-sm"
                            sx={{ textDecoration: "line-through", opacity: 0.7, mt: 0.25 }}
                        >
                            {fmt(product.originalPrice)}
                        </Typography>
                    )}

                <Button
                    component="a"
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
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

export default ChatBubbleProduct;
