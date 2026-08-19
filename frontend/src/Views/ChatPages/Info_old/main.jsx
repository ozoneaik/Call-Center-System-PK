import { MessageStyle } from "../../../styles/MessageStyle.js";
import Avatar from "@mui/joy/Avatar";
import { Box, Button, Sheet, Modal, ModalDialog } from "@mui/joy";
import Typography from "@mui/joy/Typography";
import Divider from "@mui/joy/Divider";
import { useEffect, useState } from "react";
import { toggleMessagesPane } from "../../../utils.js";
import { Notes } from "./Notes.jsx";
import { Feedback } from "./Feedback.jsx";
import axiosClient from "../../../Axios.js";

export default function Info(props) {
    const { sender, check } = props;
    const [notes, setNotes] = useState([]);
    const [starList, setStarList] = useState([]);
    const [newNote, setNewNote] = useState("");

    const [orders, setOrders] = useState([]);
    const [openOrdersModal, setOpenOrdersModal] = useState(false);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [ordersPlatform, setOrdersPlatform] = useState('');

    useEffect(() => {
        setNotes(props.notes);
    }, [props.notes]);

    useEffect(() => {
        setStarList(props.starList);
    }, [props.starList]);

    const isShopeeCustomer = sender?.description?.toLowerCase().includes('shopee') || sender?.custName?.toLowerCase().includes('shopee');
    const isLazadaCustomer = sender?.description?.toLowerCase().includes('lazada') || sender?.custName?.toLowerCase().includes('laz');

    const fetchLazadaOrders = async () => {
        try {
            setOrdersPlatform('Lazada');
            setIsLoadingOrders(true);

            const res = await axiosClient.get(`/webhook-new/lazada/customer-orders/${sender?.custId}`);
            setOrders(res.data.orders || []);
            setOpenOrdersModal(true);
        } catch (err) {
            console.error("โหลดออเดอร์ Lazada ไม่สำเร็จ", err);
            setOrders([]);
            setOpenOrdersModal(true);
        } finally {
            setIsLoadingOrders(false);
        }
    };

    const fetchShopeeOrders = async () => {
        try {
            setOrdersPlatform('Shopee');
            setIsLoadingOrders(true);

            const res = await axiosClient.get(`/webhook-new/shopee/customer-orders/${sender?.custId}`);
            setOrders(res.data.orders || []);
            setOpenOrdersModal(true);
        } catch (err) {
            console.error("โหลดออเดอร์ Shopee ไม่สำเร็จ", err);
            setOrders([]);
            setOpenOrdersModal(true);
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

    return (
        <Sheet sx={[MessageStyle.Layout, MessageStyle.Info.subLayout]}>
            <Box onClick={() => toggleMessagesPane()} sx={{ m: 1, display: { sm: 'none' } }}>
                <Typography textAlign='center'>
                    ปิดหน้าต่างนี้
                </Typography>
            </Box>

            <Divider />

            {/* โน๊ต */}
            <Notes
                notes={notes}
                setNotes={setNotes}
                check={check}
                newNote={newNote}
                setNewNote={setNewNote}
                sender={sender}>
            </Notes>

            <Divider />

            {/* ประวัติการให้ดาว */}
            <Feedback starList={starList} />
            <Divider sx={{ my: 1 }} />

            {/* ปุ่มดูออเดอร์ */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, m: 1 }}>
                {/* แสดงปุ่ม Lazada ก็ต่อเมื่อเป็นลูกค้า Lazada */}
                {isLazadaCustomer && (
                    <Button
                        variant="soft"
                        color="primary"
                        onClick={fetchLazadaOrders}
                        loading={isLoadingOrders && ordersPlatform === 'Lazada'}
                        disabled={isLoadingOrders}
                        sx={{ width: '100%' }}
                    >
                        ดูประวัติออเดอร์ Lazada
                    </Button>
                )}

                {/* แสดงปุ่ม Shopee ก็ต่อเมื่อเป็นลูกค้า Shopee */}
                {isShopeeCustomer && (
                    <Button
                        variant="soft"
                        color="warning" // เปลี่ยนสีปุ่มให้ตรง Theme Shopee (สีส้ม)
                        onClick={fetchShopeeOrders}
                        loading={isLoadingOrders && ordersPlatform === 'Shopee'}
                        disabled={isLoadingOrders}
                        sx={{ width: '100%', bgcolor: '#ff5722', color: 'white', '&:hover': { bgcolor: '#e64a19' } }}
                    >
                        ดูประวัติออเดอร์ Shopee
                    </Button>
                )}
            </Box>

            <Modal open={openOrdersModal} onClose={() => setOpenOrdersModal(false)}>
                <ModalDialog sx={{ maxWidth: 500, maxHeight: '80vh', overflow: 'auto' }}>
                    <Typography level="h5" sx={{ mb: 2 }}>
                        ประวัติการสั่งซื้อ {ordersPlatform} ({orders.length} รายการ)
                    </Typography>

                    {orders.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Typography color="neutral">
                                {isLoadingOrders
                                    ? "กำลังโหลด..."
                                    : `ลูกค้าคนนี้ยังไม่มีประวัติการสั่งซื้อใน ${ordersPlatform}`
                                }
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                            {orders.map((order, index) =>
                                ordersPlatform === 'Lazada'
                                    ? renderLazadaOrder(order, index)
                                    : renderShopeeOrder(order, index)
                            )}
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                            variant="outlined"
                            color="neutral"
                            onClick={() => setOpenOrdersModal(false)}
                        >
                            ปิด
                        </Button>
                    </Box>
                </ModalDialog>
            </Modal>
        </Sheet>
    );
}