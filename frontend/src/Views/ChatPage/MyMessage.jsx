import Sheet from '@mui/joy/Sheet';
import MessagesPane from "./MessagePane.jsx";
import ChatsPane from './ChatsPane';
import {useEffect, useState} from "react";
import {MessageAllAPi} from "../../Api/sendMessage.js";
import echo from "../Test/echo.js";
import {newMessage} from "./newMessage.jsx";

export default function MyMessage() {
    const [selectedChat, setSelectedChat] = useState();
    const [Ischats, setChats] = useState([]);

    useEffect(()=>{
        getMessages().then(()=>console.log('getMessages'));
        newMessage({onPassed : (res)=> {
            getMessages().then(()=>{});
        }});
    },[])
    const getMessages = async () => {
        const id = localStorage.getItem("selectChat") ? localStorage.getItem("selectChat") : 0;
        const {data,status} = await MessageAllAPi();
        setSelectedChat(data.chats[id])
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