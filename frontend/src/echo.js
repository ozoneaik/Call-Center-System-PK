import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
window.Pusher = Pusher;

const echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true,
});

export const newMessage = ({onPassed}) => {
    const channel = echo.channel(`notifications`);
    channel.listen('.my-event', (event) => {
        onPassed(true,event);
    });
    return () => {
        channel.stopListening('.my-event');
        echo.leaveChannel(`notifications`);
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
    const channel = echo.channel(`newChatRooms`);
    channel.listen('.my-event', (event) => {
        console.log('event Echo => ',event);
        onPassed(true,event);
    });
    return () => {
        channel.stopListening('.my-event');
        echo.leaveChannel(`newChatRooms`);
    };
}
