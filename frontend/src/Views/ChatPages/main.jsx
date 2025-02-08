import { useParams } from "react-router-dom";
import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import { useEffect, useState } from "react";
import {MessageListApi} from "../../Api/Messages.js";
import Box from "@mui/joy/Box";
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import { useNotification } from "../../context/NotiContext.jsx";
import { PendingTable } from "./PendingTable.jsx";
import { ProgressTable } from "./ProgressTable.jsx";
import Sheet from "@mui/joy/Sheet";
import { useAuth } from "../../context/AuthContext.jsx";
import { CircularProgress } from "@mui/joy";

export default function MainChat() {
    const { user } = useAuth()
    const { notification, setUnRead } = useNotification();
    const { roomId, roomName } = useParams();
    const BreadcrumbsPath = [{ name: roomName }, { name: 'รายละเอียด' }];
    const [progress, setProgress] = useState([]);
    const [filterProgress, setFilterProgress] = useState([]);
    const [pending, setPending] = useState([]);
    const [filterPending, setFilterPending] = useState([]);
    const [firstRender, setFirstRender] = useState(true);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        
        const fetchChats = async () => {
            try {
                const { data, status } = await MessageListApi(roomId);
                console.log(data);
                if (status === 200) {
                    setProgress(data.progress);
                    setFilterProgress(data.progress);
                    setPending(data.pending);
                    setFilterPending(data.pending);
                    const count = data.progress.filter((item) => item.empCode === user.empCode);
                    
                    setUnRead(count ? count.length : 0);
                } else console.log('ไม่มีรายการ MessageList')
            } catch (error) {
                AlertDiaLog({ title: 'เกิดข้อผิดพลาด' })
            } finally {
                setLoading(false);
            }
        }
        setLoading(true);
        fetchChats().then();
       
    }, [roomId]);

    useEffect(() => {
        console.log(notification)
        if (firstRender) {
            setFirstRender(false);
            return ;
        }
        if(notification.activeConversation.roomId === roomId) {
            if (notification.Rate.status === 'progress') {
                const find = filterProgress.find((item) => item.custId === notification.Rate.custId);
                if(find){
                    const updatedProgress = filterProgress.map((item) => {
                        if (item.id === notification.activeConversation.id) {
                            return {
                                ...item,
                                latest_message : {
                                    ...item.latest_message,
                                    contentType: notification.message.contentType,
                                    content: notification.message.content,
                                }
                            };
                        }
                        return item;
                    });
                    setFilterProgress(updatedProgress);
                }else{
                    // เพิ่มรายการใหม่
                    const newProgress = filterProgress.concat({
                        id: notification.activeConversation.id,
                        custId: notification.customer.custId,
                        custName: notification.customer.custName,
                        avatar: notification.customer.avatar,
                        description: notification.customer.description,
                        empCode : notification.activeConversation.empCode,
                        empName : notification.activeConversation.empName,
                        latest_message: {
                            contentType: notification.message.contentType,
                            content: notification.message.content,
                            created_at : notification.message.created_at,
                        },
                        rateRef : notification.Rate.id,
                        receiveAt : notification.activeConversation.receiveAt,
                        startTime : notification.activeConversation.startTime,
                        updated_at : notification.activeConversation.updated_at,
                    })
                    setFilterProgress(newProgress);
                }
                const deletePending = filterPending.filter((item) => item.custId !== notification.Rate.custId);
                setFilterPending(deletePending);
            }else if(notification.Rate.status === 'pending'){
                const find = filterPending.find((item) => item.custId === notification.Rate.custId);
                if(find){
                    const updatedPending = filterPending.map((item) => {
                        if (item.id === notification.activeConversation.id) {
                            return {
                                ...item,
                                latest_message : {
                                    ...item.latest_message,
                                    contentType: notification.message.contentType,
                                    content: notification.message.content,
                                }
                            };
                        }
                        return item;
                    });
                    setFilterPending(updatedPending);
                }else{
                    // เพิ่มรายการใหม่
                    const newProgress = filterPending.concat({
                        id: notification.activeConversation.id,
                        custId: notification.customer.custId,
                        custName: notification.customer.custName,
                        avatar: notification.customer.avatar,
                        description: notification.customer.description,
                        empCode : null,
                        empName : null,
                        from_empCode : notification.activeConversation.from_empCode,
                        from_roomId : notification.activeConversation.from_roomId,
                        roomName : notification.activeConversation.roomName,
                        latest_message: {
                            contentType: notification.message.contentType,
                            content: notification.message.content,
                            created_at : notification.message.created_at,
                        },
                        rateRef : notification.Rate.id,
                        receiveAt : null,
                        startTime : null,
                        created_at : notification.activeConversation.created_at,
                        updated_at : notification.activeConversation.updated_at,
                    })
                    setFilterPending(newProgress);
                    console.log(newProgress)
                }
                const deleteProgress = filterProgress.filter((item) => item.custId !== notification.Rate.custId);
                setFilterProgress(deleteProgress);
            }else removeCase();
        }else removeCase();
    },[notification])

    const removeCase = () => {
        const deleteProgress = filterProgress.filter((item) => item.custId !== notification.Rate.custId);
        setFilterProgress(deleteProgress);
        const deletePending = filterPending.filter((item) => item.custId !== notification.Rate.custId);
        setFilterPending(deletePending);
    }

    const ContentComponent = () => (
        <>
            <ProgressTable
                dataset={progress}
                roomId={roomId}
                roomName={roomName}
                filterProgress={filterProgress}
                setFilterProgress={setFilterProgress}
                progress={progress}
            />
            <PendingTable
                setFilterPending={setFilterPending}
                filterPending={filterPending}
                disable={roomId === 'ROOM00'}
                pending={pending}
                roomId={roomId}
                roomName={roomName}
            />
        </>
    )
    return (
        <>
            <Sheet sx={ChatPageStyle.Layout}>
                <Box component="main" sx={ChatPageStyle.MainContent}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <BreadcrumbsComponent list={BreadcrumbsPath} />
                    </Box>
                    {loading ? <CircularProgress/> : <ContentComponent />}
                </Box>
            </Sheet>
        </>
    )
}