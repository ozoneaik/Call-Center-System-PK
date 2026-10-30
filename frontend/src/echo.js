import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axiosClient from './Axios.js';
window.Pusher = Pusher;

const echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true,
    // private channel ต้องขอลายเซ็นจาก backend — ใช้ axiosClient เพื่อส่ง cookie token ไปด้วย
    authorizer: (channel) => ({
        authorize: (socketId, callback) => {
            axiosClient.post('/broadcasting/auth', { socket_id: socketId, channel_name: channel.name })
                .then(({ data }) => callback(null, data))
                .catch((error) => callback(error, null));
        },
    }),
});

export const newMessage = ({onPassed}) => {
    const channel = echo.private('notifications');
    channel.listen('.my-event', (event) => {
        onPassed(true,event);
    });
    return () => {
        channel.stopListening('.my-event');
        echo.leave('notifications');
    };
}

export const messageByCust = ({onPassed}) => {
    const channel = echo.channel('messageByCust');
    channel.listen('.message', (event) => {
        onPassed(true, event);
    })

    return () => {
        channel.stopListening('.message');
        echo.leaveChannel('messageByCust');
    }
}

export const newChatRooms = ({onPassed}) => {
    const channel = echo.private('newChatRooms');
    channel.listen('.my-event', (event) => {
        console.log('event Echo => ',event);
        onPassed(true,event);
    });
    return () => {
        channel.stopListening('.my-event');
        echo.leave('newChatRooms');
    };
}

export const chatMarkedAsRead = ({ onPassed }) => {
    const channel = echo.private('notifications');
    channel.listen('.chat-marked-as-read', (event) => {
        onPassed('success', event);
    });
    return () => {
        channel.stopListening('.chat-marked-as-read');
    };
};
