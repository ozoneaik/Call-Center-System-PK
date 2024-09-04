import Box from '@mui/joy/Box';
import Sheet from '@mui/joy/Sheet';
import Stack from '@mui/joy/Stack';
import AvatarWithStatus from './AvatarWithStatus';
import ChatBubble from './ChatBubble';
import MessageInput from './MessageInput';
import MessagesPaneHeader from './MessagesPaneHeader';
import {useEffect, useState} from "react";
import echo from "../Test/echo.js";
import {MessageSelectApi, SendMessageApi} from "../../Api/sendMessage.js";
import {AlertStandard} from "../../Dialogs/Alert.js";
import {useAuth} from "../../Contexts/AuthContext.jsx";

export default function MessagesPane(props) {
    const {chat} = props;
    const [chatMessages, setChatMessages] = useState([]);
    const [sender, setSender] = useState();
    const [textAreaValue, setTextAreaValue] = useState('');
    const {user} = useAuth();


    useEffect(() => {
        console.log(chat.sender.custId);
        getMessage(chat.sender.custId).then(()=> console.log('getMessage'));
        setSender(chat.sender);
    }, [chat]);

    useEffect(() => {
        if (sender) {
            const channel = echo.channel(`chat.${sender.custId}`);
            channel.listen('.my-event', (event) => {
                console.log('Message received:', event.message);
                if (event.message) {
                    CustSend(event.message);
                }
            });

            return () => {
                channel.stopListening('.my-event');
                echo.leaveChannel(`chat.${sender.custId}`);
            };
        }
    }, [sender]);

    const getMessage = async (id) => {
        const {data,status} = await MessageSelectApi(id);
        if (status === 200) {
            setChatMessages(data.chats.messages);
        }
    }

    // เมื่อกดส่งข้อความ
    const handleSubmit = async () => {
        const {data, status} = await SendMessageApi(textAreaValue, sender.custId);
        console.log(data, status);
        if (status !== 200) {
            AlertStandard({text: data.message});
        } else {
            const newId = chatMessages.length.toString();
            setChatMessages([
                ...chatMessages,
                {id: newId, sender: user, content: textAreaValue, created_at: new Date().toString()},
            ]);
            setTextAreaValue('');
        }
    };

    const CustSend = (message) => {
        console.log('CustSend >> ', sender.custId);
        setChatMessages((prevMessages) => {
            const newId = prevMessages.length.toString();
            return [
                ...prevMessages,
                {id: newId, content: message, sender: chat.sender, created_at: new Date().toString()},
            ];
        });
    };

    const ChatPane = ({message, index}) => {
        const isYou = message.sender.code === user.code;
        return (
            <>
                <Stack
                    key={index} direction="row" spacing={2}
                    sx={{flexDirection: isYou ? 'row-reverse' : 'row'}}
                >
                    {message.sender.code !== user.code && (
                        <AvatarWithStatus online={message.sender.online} src={message.sender.avatar}/>
                    )}
                    <ChatBubble variant={isYou ? 'sent' : 'received'} {...message} />
                </Stack>
            </>
        );
    };

    return (
        <Sheet
            sx={{
                height: {xs: 'calc(100dvh - var(--Header-height))', md: '100dvh'},
                display: 'flex', flexDirection: 'column', backgroundColor: 'background.level1',
            }}
        >
            <MessagesPaneHeader sender={chat.sender}/>
            <Box
                sx={{
                    display: 'flex', flex: 1, minHeight: 0, px: 2, py: 3,
                    overflowY: 'scroll', flexDirection: 'column-reverse',
                }}
            >
                <Stack spacing={2} sx={{justifyContent: 'flex-end'}}>
                    {
                        chatMessages.length > 0 && (
                            chatMessages.map((message, index) => (
                                <ChatPane key={index} index={index} message={message}/>
                            ))
                        )
                    }
                </Stack>
            </Box>
            <MessageInput textAreaValue={textAreaValue} setTextAreaValue={setTextAreaValue} onSubmit={handleSubmit}/>
        </Sheet>
    );
}
