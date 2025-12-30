import { useParams } from "react-router-dom";
import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import { useEffect, useState } from "react";
import { MessageListApi } from "../../Api/Messages.js";
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import { useNotification } from "../../context/NotiContext.jsx";
import { PendingTable } from "./PendingTable.jsx";
import { ProgressTable } from "./ProgressTable.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { Sheet, CircularProgress, Box, Stack } from "@mui/joy";
import OrderTable from "./ProgressTableNew.jsx";
import PendingTableNew from "./PendingTableNew.jsx";
import ChatPageNew from "../ChatPagesNew/ChatPageNew.jsx";

export default function MainChat() {
    const { user } = useAuth();
    const { notification, setUnRead } = useNotification();
    const { roomId, roomName } = useParams();
    const BreadcrumbsPath = [{ name: roomName }, { name: "รายละเอียด" }];
    const [progress, setProgress] = useState([]);
    const [filterProgress, setFilterProgress] = useState([]);
    const [pending, setPending] = useState([]);
    const [filterPending, setFilterPending] = useState([]);
    const [firstRender, setFirstRender] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showMyCasesOnly, setShowMyCasesOnly] = useState(false);

    const sortChatsByLatestMessage = (chats) => {
        return [...chats].sort((a, b) => {
            const aTime = new Date(a.latest_message?.created_at || 0).getTime();
            const bTime = new Date(b.latest_message?.created_at || 0).getTime();
            return bTime - aTime;
        });
    };

    const sortChatsByCreatedTimeAsc = (chats) => {
        return [...chats].sort((a, b) => {
            const aTime = new Date(a.created_at || 0).getTime();
            const bTime = new Date(b.created_at || 0).getTime();
            return aTime - bTime;
        });
    };

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const { data, status } = await MessageListApi(roomId);
                if (status === 200) {
                    // const unreadIds = JSON.parse(localStorage.getItem("unreadCustIds") || "[]");

                    const enrichedProgress = data.progress.map((item) => ({
                        ...item,
                        isUnread: item.isUnread,
                        unread_count: item.unread_count || 0,
                    }));

                    const sortedProgress = sortChatsByLatestMessage(enrichedProgress);
                    const sortedPending = sortChatsByCreatedTimeAsc(data.pending);

                    setProgress(sortedProgress);
                    setPending(sortedPending);
                    setFilterPending(sortedPending);

                    const lastRoom = localStorage.getItem("lastRoomId");
                    const savedCaseFilter = JSON.parse(localStorage.getItem("showMyCasesOnly") || "false");

                    if (lastRoom === roomId && savedCaseFilter) {
                        // ถ้าอยู่ห้องเดิมและเคยเลือก "เคสของฉัน"
                        const myCases = sortedProgress.filter(
                            (data) => data.empCode === user.empCode || data.empId === user.id
                        );
                        setFilterProgress(myCases);
                        setShowMyCasesOnly(true);
                    } else {
                        // ถ้าเปลี่ยนห้องใหม่หรือยังไม่เคยเลือก
                        setFilterProgress(sortedProgress);
                        setShowMyCasesOnly(false);
                        localStorage.setItem("showMyCasesOnly", "false");
                    }

                    // บันทึก roomId ล่าสุดไว้
                    localStorage.setItem("lastRoomId", roomId);

                    const count = sortedProgress.filter((item) => item.isUnread).length;
                    setUnRead(count || 0);
                }
            } catch (error) {
                AlertDiaLog({ title: "เกิดข้อผิดพลาด" });
            } finally {
                setLoading(false);
            }
        };

        setLoading(true);
        fetchChats().then();
    }, [roomId, user.empCode]);

    useEffect(() => {
        if (firstRender) {
            setFirstRender(false);
            return;
        }

        if (
            !notification ||
            !notification.activeConversation ||
            !notification.Rate ||
            !notification.message
        ) {
            return;
        }

        const isCustomerSender = notification.message.sender && notification.message.sender.custId;

        if (notification.activeConversation.roomId === roomId) {
            let unreadIds = JSON.parse(localStorage.getItem("unreadCustIds") || "[]");
            if (isCustomerSender) {
                if (!unreadIds.includes(notification.Rate.custId)) {
                    unreadIds.push(notification.Rate.custId);
                }
            } else {
                // ถ้าพนักงานตอบ ให้เอา ID ออกจาก unread list ทันที
                unreadIds = unreadIds.filter(id => id !== notification.Rate.custId);
            }
            localStorage.setItem("unreadCustIds", JSON.stringify(unreadIds));

            if (notification.Rate.status === "progress") {
                // === Progress ===
                const find = filterProgress.find(
                    (item) => item.custId === notification.Rate.custId
                );

                if (find) {
                    const updatedProgress = filterProgress.map((item) => {
                        if (item.id === notification.activeConversation.id) {
                            return {
                                ...item,
                                isUnread: isCustomerSender ? true : false,
                                unread_count: isCustomerSender ? (item.unread_count || 0) + 1 : 0,
                                latest_message: {
                                    ...item.latest_message,
                                    sender: notification.message.sender,
                                    contentType: notification.message.contentType,
                                    content: notification.message.content,
                                    sender_id: notification.message.sender_id,
                                    created_at: notification.message.created_at,
                                },
                            };
                        }
                        return item;
                    });

                    const sortedUpdatedProgress = sortChatsByLatestMessage(updatedProgress);
                    setFilterProgress(sortedUpdatedProgress);
                    setProgress(sortedUpdatedProgress);

                } else {
                    const newChatItem = {
                        id: notification.activeConversation.id,
                        custId: notification.customer.custId,
                        custName: notification.customer.custName,
                        avatar: notification.customer.avatar,
                        description: notification.customer.description,
                        empCode: notification.activeConversation.empCode,
                        empName: notification.activeConversation.empName,
                        latest_message: {
                            contentType: notification.message.contentType,
                            content: notification.message.content,
                            created_at: notification.message.created_at,
                            sender_id: notification.message.sender_id,
                            sender: notification.message.sender,
                        },
                        rateRef: notification.Rate.id,
                        receiveAt: notification.activeConversation.receiveAt,
                        startTime: notification.activeConversation.startTime,
                        updated_at: notification.activeConversation.updated_at,
                        unread_count: isCustomerSender ? 1 : 0,
                        isUnread: isCustomerSender ? true : false,
                    };

                    const newProgress = filterProgress.concat(newChatItem);
                    const sortedNewProgress = sortChatsByLatestMessage(newProgress);
                    setFilterProgress(sortedNewProgress);
                    setProgress(sortedNewProgress);
                }

                const deletePending = filterPending.filter(
                    (item) => item.custId !== notification.Rate.custId
                );
                setFilterPending(deletePending);
            } else if (notification.Rate.status === "pending") {
                // === Pending ===
                const find = filterPending.find(
                    (item) => item.custId === notification.Rate.custId
                );

                if (find) {
                    const updatedPending = filterPending.map((item) => {
                        if (item.id === notification.activeConversation.id) {
                            return {
                                ...item,
                                isUnread: isCustomerSender ? true : false,
                                unread_count: isCustomerSender ? (item.unread_count || 0) + 1 : 0,
                                latest_message: {
                                    ...item.latest_message,
                                    sender: notification.message.sender,
                                    contentType: notification.message.contentType,
                                    content: notification.message.content,
                                    sender_id: notification.message.sender_id,
                                    created_at: notification.message.created_at,
                                },
                            };
                        }
                        return item;
                    });

                    const sortedUpdatedPending = sortChatsByCreatedTimeAsc(updatedPending);
                    setFilterPending(sortedUpdatedPending);
                    setPending(sortedUpdatedPending);

                } else {
                    const newChatItem = {
                        id: notification.activeConversation.id,
                        custId: notification.customer.custId,
                        custName: notification.customer.custName,
                        avatar: notification.customer.avatar,
                        description: notification.customer.description,
                        empCode: notification.activeConversation.empCode,
                        empName: notification.activeConversation.empName,
                        latest_message: {
                            contentType: notification.message.contentType,
                            content: notification.message.content,
                            created_at: notification.message.created_at,
                            sender_id: notification.message.sender_id,
                            sender: notification.message.sender,
                        },
                        rateRef: notification.Rate.id,
                        receiveAt: notification.activeConversation.receiveAt,
                        startTime: notification.activeConversation.startTime,
                        updated_at: notification.activeConversation.updated_at,
                        unread_count: isCustomerSender ? 1 : 0,
                        isUnread: isCustomerSender ? true : false,
                    };
                    const newPending = filterPending.concat(newChatItem);

                    const sortedNewPending = sortChatsByCreatedTimeAsc(newPending);
                    setFilterPending(sortedNewPending);
                    setPending(sortedNewPending);
                }

                const deleteProgress = filterProgress.filter(
                    (item) => item.custId !== notification.Rate.custId
                );
                setFilterProgress(deleteProgress);
            } else {
                removeCase();
            }
        } else {
            let unreadIds = JSON.parse(localStorage.getItem("unreadCustIds") || "[]");
            if (isCustomerSender) {
                if (!unreadIds.includes(notification.Rate.custId)) {
                    unreadIds.push(notification.Rate.custId);
                }
            } else {
                unreadIds = unreadIds.filter(id => id !== notification.Rate.custId);
            }
            localStorage.setItem("unreadCustIds", JSON.stringify(unreadIds));
        }
    }, [notification]);

    const removeCase = () => {
        if (!notification || !notification.Rate) return;
        const deleteProgress = filterProgress.filter(
            (item) => item.custId !== notification.Rate.custId
        );
        setFilterProgress(deleteProgress);
        const deletePending = filterPending.filter(
            (item) => item.custId !== notification.Rate.custId
        );
        setFilterPending(deletePending);
    };

    return (
        <>
            {
                loading ? (
                    <CircularProgress />
                ) : (
                    <Box
                        component="main"
                        className="MainContent"
                        sx={{
                            backgroundColor: 'background.body',
                            p: 2,
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            minWidth: 0,
                            height: '100dvh',
                            gap: 2,
                        }}
                    >
                        <Box sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0,
                            overflow: 'hidden'
                        }}>
                            <OrderTable
                                roomId={roomId}
                                progress={progress}
                                filterProgress={filterProgress}
                                setFilterProgress={setFilterProgress}
                                showMyCasesOnly={showMyCasesOnly}
                                setShowMyCasesOnly={setShowMyCasesOnly}
                            />
                        </Box>

                        <Box sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0,
                            overflow: 'hidden'
                        }}>
                            <PendingTableNew
                                setFilterPending={setFilterPending}
                                filterPending={filterPending}
                                disable={roomId === "ROOM00"}
                                pending={pending}
                                roomId={roomId}
                                roomName={roomName}
                            />
                        </Box>
                    </Box>
                )
            }
        </>
    );
}