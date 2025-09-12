import express from 'express';
import { TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const tiktokUsername = process.env.TIKTOK_USERNAME || "adidas_th";
const laravelApiUrl = process.env.LARAVEL_API_URL || "https://dev2api.pumpkin-th.com/api/webhook-new/tiktok";

const connection = new TikTokLiveConnection(tiktokUsername);

connection.connect()
    .then(state => {
        console.log(`✅ Connected to roomId ${state.roomId}`);
    })
    .catch(err => {
        console.error('❌ Failed to connect', err);
    });

connection.on(WebcastEvent.CHAT, async (data) => {
    console.log(`${data.user.uniqueId}: ${data.comment}`);
    console.log("📡 Sending to Laravel:", laravelApiUrl);

    try {
        const resp = await axios.post(laravelApiUrl, {
            user_id: data.user.userId,
            username: data.user.uniqueId,
            message: data.comment,
        }, {
            headers: { "Content-Type": "application/json" }
        });

        console.log("📩 Laravel Response:", resp.data);
    } catch (err) {
        if (err.response) {
            console.error("❌ Laravel Error Response:", err.response.status, err.response.data);
        } else {
            console.error("❌ Error sending to Laravel:", err.message);
        }
    }
});

// Express routes
app.get('/', (req, res) => {
    res.send('TikTok Service is running 🚀');
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', tiktok: tiktokUsername, port });
});

app.listen(port, () => {
    console.log(`🌍 Express server listening on http://localhost:${port}`);
});
