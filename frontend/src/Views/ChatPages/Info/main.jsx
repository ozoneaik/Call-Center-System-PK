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
    32
    useEffect(() => {
        setNotes(props.notes);
    }, [props.notes]);
    useEffect(() => {
        setStarList(props.starList);
    }, [props.starList]);

    const fetchOrders = async () => {
        try {
            const res = await axiosClient.get(`/webhook-new/lazada/customer-orders/${sender?.custId}`);
            setOrders(res.data.orders || []);
            setOpenOrdersModal(true);
        } catch (err) {
            console.error("โหลดออเดอร์ไม่สำเร็จ", err);
        }
    };

    return (
        <Sheet sx={[MessageStyle.Layout, MessageStyle.Info.subLayout]}>
            <Box onClick={() => toggleMessagesPane()} sx={{ m: 1, display: { sm: 'none' } }}>
                <Typography textAlign='center'>
                    ปิดหน้าต่างนี้
                </Typography>
            </Box>

            {/* <Box sx={MessageStyle.Info.Box}>
                <Avatar src={sender.avatar} sx={{ width: '80px', height: '80px', mb: 1 }} />
                <Typography level="h4" sx={{ mb: 0.5, color: 'white' }}>{sender.custName}</Typography>
            </Box> */}
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

            <Button
                variant="soft"
                color="primary"
                onClick={fetchOrders}
                sx={{ m: 1 }}
            >
                ดูประวัติการสั่งซื้อ
            </Button>

            <Modal open={openOrdersModal} onClose={() => setOpenOrdersModal(false)}>
                <ModalDialog>
                    <Typography level="h5">
                        ประวัติการสั่งซื้อ ({orders.length} รายการ)
                    </Typography>
                    {orders.length === 0 ? (
                        <Typography color="neutral" sx={{ my: 2 }}>
                            ลูกค้าคนนี้ยังไม่มีประวัติการสั่งซื้อ
                        </Typography>
                    ) : (
                        orders.map((o, i) => (
                            <Box key={i} sx={{ my: 1, p: 1, borderBottom: '1px solid #ddd' }}>
                                <Typography>📦 Order No: {o.order_number}</Typography>
                                <Typography>📌 สถานะ: {o.statuses?.join(", ")}</Typography>
                                <Typography>💰 ยอดรวม: {o.price} บาท</Typography>
                                <Typography>🗓️ วันที่: {o.created_at}</Typography>
                            </Box>
                        ))
                    )}
                </ModalDialog>
            </Modal>

        </Sheet>
    );
}