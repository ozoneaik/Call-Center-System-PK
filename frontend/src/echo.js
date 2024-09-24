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
