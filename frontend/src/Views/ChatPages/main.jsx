import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { MessageListApi } from "../../Api/Messages.js";
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import { useNotification } from "../../context/NotiContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { CircularProgress, Box, } from "@mui/joy";
import OrderTable from "./ProgressTableNew.jsx";
import PendingTableNew from "./PendingTableNew.jsx";

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

    const addNewCaseAtBottomSimple = (existingChats, newChatItem) => {
        const existsIndex = existingChats.findIndex(chat => chat.custId === newChatItem.custId);

        if (existsIndex >= 0) {
            const updatedChats = [...existingChats];
            updatedChats[existsIndex] = { ...existingChats[existsIndex], ...newChatItem };
            return updatedChats;
        } else {
            return [...existingChats, newChatItem];
        }
    };

    const updateExistingCase = (chats, updateData, custId) => {
        return chats.map((item) =>
            item.custId === custId ? { ...item, ...updateData } : item
        );
    };

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const { data, status } = await MessageListApi(roomId);
                if (status === 200) {
                    const unreadIds = JSON.parse(
                        localStorage.getItem("unreadCustIds") || "[]"
                    );

                    const enrichedProgress = data.progress.map((item) => ({
                        ...item,
                        isUnread: unreadIds.includes(item.custId),
                    }));

                    const sortedProgress = sortChatsByLatestMessage(enrichedProgress);

                    setProgress(sortedProgress);
                    setFilterProgress(sortedProgress);
                    setPending(data.pending);
                    setFilterPending(data.pending);

                    const count = sortedProgress.filter(
                        (item) => item.empCode === user.empCode
                    );
                    setUnRead(count ? count.length : 0);
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
        console.log('notification >>> ', notification);
        if (notification.activeConversation.roomId === roomId) {
            if (notification.Rate.status === "progress") {
                const find = filterProgress.find(
                    (item) => item.custId === notification.Rate.custId
                );
                let unreadIds = JSON.parse(localStorage.getItem("unreadCustIds") || "[]");

                if (find) {
                    if (!unreadIds.includes(notification.Rate.custId)) {
                        unreadIds.push(notification.Rate.custId);
                        localStorage.setItem("unreadCustIds", JSON.stringify(unreadIds));
                    }

                    const updatedData = {
                        isUnread: true,
                        latest_message: {
                            ...find.latest_message,
                            sender: notification.message.sender,
                            contentType: notification.message.contentType,
                            content: notification.message.content,
                            sender_id: notification.message.sender_id,
                            created_at: notification.message.created_at,
                        },
                    };

                    const updatedProgress = updateExistingCase(filterProgress, updatedData, notification.Rate.custId);
                    const sortedUpdated = sortChatsByLatestMessage(updatedProgress);

                    setFilterProgress(sortedUpdated);
                    setProgress(sortedUpdated);
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
                        isUnread: true,
                    };

                    if (!unreadIds.includes(newChatItem.custId)) {
                        unreadIds.push(newChatItem.custId);
                        localStorage.setItem("unreadCustIds", JSON.stringify(unreadIds));
                    }

                    const newProgress = [...filterProgress, newChatItem];

                    setFilterProgress(newProgress);
                    setProgress(newProgress);
                }
                const deletePending = filterPending.filter(
                    (item) => item.custId !== notification.Rate.custId
                );
                setFilterPending(deletePending);
            }
            else if (notification.Rate.status === "pending") {
                const find = filterPending.find(
                    (item) => item.custId === notification.Rate.custId
                );

                if (find) {
                    let unreadIds = JSON.parse(
                        localStorage.getItem("unreadCustIds") || "[]"
                    );
                    if (!unreadIds.includes(notification.Rate.custId)) {
                        unreadIds.push(notification.Rate.custId);
                        localStorage.setItem("unreadCustIds", JSON.stringify(unreadIds));
                    }

                    const updatedData = {
                        isUnread: true,
                        latest_message: {
                            ...find.latest_message,
                            sender: notification.message.sender,
                            contentType: notification.message.contentType,
                            content: notification.message.content,
                            sender_id: notification.message.sender_id,
                            created_at: notification.message.created_at,
                        },
                    };

                    const updatedPending = updateExistingCase(filterPending, updatedData, notification.Rate.custId);
                    setFilterPending(updatedPending);
                    setPending(updatedPending);

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
                        isUnread: true,
                    };

                    const newPending = addNewCaseAtBottomSimple(filterPending, newChatItem);
                    setFilterPending(newPending);
                    setPending(newPending);
                }

                const deleteProgress = filterProgress.filter(
                    (item) => item.custId !== notification.Rate.custId
                );
                setFilterProgress(deleteProgress);
            } else {
                removeCase();
            }
        } else {
            removeCase();
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