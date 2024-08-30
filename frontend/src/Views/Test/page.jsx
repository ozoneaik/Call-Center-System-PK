import React, { useEffect, useState } from 'react';
import echo from './echo';
import {useParams} from "react-router-dom";

const TestPage = () => {
    const [messages, setMessages] = useState([]);
    const {id} = useParams();

    useEffect(() => {
        // const channel = echo.channel('notifications');

        const channel = echo.channel(`chat.${id}`);
        // Listen for 'my-event' instead of 'MessageSent'
        channel.listen('.my-event', (event) => {
            console.log('Message received:',event.message); // Debug log
            setMessages((prevMessages) => [...prevMessages, event.message]);
        });

        return () => {
            channel.stopListening('.my-event');
            echo.leaveChannel('chat.{id}');
        };
    }, []);

    return (
        <div>
            id room chat : {id}
            <div>
                {messages.map((msg, index) => (
                    <div key={index}>{msg}</div>
                ))}
            </div>
        </div>
    );
};

export default TestPage;
