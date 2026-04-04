import { createContext, useContext, useState, useEffect } from 'react';

const ChatRoomsContent = createContext({
    chatRoomsContext: null,
    setChatRoomsContext: () => {},
    myRoomContext : null,
    setMyRoomContext: () => {},
    roomUnread: {},
    incrementRoomUnread: () => {},
    clearRoomUnread: () => {},
});

export const ChatRoomsProvider = ({ children }) => {
    const [chatRoomsContext, _setChatRoomsContext] = useState(
        JSON.parse(localStorage.getItem('chatRooms')) || null
    );

    const [myRoomContext, _setMyRoomContext] = useState(
        JSON.parse(localStorage.getItem('myChatRooms')) || null
    );

    const [roomUnread, setRoomUnread] = useState(() => {
        const storedRooms = JSON.parse(localStorage.getItem('myChatRooms'));
        const initial = {};
        if (storedRooms && Array.isArray(storedRooms)) {
            storedRooms.forEach(room => {
                if (room.unread_count && parseInt(room.unread_count, 10) > 0) {
                    initial[room.roomId] = parseInt(room.unread_count, 10);
                }
            });
        }
        return JSON.parse(localStorage.getItem('roomUnread')) || initial;
    });

    useEffect(() => {
        localStorage.setItem('roomUnread', JSON.stringify(roomUnread));
    }, [roomUnread]);

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
            // Update roomUnread based on fresh API data
            const freshUnread = {};
            myChatRooms.forEach((room) => {
                if (room.unread_count && parseInt(room.unread_count, 10) > 0) {
                    freshUnread[room.roomId] = parseInt(room.unread_count, 10);
                }
            });
            setRoomUnread(freshUnread);
        } else {
            localStorage.removeItem('myChatRooms');
        }
        _setMyRoomContext(myChatRooms);
    }

    const incrementRoomUnread = (roomId) => {
        setRoomUnread((prev) => ({
            ...prev,
            [roomId]: (prev[roomId] || 0) + 1,
        }));
    };

    const clearRoomUnread = (roomId) => {
        setRoomUnread((prev) => {
            const updated = { ...prev };
            delete updated[roomId];
            return updated;
        });
    };

    return (
        <ChatRoomsContent.Provider value={{ chatRoomsContext, setChatRoomsContext, myRoomContext, setMyRoomContext, roomUnread, incrementRoomUnread, clearRoomUnread }}>
            {children}
        </ChatRoomsContent.Provider>
    );
};

export const useChatRooms = () => {
    return useContext(ChatRoomsContent);
};