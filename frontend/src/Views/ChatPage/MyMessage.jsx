import Sheet from '@mui/joy/Sheet';
import MessagesPane from "./MessagePane.jsx";
import ChatsPane from './ChatsPane';
import {useEffect, useState} from "react";
import {MessageAllAPi} from "../../Api/sendMessage.js";
import {newMessage} from "./newMessage.jsx";
import {useParams} from "react-router-dom";
import {chatRoomListApi} from "../../Api/chatRooms.js";
import NewCustDm from "../NewCustDmPage/NewCustDm.jsx";

export default function MyMessage() {
    const {id} = useParams();
    const [selectedChat, setSelectedChat] = useState();
    const [Ischats, setChats] = useState([]);
    const [chatRooms, setChatRooms] = useState([]);
    const Id = localStorage.getItem("selectChat") ? localStorage.getItem("selectChat") : 'Main';

    useEffect(() => {
        getMessages().then();
        getChatRooms().then();
        newMessage({
            onPassed: (status, event) => {
                console.log(status, event)
                updateMessages(event);
            }
        });
    }, [id]);

    const getMessages = async () => {
        const {data} = await MessageAllAPi(id);
        console.log('data.chat', data.chats)
        setSelectedChat(data.chats[Id]);
        setChats(data.chats);
    };

    const getChatRooms = async () => {
        const {data, status} = await chatRoomListApi();
        if (status === 200) {
            setChatRooms(data.chatRooms);
        }
    };

    const updateMessages = (event) => {
        const newMessageData = {
            id: event.id,
            custId: event.custId,
            custName: event.custName,
            content: event.content,
            contentType: event.contentType,
        };
        console.log('newMessageData', newMessageData);

        setChats(prevChats => {
            const updatedChats = [...prevChats];
            const chatIndex = updatedChats.findIndex(chat => chat.sender.id === event.id);

            console.log('prevChats', prevChats);

            if (chatIndex !== -1) {
                updatedChats[chatIndex].messages[0].content = newMessageData.content;
                updatedChats[chatIndex].messages[0].contentType = newMessageData.contentType;
            }

            return updatedChats;
        });
        setSelectedChat(prevChat => ({
            ...prevChat,
            messages: [...prevChat.messages, newMessageData]
        }));
    };

    return (
        <>
            <Sheet
                sx={{
                    flex: 1, width: '100%', mx: 'auto', pt: {xs: 'var(--Header-height)', md: 0}, display: 'grid',
                    gridTemplateColumns: {xs: '1fr', sm: 'minmax(min-content, min(30%, 400px)) 1fr',},
                }}
            >
                <Sheet
                    sx={{
                        position: {xs: 'fixed', sm: 'sticky'},
                        transform: {xs: 'translateX(calc(100% * (var(--MessagesPane-slideIn, 0) - 1)))', sm: 'none',},
                        transition: 'transform 0.4s, width 0.4s', zIndex: 100, width: '100%', top: 52,
                    }}
                >
                    {
                        Ischats.length > 0 ? selectedChat && (
                            <ChatsPane chatRooms={chatRooms} roomId={id} chats={Ischats}
                                       selectedChatId={selectedChat.id} setSelectedChat={setSelectedChat}/>
                        ) : <ChatsPane chatRooms={chatRooms} roomId={id} chats={[]} selectedChatId={0}
                                       setSelectedChat={0}/>
                    }
                    test
                </Sheet>
                {
                    Id !== '0' ? (
                        selectedChat && <MessagesPane chat={selectedChat}/>
                    ) : (
                        <Sheet
                            sx={{
                                height: {xs: 'calc(100dvh - var(--Header-height))', md: '100dvh'},
                                display: 'flex', flexDirection: 'column', padding : 2
                            }}
                        >
                            {Id}
                            <NewCustDm/>
                        </Sheet>
                    )
                }
            </Sheet>
        </>
    );
}
