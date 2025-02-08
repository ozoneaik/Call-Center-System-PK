import { createContext, useContext, useState } from 'react';

const ChatRoomsContent = createContext({
    chatRoomsContext: null,
    setChatRoomsContext: () => {},
    myRoomContext : null,
    setMyRoomContext: () => {},
});

export const ChatRoomsProvider = ({ children }) => {
    const [chatRoomsContext, _setChatRoomsContext] = useState(
        JSON.parse(localStorage.getItem('chatRooms')) || null
    );

    const [myRoomContext, _setMyRoomContext] = useState(
        JSON.parse(localStorage.getItem('myChatRooms')) || null
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

    const setMyRoomContext = (myChatRooms) => {
        if (myChatRooms) {
            localStorage.setItem('myChatRooms', JSON.stringify(myChatRooms));
        } else {
            localStorage.removeItem('myChatRooms');
        }
        _setChatRoomsContext(myChatRooms);
    }

    return (
        <ChatRoomsContent.Provider value={{ chatRoomsContext, setChatRoomsContext,myRoomContext, setMyRoomContext }}>
            {children}
        </ChatRoomsContent.Provider>
    );
};

export const useChatRooms = () => {
    return useContext(ChatRoomsContent);
};