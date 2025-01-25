import { createContext, useContext, useState } from 'react';

const ChatRoomsContent = createContext({
    chatRoomsContext: null,
    setChatRoomsContext: () => {},
});

export const ChatRoomsProvider = ({ children }) => {
    const [chatRoomsContext, _setChatRoomsContext] = useState(
        JSON.parse(localStorage.getItem('chatRooms')) || null
    );

    // set user to local storage
    const setChatRoomsContext = (chatRooms) => {
        if (chatRooms) {
            localStorage.setItem('chatRooms', JSON.stringify(chatRooms));
        } else {
            localStorage.removeItem('chatRooms');
        }
        _setChatRoomsContext(chatRooms);
    };

    return (
        <ChatRoomsContent.Provider value={{ chatRoomsContext, setChatRoomsContext }}>
            {children}
        </ChatRoomsContent.Provider>
    );
};

export const useChatRooms = () => {
    return useContext(ChatRoomsContent);
};