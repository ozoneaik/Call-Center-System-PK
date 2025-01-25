import { useParams } from "react-router-dom";
import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import { useEffect, useState } from "react";
import { MessageListApi } from "../../api/Messages.js";
import Box from "@mui/joy/Box";
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import BreadcrumbsComponent from "../../components/Breadcrumbs.jsx";
import { useNotification } from "../../context/NotiContext.jsx";
import { PendingTable } from "./PendingTable.jsx";
import { ProgressTable } from "./ProgressTable.jsx";
import Sheet from "@mui/joy/Sheet";
import { useAuth } from "../../context/AuthContext.jsx";

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
                setTimeout(() => {
                }, 500)
            }
        }
        fetchChats().then();
    }, [roomId]);

    useEffect(() => {
        if (firstRender) {
            console.log('firstRender');
            setFirstRender(false);
            return ;
        }
        if(notification.activeConversation.roomId === roomId) {
            console.log('notification.activeConversation.roomId');
            if (notification.Rate.status === 'progress') {
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
                setFilterProgress(updatedProgress); // อัปเดตสถานะใหม่
            }else{

            }
        }
        console.log(notification);
    },[notification])

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
                    <ContentComponent />
                </Box>
            </Sheet>
        </>
    )
}