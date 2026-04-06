import { createContext, useContext, useState } from "react";

const ChatRoomsContent = createContext({
  chatRoomsContext: null,
  setChatRoomsContext: () => {},
  myRoomContext: null,
  setMyRoomContext: () => {},
  roomUnread: {},
  incrementRoomUnread: () => {},
  clearRoomUnread: () => {},
});

export const ChatRoomsProvider = ({ children }) => {
  const [chatRoomsContext, _setChatRoomsContext] = useState(
    JSON.parse(localStorage.getItem("chatRooms")) || null,
  );

  const [myRoomContext, _setMyRoomContext] = useState(
    JSON.parse(localStorage.getItem("myChatRooms")) || null,
  );

  const [roomUnread, _setRoomUnread] = useState(
    JSON.parse(localStorage.getItem("roomUnread")) || {}
  );

  const setRoomUnread = (updater) => {
    _setRoomUnread((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      localStorage.setItem("roomUnread", JSON.stringify(next));
      return next;
    });
  };

  // set user to local storage
  const setChatRoomsContext = (chatRooms) => {
    if (chatRooms) {
      localStorage.setItem("chatRooms", JSON.stringify(chatRooms));
    } else {
      localStorage.removeItem("chatRooms");
    }
    _setChatRoomsContext(chatRooms);
  };

  const setMyRoomContext = (myChatRooms) => {
    if (myChatRooms) {
      localStorage.setItem("myChatRooms", JSON.stringify(myChatRooms));
    } else {
      localStorage.removeItem("myChatRooms");
    }
    _setMyRoomContext(myChatRooms);
  };

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
    <ChatRoomsContent.Provider
      value={{
        chatRoomsContext,
        setChatRoomsContext,
        myRoomContext,
        setMyRoomContext,
        roomUnread,
        incrementRoomUnread,
        clearRoomUnread,
      }}
    >
      {children}
    </ChatRoomsContent.Provider>
  );
};

export const useChatRooms = () => {
  return useContext(ChatRoomsContent);
};
