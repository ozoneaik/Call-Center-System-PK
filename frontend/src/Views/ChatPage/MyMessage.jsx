import Sheet from '@mui/joy/Sheet';
import MessagesPane from "./MessagePane.jsx";
import ChatsPane from './ChatsPane';
import {chats} from "../../Components/data.jsx";
import {useEffect, useState} from "react";
import {MessageAllAPi} from "../../Api/sendMessage.js";

export default function MyMessage() {
    const [selectedChat, setSelectedChat] = useState();
    const [Ischats, setChats] = useState([]);

    useEffect(()=>{
        getMessages()
    },[])
    const getMessages = async () => {
        const {data,status} = await MessageAllAPi();
        setSelectedChat(data.chats[0])
        setChats(data.chats);
    }
    return (
        <>
            <Sheet
                sx={{
                    flex: 1, width: '100%', mx: 'auto', pt: { xs: 'var(--Header-height)', md: 0 }, display: 'grid',
                    gridTemplateColumns: {xs: '1fr', sm: 'minmax(min-content, min(30%, 400px)) 1fr',},
                }}
            >
                <Sheet
                    sx={{
                        position: { xs: 'fixed', sm: 'sticky' },
                        transform: {
                            xs: 'translateX(calc(100% * (var(--MessagesPane-slideIn, 0) - 1)))',
                            sm: 'none',
                        },
                        transition: 'transform 0.4s, width 0.4s', zIndex: 100, width: '100%', top: 52,
                    }}
                >
                    {
                        Ischats.length > 0 && selectedChat && (
                            <ChatsPane chats={Ischats} selectedChatId={selectedChat.id} setSelectedChat={setSelectedChat}/>
                        )
                    }
                </Sheet>
                {
                    selectedChat && (
                        <MessagesPane chat={selectedChat} />
                    )
                }
            </Sheet>
        </>
    );
}