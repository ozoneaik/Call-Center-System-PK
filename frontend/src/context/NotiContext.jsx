import { createContext, useContext, useState } from 'react';

const NotificationContent = createContext({
    notification: null,
    setNotification: () => {},
    unRead : 0,
    setUnRead : () => {},
});

export const NotificationProvider = ({ children }) => {
    const [notification, _setNotification] = useState(
        JSON.parse(localStorage.getItem('notification')) || null
    );
    const [unRead, _setUnRead] = useState(
        JSON.parse(localStorage.getItem('unread')) || null
    )

    // set user to local storage
    const setNotification = (notification) => {
        if (notification) {
            localStorage.setItem('notification', JSON.stringify(notification));
        } else {
            localStorage.removeItem('notification');
        }
        _setNotification(notification);
    };

    const setUnRead = (unRead) => {
        if (unRead){
            localStorage.setItem('unread', unRead);
        }else{
            localStorage.setItem('unread', '0');
        }
        _setUnRead(unRead);
    }

    return (
        <NotificationContent.Provider value={{ notification, setNotification, unRead, setUnRead }}>
            {children}
        </NotificationContent.Provider>
    );
};

export const useNotification = () => {
    return useContext(NotificationContent);
};