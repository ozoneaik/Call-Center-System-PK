import { Card, CardContent } from "@mui/joy";
import { Typography, Button } from "@mui/joy";

function ChatBubbleProduct({ content }) {
    let product = null;

    try {
        product = JSON.parse(content); // แปลง string -> object
    } catch (e) {
        // content ไม่ใช่ JSON ที่ถูกต้อง
    }

    if (!product || !product.id || !product.name) {
        return (
            <Typography level="body-sm" color="danger">
                ❌ ข้อมูลสินค้าไม่ถูกต้อง
            </Typography>
        );
    }

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
            <img
                src={product.image}
                alt={product.name}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                }}
            />
            <CardContent sx={{ textAlign: "center", mt: 1 }}>
                <Typography level="title-md" fontWeight="lg">
                    {product.name}
                </Typography>
                <Typography level="body-md" textColor="primary.plainColor" fontWeight="bold" sx={{ mt: 0.5 }}>
                    {product.price.toLocaleString()} บาท
                </Typography>
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