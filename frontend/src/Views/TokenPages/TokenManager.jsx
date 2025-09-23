import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axiosClient from "../../Axios";

export default function TokenManager() {
    const [platform, setPlatform] = useState("shopee");
    const [usageType, setUsageType] = useState("chat");
    const [callback, setCallback] = useState(
        import.meta.env.VITE_BACKEND_URL + "/api/auto-tokens/callback/shopee"
    );

    const [serviceId, setServiceId] = useState("");
    const [partnerId, setPartnerId] = useState("");
    const [partnerKey, setPartnerKey] = useState("");
    const [description, setDescription] = useState("");
    const [authUrl, setAuthUrl] = useState("");
    const [tokenInfo, setTokenInfo] = useState(null);

    const [chatRooms, setChatRooms] = useState([]);
    const [roomDefaultId, setRoomDefaultId] = useState("");

    const location = useLocation();

    useEffect(() => {
        if (platform === "shopee") {
            setCallback(import.meta.env.VITE_BACKEND_URL + "/api/auto-tokens/callback/shopee");
        } else if (platform === "lazada") {
            setCallback(import.meta.env.VITE_BACKEND_URL + "/api/auto-tokens/callback/lazada");
        } else if (platform === "tiktok") {
            setCallback(import.meta.env.VITE_BACKEND_URL + "/api/auto-tokens/callback/tiktok");
        }
    }, [platform]);

    useEffect(() => {
        axiosClient.get("/auto-tokens/rooms").then((res) => {
            setChatRooms(res.data.chat_rooms || []);
        });
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const code = params.get("code");
        const shopId = params.get("shop_id");
        const platformParam = params.get("platform") || platform;

        if (code) {
            exchangeToken(code, shopId, platformParam);
        }
    }, [location]);

    const getAuthUrl = async () => {
        try {
            localStorage.setItem("serviceId", serviceId);
            localStorage.setItem("partnerId", partnerId);
            localStorage.setItem("partnerKey", partnerKey);
            localStorage.setItem("callback", callback);
            localStorage.setItem("description", description);
            localStorage.setItem("platform", platform);
            localStorage.setItem("room_default_id", roomDefaultId);
            localStorage.setItem("usageType", usageType);

            const params = { callback_url: callback };

            if (platform === "tiktok") {
                params.service_id = serviceId;
            } else {
                params.partner_id = partnerId;
                params.partner_key = partnerKey;
            }

            const resp = await axiosClient.get(`/auto-tokens/token/${platform}/auth-url`, {
                params,
            });

            setAuthUrl(resp.data.auth_url);
            window.location.href = resp.data.auth_url;
        } catch (error) {
            console.error("Error getting auth url", error);
            alert("ไม่สามารถสร้าง Auth URL ได้");
        }
    };

    const exchangeToken = async (code, shopId = null, currentPlatform = platform) => {
        try {
            const savedServiceId = localStorage.getItem("serviceId");
            const savedPartnerId = localStorage.getItem("partnerId");
            const savedPartnerKey = localStorage.getItem("partnerKey");
            const savedCallback = localStorage.getItem("callback");
            const savedDescription = localStorage.getItem("description");
            const savedRoomId = localStorage.getItem("room_default_id");
            const savedUsageType = localStorage.getItem("usageType") || "chat";

            const payload = {
                code,
                callback_url: savedCallback,
                description: savedDescription,
                room_default_id: savedRoomId,
                usage_type: savedUsageType,
            };

            if (currentPlatform === "shopee") {
                payload.partner_id = savedPartnerId;
                payload.partner_key = savedPartnerKey;
                payload.shop_id = shopId;
            } else if (currentPlatform === "lazada") {
                payload.partner_id = savedPartnerId;
                payload.partner_key = savedPartnerKey;
            } else if (currentPlatform === "tiktok") {
                payload.service_id = savedServiceId;
                payload.app_key = savedPartnerId;
                payload.app_secret = savedPartnerKey;
            }

            const resp = await axiosClient.post(
                `/auto-tokens/token/${currentPlatform}/exchange`,
                payload
            );

            setTokenInfo({ ...resp.data, platform: currentPlatform });
        } catch (error) {
            console.error("Error exchanging token", error.response?.data || error);
            alert("แลก Token ไม่สำเร็จ");
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>🔑 Token Manager</h2>

                {!tokenInfo && (
                    <>
                        <div style={styles.grid}>
                            {/* เลือก platform */}
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Platform</label>
                                <select
                                    style={styles.input}
                                    value={platform}
                                    onChange={(e) => setPlatform(e.target.value)}
                                >
                                    <option value="shopee">Shopee</option>
                                    <option value="lazada">Lazada</option>
                                    <option value="tiktok">TikTok</option>
                                </select>
                            </div>

                            {/* Usage Type เฉพาะ Shopee */}
                            {platform === "shopee" && (
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Usage Type</label>
                                    <select
                                        style={styles.input}
                                        value={usageType}
                                        onChange={(e) => setUsageType(e.target.value)}
                                    >
                                        <option value="chat">Chat</option>
                                        <option value="livestream">Livestream</option>
                                    </select>
                                </div>
                            )}

                            {/* Service Id เฉพาะ TikTok */}
                            {platform === "tiktok" && (
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Service Id (TikTok)</label>
                                    <input
                                        style={styles.input}
                                        value={serviceId}
                                        onChange={(e) => setServiceId(e.target.value)}
                                        placeholder="ใส่ Service Id ของ TikTok"
                                    />
                                </div>
                            )}

                            {/* Partner ID / Key */}
                            <div style={styles.formGroup}>
                                <label style={styles.label}>
                                    {platform === "tiktok"
                                        ? "App Key (TikTok)"
                                        : platform === "shopee"
                                            ? "Partner ID"
                                            : "App Key"}
                                </label>
                                <input
                                    style={styles.input}
                                    value={partnerId}
                                    onChange={(e) => setPartnerId(e.target.value)}
                                    placeholder="ใส่ Partner ID / App Key"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>
                                    {platform === "tiktok"
                                        ? "App Secret (TikTok)"
                                        : platform === "shopee"
                                            ? "Partner Key"
                                            : "App Secret"}
                                </label>
                                <input
                                    style={styles.input}
                                    value={partnerKey}
                                    onChange={(e) => setPartnerKey(e.target.value)}
                                    placeholder="ใส่ Partner Key / App Secret"
                                />
                            </div>

                            {/* Room Default */}
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Default Room</label>
                                <select
                                    style={styles.input}
                                    value={roomDefaultId}
                                    onChange={(e) => setRoomDefaultId(e.target.value)}
                                >
                                    <option value="">-- เลือกห้อง --</option>
                                    {chatRooms.map((room) => (
                                        <option key={room.roomId} value={room.roomId}>
                                            {room.roomName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Description</label>
                                <input
                                    style={styles.input}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="ตั้งชื่อ token"
                                />
                            </div>
                        </div>

                        <button style={styles.buttonPrimary} onClick={getAuthUrl}>
                            🚀 Connect {platform}
                        </button>
                    </>
                )}

                {tokenInfo && (
                    <div style={styles.tokenBox}>
                        <h3>🎫 Token Info ({tokenInfo.platform})</h3>
                        <p><b>Usage Type:</b> {tokenInfo.usage_type}</p>
                        <p><b>Access Token:</b> {tokenInfo.access_token}</p>
                        <p><b>Refresh Token:</b> {tokenInfo.refresh_token}</p>
                        <p><b>Expire In:</b> {tokenInfo.expire_in}</p>
                        <p><b>Description:</b> {tokenInfo.description}</p>

                        <button
                            style={styles.buttonSuccess}
                            onClick={() => window.location.href = "/accessToken"}
                        >
                            ⬅️ Back
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: "flex", justifyContent: "center", alignItems: "center",
        minHeight: "100vh", background: "#f9fafb", padding: "20px"
    },
    card: {
        background: "#fff", borderRadius: "16px",
        padding: "28px", maxWidth: "600px", width: "100%",
        boxShadow: "0 6px 20px rgba(0,0,0,0.1)"
    },
    title: { marginBottom: "24px", textAlign: "center", color: "#111827" },
    grid: { display: "grid", gap: "16px" },
    formGroup: {},
    label: { display: "block", marginBottom: "6px", fontWeight: "600", color: "#374151" },
    input: {
        width: "100%", padding: "12px", borderRadius: "8px",
        border: "1px solid #d1d5db", outline: "none", fontSize: "14px",
        transition: "border 0.2s ease"
    },
    buttonPrimary: {
        width: "100%", padding: "14px", marginTop: "20px",
        background: "#2563eb", color: "#fff", fontWeight: "600",
        border: "none", borderRadius: "8px", cursor: "pointer",
        fontSize: "16px"
    },
    buttonSuccess: {
        width: "100%", padding: "14px", marginTop: "20px",
        background: "#16a34a", color: "#fff", fontWeight: "600",
        border: "none", borderRadius: "8px", cursor: "pointer",
        fontSize: "16px"
    },
    tokenBox: {
        background: "#f3f4f6", padding: "20px", borderRadius: "12px",
        border: "1px solid #e5e7eb", marginTop: "24px", fontSize: "14px"
    },
};
