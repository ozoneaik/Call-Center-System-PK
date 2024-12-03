import { createContext, useContext, useState } from 'react';

const MessageContent = createContext({
    message: null,
    setMessage: () => {},
});

export const MessageProvider = ({ children }) => {
    const [message, _setMessage] = useState(
        JSON.parse(localStorage.getItem('message')) || null
    );
    // set user to local storage
    const setMessage = (message) => {
        if (message) {
            localStorage.setItem('message', JSON.stringify(message));
        } else {
            localStorage.removeItem('message');
        }
        _setMessage(message);
    };

    return (
        <MessageContent.Provider value={{ message, setMessage }}>
            {children}
        </MessageContent.Provider>
    );
};

export const useMessage = () => {
    return useContext(MessageContent);
};