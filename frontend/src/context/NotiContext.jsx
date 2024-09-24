import { createContext, useContext, useState } from 'react';

const NotificationContent = createContext({
    notification: null,
    setNotification: () => {},
});

export const NotificationProvider = ({ children }) => {
    const [notification, _setNotification] = useState(
        JSON.parse(localStorage.getItem('notification')) || null
    );

    // set user to local storage
    const setNotification = (notification) => {
        if (notification) {
            localStorage.setItem('notification', JSON.stringify(notification));
        } else {
            localStorage.removeItem('notification');
        }
        _setNotification(notification);
    };

    return (
        <NotificationContent.Provider value={{ notification, setNotification }}>
            {children}
        </NotificationContent.Provider>
    );
};

export const useNotification = () => {
    return useContext(NotificationContent);
};