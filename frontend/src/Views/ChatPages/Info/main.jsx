import { MessageStyle } from "../../../styles/MessageStyle.js";
import Avatar from "@mui/joy/Avatar";
import { Box, Sheet } from "@mui/joy";
import Typography from "@mui/joy/Typography";
import Divider from "@mui/joy/Divider";
import { Suspense, useEffect, useState } from "react";
import { toggleMessagesPane } from "../../../utils.js";
import { Notes } from "./Notes.jsx";
import { Feedback } from "./Feedback.jsx";
import Button from "@mui/joy/Button";
import OrderHistory from "./OrderHistory.jsx";

import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import DialogTitle from "@mui/joy/DialogTitle";
import DialogContent from "@mui/joy/DialogContent";
import ModalClose from "@mui/joy/ModalClose";

const parseBuyerId = (custId) => {
    if (!custId) return null;
    const id = String(custId).split("_")[0];
    return /^\d+$/.test(id) ? Number(id) : null;
};

export default function Info(props) {
    const { sender, check } = props;
    const [notes, setNotes] = useState([]);
    const [starList, setStarList] = useState([]);
    const [newNote, setNewNote] = useState('');

    const [openOrdersModal, setOpenOrdersModal] = useState(false);
    const [platformInfo, setPlatformInfo] = useState({
        loading: true,
        platform: "unknown",
        shopId: null,
        sellerId: null,
        shopName: null,
        customerName: null,
        error: ""
    });

    useEffect(() => { setNotes(props.notes); }, [props.notes]);
    useEffect(() => { setStarList(props.starList); }, [props.starList]);

    useEffect(() => {
        setNotes(props.notes);
    }, [props.notes]);

    useEffect(() => {
        setStarList(props.starList)
    }, [props.starList]);

    const buyerId = parseBuyerId(sender?.custId);
    const buyerUsername = sender?.custName;
    const API_BASE = "https://dev2api.pumpkin-th.com";

    useEffect(() => {
        setOpenOrdersModal(false);
        const resolvePlatform = async () => {
            if (!sender?.custId) {
                setPlatformInfo(s => ({ ...s, loading: false, platform: "unknown", error: "no custId" }));
                return;
            }
            setPlatformInfo(s => ({ ...s, loading: true, error: "" }));
            try {
                // 1) ลอง Shopee
                const u1 = `${API_BASE}/api/webhook-new/shopee/resolve-platform?cust_id=${encodeURIComponent(sender.custId)}`;
                let r = await fetch(u1, { headers: { Accept: "application/json" } });
                let j = await r.json();
                if (r.ok && j.platform === "shopee") {
                    setPlatformInfo({
                        loading: false,
                        platform: "shopee",
                        shopId: j.shopee_shop_id ?? null,
                        shopName: j.shop_name ?? null,
                        sellerId: null,
                        customerName: j.customer_name ?? sender?.custName ?? null,
                        error: ""
                    });
                    return;
                }

                // 2) ลอง Lazada
                const u2 = `${API_BASE}/api/webhook-new/lazada/resolve-platform?cust_id=${encodeURIComponent(sender.custId)}`;
                r = await fetch(u2, { headers: { Accept: "application/json" } });
                j = await r.json();
                if (r.ok && j.platform === "lazada") {
                    setPlatformInfo({
                        loading: false,
                        platform: "lazada",
                        shopId: null,
                        sellerId: j.seller_id ?? null,
                        shopName: j.shop_name ?? null,         // ใช้ description เป็นชื่อร้านได้
                        customerName: j.customer_name ?? sender?.custName ?? null,
                        error: ""
                    });
                    return;
                }

                setPlatformInfo({
                    loading: false,
                    platform: "unknown",
                    shopId: null, sellerId: null,
                    shopName: null, customerName: null,
                    error: "unknown platform"
                });
            } catch (e) {
                setPlatformInfo({
                    loading: false,
                    platform: "unknown",
                    shopId: null, sellerId: null,
                    shopName: null, customerName: null,
                    error: e.message || "resolve error"
                });
            }
        };

        resolvePlatform();
    }, [sender?.custId, sender?.custName]);

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

            {!platformInfo.loading && platformInfo.platform !== "unknown" && (
                <Box sx={{ display: "flex", justifyContent: "flex-end", m: 1 }}>
                    <Button size="sm" variant="outlined" onClick={() => setOpenOrdersModal(true)}>
                        {platformInfo.platform === "shopee" ? "ดูประวัติออเดอร์ Shopee" : "ดูประวัติออเดอร์ Lazada"}
                    </Button>
                </Box>
            )}

            <Modal
                open={openOrdersModal}
                onClose={() => setOpenOrdersModal(false)}
                aria-labelledby="orders-modal-title"
                slotProps={{ backdrop: { sx: { backdropFilter: "blur(2px)" } } }}
            >
                <ModalDialog
                    variant="soft"
                    sx={{
                        p: 0,
                        width: "min(92vw, 920px)",
                        maxWidth: "92vw",
                        maxHeight: "90vh",
                        overflow: "hidden",
                        borderRadius: "xl",
                        "@media (max-width: 600px)": {
                            width: "100vw",
                            height: "100vh",
                            maxWidth: "100vw",
                            maxHeight: "100vh",
                            borderRadius: 0
                        }
                    }}
                >
                    <ModalClose />
                    <DialogTitle id="orders-modal-title" sx={{ px: 2, pt: 2, pb: 1 }}>
                        {platformInfo.platform === "shopee" ? "ประวัติออเดอร์ Shopee" : "ประวัติออเดอร์ Lazada"}
                    </DialogTitle>

                    <DialogContent sx={{ p: 0 }}>
                        <Box sx={{ px: 2, pb: 1 }}>
                            <Typography level="body-sm" color="neutral">
                                ลูกค้า: {platformInfo.customerName ?? sender?.custName ?? "-"}
                                {" • "}
                                ร้าน: {platformInfo.shopName ?? "-"}
                            </Typography>
                        </Box>

                        <Box sx={{ px: 2, pb: 2, overflowY: "auto", maxHeight: { xs: "calc(100vh - 120px)", sm: "70vh" } }}>
                            <Suspense fallback={<Typography level="body-sm" sx={{ p: 2 }}>กำลังโหลดข้อมูล…</Typography>}>
                                <OrderHistory
                                    visible={openOrdersModal}
                                    platform={platformInfo.platform}
                                    // Shopee
                                    buyerId={platformInfo.platform === "shopee" ? parseBuyerId(sender?.custId) : undefined}
                                    buyerUsername={platformInfo.platform === "shopee" ? buyerUsername : undefined}
                                    shopId={platformInfo.platform === "shopee" ? platformInfo.shopId : undefined}
                                    // Lazada
                                    sessionId={platformInfo.platform === "lazada" ? sender?.custId : undefined}
                                    sellerId={platformInfo.platform === "lazada" ? platformInfo.sellerId : undefined}
                                    // common
                                    daysBack={180}
                                    status="ALL"
                                    timeField="update_time"
                                    baseUrl={API_BASE}
                                    path={platformInfo.platform === "shopee"
                                        ? "/api/webhook-new/shopee/orders-by-buyer"
                                        : "/api/webhook-new/lazada/orders-by-session"}
                                    pageSize={5}
                                />
                            </Suspense>
                        </Box>

                        <Box sx={{ p: 1.5, display: "flex", gap: 1, justifyContent: "flex-end", borderTop: "1px solid", borderColor: "divider" }}>
                            <Button variant="plain" color="neutral" onClick={() => setOpenOrdersModal(false)}>
                                ปิด
                            </Button>
                        </Box>
                    </DialogContent>
                </ModalDialog>
            </Modal>

            {platformInfo.error && (
                <Typography level="body-xs" color="neutral">
                    resolve platform error: {platformInfo.error}
                </Typography>
            )}
        </Sheet>
    )
}