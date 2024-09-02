import Box from '@mui/joy/Box';
import Sheet from '@mui/joy/Sheet';
import Stack from '@mui/joy/Stack';
import AvatarWithStatus from './AvatarWithStatus';
import ChatBubble from './ChatBubble';
import MessageInput from './MessageInput';
import MessagesPaneHeader from './MessagesPaneHeader';
import {useEffect, useState} from "react";

import echo from "../Test/echo.js";
import {useParams} from "react-router-dom";
import {SendMessageApi} from "../../Api/sendMessage.js";
import {AlertStandard, AlertWithConfirm} from "../../Dialogs/Alert.js";

export default function MessagesPane(props) {
    const { chat } = props;
    const [chatMessages, setChatMessages] = useState(chat.messages);
    const [textAreaValue, setTextAreaValue] = useState('');

    useEffect(() => {
        console.log('chat props',chat);
        setChatMessages(chat.messages);
        chatSocket();
    }, [chat.messages]);

    const chatSocket = () => {
        const channel = echo.channel(`chat.Ueecf3a08fa18b3864d2d7f50e70933f4`);
        channel.listen('.my-event', (event) => {
            console.log('Message received:',event.message);
            if (event.message){
                CustSend(event.message);
            }
        });
        return () => {
            channel.stopListening('.my-event');
            echo.leaveChannel('chat.{id}');
        };
    }

    // เมื่อกดส่งข้อความ
    const handelSubmit = async () => {
        const {data,status} = await SendMessageApi(textAreaValue,'Ueecf3a08fa18b3864d2d7f50e70933f4');
        if (status !== 200){
            AlertStandard({text: data.message});
        }else{
            const newId = chatMessages.length ;
            const newIdString = newId.toString();
            setChatMessages([
                ...chatMessages,
                {id: newIdString, sender: 'You', content: textAreaValue, timestamp: 'Just now',},
            ]);
            setTextAreaValue('');
        }
    }

    const CustSend = (message) => {
        const sender = chat.sender;
        setChatMessages((prevMessages) => {
            const newId = prevMessages.length;
            const newIdString = newId.toString();
            return [
                ...prevMessages,
                { id: newIdString, content: message, sender: sender, timestamp: 'Just now' },
            ];
        });
    };

    return (
        <Sheet
            sx={{
                height: { xs: 'calc(100dvh - var(--Header-height))', md: '100dvh' },
                display: 'flex', flexDirection: 'column',
                backgroundColor: 'background.level1',
            }}
        >
            <MessagesPaneHeader sender={chat.sender} />
            <Box
                sx={{
                    display: 'flex', flex: 1, minHeight: 0, px: 2, py: 3,
                    overflowY: 'scroll', flexDirection: 'column-reverse',
                }}
            >
                <Stack spacing={2} sx={{ justifyContent: 'flex-end' }}>
                    {chatMessages.map((message, index) => {
                        const isYou = message.sender === 'You';
                        return (
                            <Stack
                                key={index} direction="row" spacing={2}
                                sx={{ flexDirection: isYou ? 'row-reverse' : 'row' }}
                            >
                                {message.sender !== 'You' && (
                                    <AvatarWithStatus online={message.sender.online} src={message.sender.avatar}/>
                                )}
                                <ChatBubble variant={isYou ? 'sent' : 'received'} {...message} />
                            </Stack>
                        );
                    })}
                </Stack>
            </Box>
            <MessageInput textAreaValue={textAreaValue} setTextAreaValue={setTextAreaValue} onSubmit={handelSubmit}/>
        </Sheet>
    );
}