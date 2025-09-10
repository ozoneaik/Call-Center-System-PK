import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axiosClient from "../../Axios";

export default function TokenManager() {
    const [platform, setPlatform] = useState("shopee");
    const [callback, setCallback] = useState(
        import.meta.env.VITE_BACKEND_URL + "/api/auto-tokens/callback/shopee"
    );
    const [partnerId, setPartnerId] = useState("");
    const [partnerKey, setPartnerKey] = useState("");
    const [description, setDescription] = useState("");
    const [authUrl, setAuthUrl] = useState("");
    const [tokenInfo, setTokenInfo] = useState(null);

    const location = useLocation();

    useEffect(() => {
        if (platform === "shopee") {
            setCallback(import.meta.env.VITE_BACKEND_URL + "/api/auto-tokens/callback/shopee");
        } else if (platform === "lazada") {
            setCallback(import.meta.env.VITE_BACKEND_URL + "/api/auto-tokens/callback/lazada");
        }
    }, [platform]);

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
            localStorage.setItem("partnerId", partnerId);
            localStorage.setItem("partnerKey", partnerKey);
            localStorage.setItem("callback", callback);
            localStorage.setItem("description", description);
            localStorage.setItem("platform", platform);

            const resp = await axiosClient.get(`/auto-tokens/token/${platform}/auth-url`, {
                params: {
                    partner_id: partnerId,
                    partner_key: partnerKey,
                    callback_url: callback,
                },
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
            const savedPartnerId = localStorage.getItem("partnerId");
            const savedPartnerKey = localStorage.getItem("partnerKey");
            const savedCallback = localStorage.getItem("callback");
            const savedDescription = localStorage.getItem("description");

            const payload = {
                code,
                partner_id: savedPartnerId,
                partner_key: savedPartnerKey,
                callback_url: savedCallback,
                description: savedDescription,
            };

            if (currentPlatform === "shopee") {
                payload.shop_id = shopId;
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
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Platform</label>
                                <select
                                    style={styles.input}
                                    value={platform}
                                    onChange={(e) => setPlatform(e.target.value)}
                                >
                                    <option value="shopee">Shopee</option>
                                    <option value="lazada">Lazada</option>
                                </select>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>
                                    {platform === "shopee" ? "Partner ID" : "App Key"}
                                </label>
                                <input
                                    style={styles.input}
                                    value={partnerId}
                                    onChange={(e) => setPartnerId(e.target.value)}
                                    placeholder={platform === "shopee" ? "Shopee Partner ID" : "Lazada App Key"}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>
                                    {platform === "shopee" ? "Partner Key" : "App Secret"}
                                </label>
                                <input
                                    style={styles.input}
                                    value={partnerKey}
                                    onChange={(e) => setPartnerKey(e.target.value)}
                                    placeholder={platform === "shopee" ? "Shopee Partner Key" : "Lazada App Secret"}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Description</label>
                                <input
                                    style={styles.input}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="ตั้งชื่อหรือรายละเอียด token"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Callback URL</label>
                                <input
                                    style={{ ...styles.input, background: "#f3f4f6", color: "#555" }}
                                    value={callback}
                                    disabled
                                />
                            </div>
                        </div>

                        <button style={styles.buttonPrimary} onClick={getAuthUrl}>
                            🚀 Connect {platform}
                        </button>

                        {authUrl && (
                            <p style={styles.redirect}>
                                จะ redirect ไป:{" "}
                                <a href={authUrl} target="_blank" rel="noreferrer">
                                    {authUrl}
                                </a>
                            </p>
                        )}
                    </>
                )}

                {tokenInfo && (
                    <div style={styles.tokenBox}>
                        <h3>🎫 Token Info ({tokenInfo.platform})</h3>

                        {tokenInfo.platform === "shopee" && (
                            <p><b>Shop ID:</b> {tokenInfo.shop_id}</p>
                        )}

                        {tokenInfo.platform === "lazada" && (
                            <>
                                <p><b>Lazada Seller ID:</b> {tokenInfo.laz_seller_id}</p>
                                <p><b>Account:</b> {tokenInfo.account}</p>
                                <p><b>Country:</b> {tokenInfo.country}</p>
                                {tokenInfo.country_user_info && tokenInfo.country_user_info.map((info, idx) => (
                                    <p key={idx}>
                                        <b>{info.country}:</b> seller_id={info.seller_id}, user_id={info.user_id}
                                    </p>
                                ))}
                            </>
                        )}

                        <p><b>Access Token:</b> {tokenInfo.access_token}</p>
                        <p><b>Refresh Token:</b> {tokenInfo.refresh_token}</p>
                        <p><b>Expire In:</b> {tokenInfo.expire_in} วินาที</p>
                        <p><b>Description:</b> {tokenInfo.description}</p>

                        <button
                            style={styles.buttonSuccess}
                            onClick={() => window.location.href = "/accessToken"}
                        >
                            ➡️ ไปที่ Access Token Page
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
    redirect: { marginTop: "16px", fontSize: "14px", textAlign: "center" },
    tokenBox: {
        background: "#f3f4f6", padding: "20px", borderRadius: "12px",
        border: "1px solid #e5e7eb", marginTop: "24px", fontSize: "14px"
    },
};
