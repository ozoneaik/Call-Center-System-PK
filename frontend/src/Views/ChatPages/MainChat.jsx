import {useParams} from "react-router-dom";
import {ChatPageStyle} from "../../styles/ChatPageStyle.js";
import {useEffect, useState} from "react";
import {MessageListApi} from "../../api/Messages.js";
import Box from "@mui/joy/Box";
import {AlertDiaLog} from "../../Dialogs/Alert.js";
import BreadcrumbsComponent from "../../components/Breadcrumbs.jsx";
import {useNotification} from "../../context/NotiContext.jsx";
import {PendingTable} from "./PendingTable.jsx";
import {ProgressTable} from "./ProgressTable.jsx";
import Sheet from "@mui/joy/Sheet";

export default function MainChat() {
    const {notification} = useNotification();
    const {roomId, roomName} = useParams();
    const BreadcrumbsPath = [{name: roomName}, {name: 'รายละเอียด'}];
    const [progress, setProgress] = useState([]);
    const [pending, setPending] = useState([]);
    useEffect(() => {
        const fetchChats = async () => {
            try {
                const {data, status} = await MessageListApi(roomId);
                if (status === 200) {
                    setProgress(data.progress);
                    setPending(data.pending);
                } else console.log('ไม่มีรายการ MessageList')
            } catch (error) {
                AlertDiaLog({title: 'เกิดข้อผิดพลาด'})
            } finally {
                setTimeout(() => {
                }, 500)
            }
        }
        fetchChats().then();
    }, [roomId, notification]);

    const ContentComponent = () => (
        <>
            <ProgressTable dataset={progress}/>
            <PendingTable disable={roomId === 'ROOM00'} dataset={pending}/>
        </>
    )
    return (
        <>
            <Sheet sx={ChatPageStyle.Layout}>
                <Box component="main" sx={ChatPageStyle.MainContent}>
                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                        <BreadcrumbsComponent list={BreadcrumbsPath}/>
                    </Box>
                    <ContentComponent/>
                </Box>
            </Sheet>
        </>
    )
}