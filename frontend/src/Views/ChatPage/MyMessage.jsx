import Sheet from '@mui/joy/Sheet';
import MessagesPane from "./MessagePane.jsx";
import ChatsPane from './ChatsPane';
import {useEffect, useState} from "react";
import {MessageAllAPi} from "../../Api/sendMessage.js";
import {newMessage} from "./newMessage.jsx";
import {useParams} from "react-router-dom";
import {chatRoomListApi} from "../../Api/chatRooms.js";
import NewCustDm from "../NewCustDmPage/NewCustDm.jsx";
import {MyMessageChatPane, MyMessageNewDm, MyMessageSheet} from "../../assets/styles/MyMessageStyle.js";

export default function MyMessage() {
    const {id} = useParams();
    const [selectedChat, setSelectedChat] = useState();
    const [Ischats, setChats] = useState([]);
    const [chatRooms, setChatRooms] = useState([]);
    const Id = localStorage.getItem("selectChat") ? localStorage.getItem("selectChat") : '0';

    useEffect(() => {
        getMessages().then();
        getChatRooms().then();
        newMessage({
            onPassed: (status, event) => {
                updateMessages(event);
            }
        });
    }, [id]);

    const getMessages = async () => {
        const {data} = await MessageAllAPi(id);
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
        setChats(prevChats => {
            const updatedChats = [...prevChats];
            console.log(updatedChats, event.id)
            const chatIndex = updatedChats.findIndex(chat => chat.sender.id === event.id);
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
            <Sheet sx={MyMessageSheet}>
                <Sheet sx={MyMessageChatPane}>
                    {
                        Ischats.length > 0 ? selectedChat && (
                            <ChatsPane
                                chatRooms={chatRooms}
                                roomId={id}
                                chats={Ischats}
                                selectedChatId={selectedChat.id}
                                setSelectedChat={setSelectedChat}>
                            </ChatsPane>
                        ) : (
                            <ChatsPane
                                chatRooms={chatRooms}
                                roomId={id}
                                chats={[]}
                                selectedChatId={0}
                                setSelectedChat={0}>
                            </ChatsPane>
                        )
                    }
                </Sheet>
                {
                    Id !== '0' ? (
                        selectedChat && <MessagesPane chat={selectedChat}/>
                    ) : (
                        <Sheet sx={MyMessageNewDm}>
                            <NewCustDm chatRooms={chatRooms} setSelectedChat={setSelectedChat}/>
                        </Sheet>
                    )
                }
            </Sheet>
        </>
    );
}
