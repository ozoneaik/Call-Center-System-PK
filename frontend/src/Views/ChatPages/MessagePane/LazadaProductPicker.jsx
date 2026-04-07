import { useState } from 'react';
import { Modal, ModalDialog, ModalClose, Input, Button, Stack, Typography, Box, Card, CircularProgress } from '@mui/joy';
import { Search, Send } from '@mui/icons-material';
import axios from 'axios';

export default function LazadaProductPicker({ open, setOpen, sender, onSelect }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 💡 1. เพิ่ม state สำหรับเก็บ ID ของสินค้าที่กำลังถูกกดส่ง
    const [sendingId, setSendingId] = useState(null);

    const handleSearch = async () => {
        console.log('handleSearch called', { query, custId: sender?.custId });
        if (!query.trim()) return;

        setLoading(true);
        setError('');
        setResults([]);

        try {
            const token = localStorage.getItem('token')
                ?? sessionStorage.getItem('token')
                ?? '';

            // const { data } = await axios.get('http://localhost:8000/api/shopee/products/search', {
            const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/lazada/products/search`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    keyword: query,
                    custId: sender?.custId,
                }
            });

            console.log('search result', data);
            setResults(data.items ?? []);

            if ((data.items ?? []).length === 0) {
                setError('ไม่พบสินค้าที่ค้นหา');
            }
        } catch (e) {
            console.error('search error', e);
            setError('เกิดข้อผิดพลาด: ' + (e?.response?.data?.message ?? e.message));
        } finally {
            setLoading(false);
        }
    };

    // 💡 2. สร้างฟังก์ชันสำหรับกดปุ่มส่ง เพื่อโชว์ Loading
    const handleSendClick = async (product) => {
        setSendingId(product.id);
        try {
            await onSelect(product);
        } finally {
            setSendingId(null);
        }
    };

    return (
        <Modal open={open} onClose={() => setOpen(false)}>
            <ModalDialog sx={{ width: 800, maxHeight: '80vh', overflow: 'auto' }}>
                <ModalClose />
                <Typography level="title-md">🛍️ เลือกสินค้า Lazada</Typography>

                <Stack direction="row" spacing={1} mt={1}>
                    <Input
                        fullWidth
                        placeholder="ค้นหารหัสสินค้า หรือชื่อสินค้าใน Lazada"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button
                        loading={loading}
                        onClick={handleSearch}
                        startDecorator={<Search />}
                    >
                        ค้นหา
                    </Button>
                </Stack>

                {/* แสดง error */}
                {error && (
                    <Typography level="body-sm" color="danger" mt={1}>
                        {error}
                    </Typography>
                )}

                {/* Loading */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <CircularProgress size="sm" />
                    </Box>
                )}

                {/* ผลลัพธ์ */}
                {/* <Stack spacing={1} mt={1}>
                    {results.map((product) => (
                        <Card key={product.id} variant="outlined" sx={{ p: 1 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                {product.image && (
                                    <img
                                        src={product.image}
                                        width={60} height={60}
                                        style={{ objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                                    />
                                )}
                                <Box flex={1} minWidth={0}>
                                    <Typography level="body-sm" fontWeight="bold" noWrap>
                                        {product.name}
                                    </Typography>
                                    <Typography level="body-xs" color="danger">
                                        ฿{Number(product.price).toLocaleString()}
                                    </Typography>
                                    <Typography level="body-xs" color="neutral">
                                        คงเหลือ: {product.stock ?? '-'} ชิ้น
                                    </Typography>
                                </Box>
                                <Button
                                    size="sm"
                                    endDecorator={<Send />}
                                    // 💡 3. เช็คสถานะ Loading จาก sendingId
                                    loading={sendingId === product.id}
                                    disabled={sendingId !== null && sendingId !== product.id} // ล็อคปุ่มอื่นขณะส่ง
                                    onClick={() => handleSendClick(product)}
                                >
                                    ส่ง
                                </Button>
                            </Stack>
                        </Card>
                    ))}
                </Stack> */}

                {/* ผลลัพธ์ */}
                <Stack spacing={1} mt={1}>
                    {results.map((product, index) => (
                        // ✅ แก้ key ให้มี seller_sku ด้วย ป้องกัน Error เวลาสินค้า item_id เดียวกันแต่คนละไซส์
                        <Card key={`${product.id}-${product.seller_sku}-${index}`} variant="outlined" sx={{ p: 1 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                {product.image && (
                                    <img
                                        src={product.image}
                                        width={60} height={60}
                                        style={{ objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                                    />
                                )}
                                <Box flex={1} minWidth={0}>
                                    <Typography level="body-sm" fontWeight="bold" noWrap>
                                        {product.name}
                                    </Typography>

                                    {/* ✅ เพิ่มป้าย Tag แสดงขนาด (size_option) */}
                                    {product.size && (
                                        <Typography
                                            level="body-xs"
                                            sx={{
                                                display: 'inline-block',
                                                bgcolor: 'neutral.100',
                                                color: 'neutral.700',
                                                px: 1,
                                                py: 0.5,
                                                borderRadius: 'sm',
                                                border: '1px solid',
                                                borderColor: 'neutral.300',
                                                mb: 0.5,
                                                mt: 0.5
                                            }}
                                        >
                                            ตัวเลือก: {product.size}
                                        </Typography>
                                    )}

                                    <Typography level="body-xs" color="danger">
                                        ฿{Number(product.price).toLocaleString()}
                                    </Typography>
                                    <Typography level="body-xs" color="neutral">
                                        คงเหลือ: {product.stock ?? '-'} ชิ้น
                                    </Typography>
                                </Box>
                                <Button
                                    size="sm"
                                    endDecorator={<Send />}
                                    loading={sendingId === product.id}
                                    disabled={sendingId !== null && sendingId !== product.id}
                                    onClick={() => handleSendClick(product)}
                                >
                                    ส่ง
                                </Button>
                            </Stack>
                        </Card>
                    ))}
                </Stack>

            </ModalDialog>
        </Modal>
    );
}