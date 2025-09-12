import { TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector';

const tiktokUsername = "";
const laravelApiUrl = "";
const connection = new TikTokLiveConnection(tiktokUsername);

connection.connect().then(state => {
    console.log(`Connected to roomId: ${state.roomId}`);
}).catch(err => {
    console.error('Failed to connect:', err);
});

connection.on(WebcastEvent.CHAT, data => {
    console.log(`${data.uniqueId} : ${data.comment}`);

    fetch(laravelApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id: data.user.userId,
            username: data.user.uniqueId,
            message: data.comment
        })
    }).then(res => res.json())
        .then(resp => console.log("📩 Laravel Response:", resp))
        .catch(err => console.error("ส่งไป Laravel error:", err));
})