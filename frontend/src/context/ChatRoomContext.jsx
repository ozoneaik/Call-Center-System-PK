import { createContext, useContext, useState } from "react";

const ChatRoomsContent = createContext({
  chatRoomsContext: null,
  setChatRoomsContext: () => {},
  myRoomContext: null,
  setMyRoomContext: () => {},
  roomUnread: {},
  incrementRoomUnread: () => {},
  decrementRoomUnread: () => {},
  clearRoomUnread: () => {},
  setAllRoomUnread: () => {},
  // Pending count (นับตามจำนวนเคส)
  roomPending: {},
  setAllRoomPending: () => {},
  incrementRoomPending: () => {},
  decrementRoomPending: () => {},
  clearRoomPending: () => {},
});

export const ChatRoomsProvider = ({ children }) => {
  const [chatRoomsContext, _setChatRoomsContext] = useState(
    JSON.parse(localStorage.getItem("chatRooms")) || null
  );

  const [myRoomContext, _setMyRoomContext] = useState(
    JSON.parse(localStorage.getItem("myChatRooms")) || null
  );

  const [roomUnread, _setRoomUnread] = useState(
    JSON.parse(localStorage.getItem("roomUnread")) || {}
  );

  const [roomPending, _setRoomPending] = useState(
    JSON.parse(localStorage.getItem("roomPending")) || {}
  );

  const setRoomUnread = (updater) => {
    _setRoomUnread((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      localStorage.setItem("roomUnread", JSON.stringify(next));
      return next;
    });
  };

  const setRoomPending = (updater) => {
    _setRoomPending((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      localStorage.setItem("roomPending", JSON.stringify(next));
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

  const setAllRoomUnread = (unreadData) => {
    setRoomUnread(unreadData);
  };

  const setAllRoomPending = (pendingData) => {
    setRoomPending(pendingData);
  };

  const incrementRoomUnread = (roomId) => {
    setRoomUnread((prev) => ({
      ...prev,
      [roomId]: (prev[roomId] || 0) + 1,
    }));
  };

  const incrementRoomPending = (roomId) => {
    setRoomPending((prev) => ({
      ...prev,
      [roomId]: (prev[roomId] || 0) + 1,
    }));
  };

  // ใช้ตัวนี้เวลาพนักงานกดคลิกเข้าไปอ่านใน 1 เคส
  const decrementRoomUnread = (roomId) => {
    setRoomUnread((prev) => {
      const current = prev[roomId] || 0;
      if (current <= 1) {
        const updated = { ...prev };
        delete updated[roomId];
        return updated;
      }
      return { ...prev, [roomId]: current - 1 };
    });
  };

  const decrementRoomPending = (roomId) => {
    setRoomPending((prev) => {
      const current = prev[roomId] || 0;
      if (current <= 1) {
        const updated = { ...prev };
        delete updated[roomId];
        return updated;
      }
      return { ...prev, [roomId]: current - 1 };
    });
  };

  const clearRoomUnread = (roomId) => {
    setRoomUnread((prev) => {
      const updated = { ...prev };
      delete updated[roomId];
      return updated;
    });
  };

  const clearRoomPending = (roomId) => {
    setRoomPending((prev) => {
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
        decrementRoomUnread,
        clearRoomUnread,
        setAllRoomUnread,
        roomPending,
        setAllRoomPending,
        incrementRoomPending,
        decrementRoomPending,
        clearRoomPending,
      }}
    >
      {children}
    </ChatRoomsContent.Provider>
  );
};

export const useChatRooms = () => {
  return useContext(ChatRoomsContent);
};
