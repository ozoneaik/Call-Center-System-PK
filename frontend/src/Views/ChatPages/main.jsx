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

    // สร้างฟังก์ชันสำหรับจัดเรียงเพื่อนำไปใช้ซ้ำ
    const sortChatsByLatestMessage = (chats) => {
        return [...chats].sort((a, b) => {
            const aTime = new Date(a.latest_message?.created_at || 0).getTime();
            const bTime = new Date(b.latest_message?.created_at || 0).getTime();
            return bTime - aTime;
        });
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

                    // ใช้ฟังก์ชันจัดเรียงที่สร้างไว้
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

                if (find) {
                    let unreadIds = JSON.parse(
                        localStorage.getItem("unreadCustIds") || "[]"
                    );
                    if (!unreadIds.includes(notification.Rate.custId)) {
                        unreadIds.push(notification.Rate.custId);
                        localStorage.setItem("unreadCustIds", JSON.stringify(unreadIds));
                    }

                    const updatedProgress = filterProgress.map((item) => {
                        if (item.id === notification.activeConversation.id) {
                            return {
                                ...item,
                                isUnread: true,
                                latest_message: {
                                    ...item.latest_message,
                                    sender : notification.message.sender,
                                    contentType: notification.message.contentType,
                                    content: notification.message.content,
                                    sender_id: notification.message.sender_id,
                                    created_at: notification.message.created_at,
                                },
                            };
                        }
                        return item;
                    });

                    // จัดเรียง array ใหม่ก่อน set state
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
                            sender : notification.message.sender,
                        },
                        rateRef: notification.Rate.id,
                        receiveAt: notification.activeConversation.receiveAt,
                        startTime: notification.activeConversation.startTime,
                        updated_at: notification.activeConversation.updated_at,
                        isUnread: true,
                    };
                    const newProgress = filterProgress.concat(newChatItem);

                    // จัดเรียง array ใหม่ก่อน set state
                    const sortedNewProgress = sortChatsByLatestMessage(newProgress);
                    setFilterProgress(sortedNewProgress);
                    setProgress(sortedNewProgress);
                }

                const deletePending = filterPending.filter(
                    (item) => item.custId !== notification.Rate.custId
                );
                setFilterPending(deletePending);
            } else if (notification.Rate.status === "pending") {
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

                    const updatedPending = filterPending.map((item) => {
                        if (item.id === notification.activeConversation.id) {
                            return {
                                ...item,
                                isUnread: true,
                                latest_message: {
                                    ...item.latest_message,
                                    sender : notification.message.sender,
                                    contentType: notification.message.contentType,
                                    content: notification.message.content,
                                    sender_id: notification.message.sender_id,
                                    created_at: notification.message.created_at,
                                },
                            };
                        }
                        return item;
                    });

                    // จัดเรียง array ใหม่ก่อน set state
                    const sortedUpdatedPending = sortChatsByLatestMessage(updatedPending);
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
                            sender : notification.message.sender,
                        },
                        rateRef: notification.Rate.id,
                        receiveAt: notification.activeConversation.receiveAt,
                        startTime: notification.activeConversation.startTime,
                        updated_at: notification.activeConversation.updated_at,
                        isUnread: true,
                    };
                    const newPending = filterPending.concat(newChatItem);

                    // จัดเรียง array ใหม่ก่อน set state
                    const sortedNewPending = sortChatsByLatestMessage(newPending);
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
            removeCase();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const ContentComponent = () => (
        <Stack
            direction='column'
            spacing={2}
            sx={{
                height: 'calc(100dvh - 140px)',
                overflow: 'hidden'
            }}
        >
            <Box>
                <ProgressTable
                    roomId={roomId}
                    progress={progress}
                    filterProgress={filterProgress}
                    setFilterProgress={setFilterProgress}
                    showMyCasesOnly={showMyCasesOnly}
                    setShowMyCasesOnly={setShowMyCasesOnly}
                />
            </Box>
            <Box>
                <PendingTable
                    setFilterPending={setFilterPending}
                    filterPending={filterPending}
                    disable={roomId === "ROOM00"}
                    pending={pending}
                    roomId={roomId}
                    roomName={roomName}
                />
            </Box>
        </Stack>
    );

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
                        {/* <ContentComponent/> */}
                        {/* แบ่งพื้นที่เท่าๆ กัน 50/50 */}
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