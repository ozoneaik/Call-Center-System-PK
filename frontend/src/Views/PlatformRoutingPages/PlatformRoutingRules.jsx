import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    Sheet,
    Switch,
    Typography,
} from "@mui/joy";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import { useEffect, useState } from "react";
import { platformRoutingListApi, updatePlatformRoutingRulesApi } from "../../Api/PlatformRouting.js";
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import SaveIcon from "@mui/icons-material/Save";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const BreadcrumbsPath = [{ name: "จัดการ Platform" }, { name: "สิทธิ์การส่งต่อห้องแชท" }];

const PLATFORM_COLORS = {
    shopee: "warning",
    lazada: "primary",
    tiktok: "danger",
    facebook: "neutral",
    line: "success",
};

const PLATFORM_LABELS = {
    shopee: "Shopee",
    lazada: "Lazada",
    tiktok: "TikTok",
    facebook: "Facebook",
    line: "Line",
};

const PLATFORM_BG = {
    shopee: "#fff7ed",
    lazada: "#eff6ff",
    tiktok: "#fff1f2",
    facebook: "#f8fafc",
    line: "#f0fdf4",
};

const PLATFORM_BORDER = {
    shopee: "#fb923c",
    lazada: "#3b82f6",
    tiktok: "#f43f5e",
    facebook: "#94a3b8",
    line: "#22c55e",
};

function TokenCard({ token, isSelected, onClick }) {
    const blockedCount = token.room_permissions.filter((p) => !p.is_allowed).length;
    const totalCount = token.room_permissions.length;
    const allBlocked = blockedCount === totalCount;
    const platform = token.platform || "other";

    return (
        <Box
            onClick={onClick}
            sx={{
                p: 1.5,
                cursor: "pointer",
                borderRadius: "md",
                border: "1.5px solid",
                borderColor: isSelected ? PLATFORM_BORDER[platform] || "primary.400" : "transparent",
                bgcolor: isSelected
                    ? PLATFORM_BG[platform] || "primary.50"
                    : "background.surface",
                boxShadow: isSelected ? "sm" : "none",
                transition: "all 0.15s",
                "&:hover": {
                    borderColor: PLATFORM_BORDER[platform] || "primary.300",
                    bgcolor: PLATFORM_BG[platform] || "primary.50",
                    boxShadow: "sm",
                },
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                <Chip
                    size="sm"
                    color={PLATFORM_COLORS[platform] || "neutral"}
                    variant="solid"
                    sx={{ fontSize: "0.7rem" }}
                >
                    {PLATFORM_LABELS[platform] || platform}
                </Chip>
                {blockedCount === 0 ? (
                    <Chip size="sm" color="success" variant="soft" startDecorator={<CheckCircleOutlineIcon sx={{ fontSize: 12 }} />}>
                        ทุกห้อง
                    </Chip>
                ) : allBlocked ? (
                    <Chip size="sm" color="danger" variant="soft" startDecorator={<LockIcon sx={{ fontSize: 12 }} />}>
                        ปิดทั้งหมด
                    </Chip>
                ) : (
                    <Chip size="sm" color="warning" variant="soft" startDecorator={<LockIcon sx={{ fontSize: 12 }} />}>
                        บล็อก {blockedCount}/{totalCount}
                    </Chip>
                )}
            </Box>
            <Typography
                level="body-md"
                sx={{
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? PLATFORM_BORDER[platform] || "primary.700" : "text.primary",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                }}
            >
                {token.description || `Token #${token.id}`}
            </Typography>
        </Box>
    );
}

function RoomCard({ room, isAllowed, onChange }) {
    return (
        <Card
            variant="outlined"
            sx={{
                position: "relative",
                borderColor: isAllowed ? "neutral.200" : "danger.200",
                bgcolor: isAllowed ? "background.surface" : "danger.50",
                transition: "all 0.2s",
                opacity: isAllowed ? 1 : 0.75,
            }}
        >
            <CardContent sx={{ p: 1.5, gap: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            level="body-sm"
                            sx={{
                                fontFamily: "monospace",
                                color: isAllowed ? "primary.500" : "danger.400",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                            }}
                        >
                            {room.roomId}
                        </Typography>
                        <Typography
                            level="body-md"
                            sx={{
                                fontWeight: 600,
                                color: isAllowed ? "text.primary" : "neutral.400",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {room.roomName}
                        </Typography>
                    </Box>
                    <Switch
                        checked={isAllowed}
                        onChange={(e) => onChange(room.roomId, e.target.checked)}
                        color={isAllowed ? "success" : "neutral"}
                        size="sm"
                    />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {isAllowed ? (
                        <>
                            <LockOpenIcon sx={{ fontSize: 13, color: "success.500" }} />
                            <Typography level="body-xs" sx={{ color: "success.600" }}>ส่งต่อได้</Typography>
                        </>
                    ) : (
                        <>
                            <LockIcon sx={{ fontSize: 13, color: "danger.400" }} />
                            <Typography level="body-xs" sx={{ color: "danger.500" }}>ปิดกั้น</Typography>
                        </>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}

export default function PlatformRoutingRules() {
    const [tokens, setTokens] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [selectedToken, setSelectedToken] = useState(null);
    const [pendingRules, setPendingRules] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data, status } = await platformRoutingListApi();
        if (status === 200) {
            setTokens(data.tokens);
            setRooms(data.rooms);
        }
        setLoading(false);
    };

    const handleSelectToken = (token) => {
        if (dirty) {
            AlertDiaLog({
                icon: "question",
                title: "มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก",
                text: "ต้องการออกโดยไม่บันทึกหรือไม่?",
                onPassed: (confirm) => { if (confirm) loadToken(token); },
            });
        } else {
            loadToken(token);
        }
    };

    const loadToken = (token) => {
        setSelectedToken(token);
        const rules = {};
        token.room_permissions.forEach((p) => { rules[p.roomId] = p.is_allowed; });
        setPendingRules(rules);
        setDirty(false);
    };

    const handleToggle = (roomId, value) => {
        setPendingRules((prev) => ({ ...prev, [roomId]: value }));
        setDirty(true);
    };

    const handleSetAll = (value) => {
        const updated = {};
        rooms.forEach((r) => { updated[r.roomId] = value; });
        setPendingRules(updated);
        setDirty(true);
    };

    const handleSave = async () => {
        setSaving(true);
        const rules = Object.entries(pendingRules).map(([roomId, is_allowed]) => ({ roomId, is_allowed }));
        const { data, status } = await updatePlatformRoutingRulesApi({ token_id: selectedToken.id, rules });
        setSaving(false);

        AlertDiaLog({
            icon: status === 200 ? "success" : "error",
            title: data.message,
            text: data.detail || "",
            onPassed: () => {
                if (status === 200) {
                    setDirty(false);
                    setTokens((prev) =>
                        prev.map((t) =>
                            t.id !== selectedToken.id ? t : {
                                ...t,
                                room_permissions: t.room_permissions.map((p) => ({
                                    ...p,
                                    is_allowed: pendingRules[p.roomId] ?? p.is_allowed,
                                })),
                            }
                        )
                    );
                    setSelectedToken((prev) => ({
                        ...prev,
                        room_permissions: prev.room_permissions.map((p) => ({
                            ...p,
                            is_allowed: pendingRules[p.roomId] ?? p.is_allowed,
                        })),
                    }));
                }
            },
        });
    };

    const allowedCount = Object.values(pendingRules).filter(Boolean).length;
    const blockedCount = rooms.length - allowedCount;

    const groupedTokens = tokens.reduce((acc, token) => {
        const p = token.platform || "other";
        if (!acc[p]) acc[p] = [];
        acc[p].push(token);
        return acc;
    }, {});

    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{ mb: 2 }}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                </Box>

                <Grid container spacing={2} sx={{ height: "calc(100vh - 120px)" }}>
                    {/* ===== Left: Token List ===== */}
                    <Grid xs={12} md={4} sx={{ display: "flex", flexDirection: "column" }}>
                        <Card variant="outlined" sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                            <Box sx={{ p: 2, pb: 1.5 }}>
                                <Typography level="title-lg">Platform Tokens</Typography>
                                <Typography level="body-xs" sx={{ color: "neutral.500", mt: 0.3 }}>
                                    เลือก token เพื่อตั้งค่าสิทธิ์การส่งต่อห้องแชท
                                </Typography>
                            </Box>
                            <Divider />
                            <Box sx={{ flex: 1, overflowY: "auto", p: 1.5 }}>
                                {loading ? (
                                    <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}>
                                        <CircularProgress size="md" />
                                    </Box>
                                ) : Object.keys(groupedTokens).length === 0 ? (
                                    <Typography level="body-sm" sx={{ textAlign: "center", color: "neutral.400", pt: 4 }}>
                                        ไม่พบ token
                                    </Typography>
                                ) : (
                                    Object.entries(groupedTokens).map(([platform, list]) => (
                                        <Box key={platform} sx={{ mb: 2 }}>
                                            <Typography
                                                level="body-xs"
                                                sx={{
                                                    color: "neutral.500",
                                                    fontWeight: 700,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.08em",
                                                    mb: 0.8,
                                                    px: 0.5,
                                                }}
                                            >
                                                {PLATFORM_LABELS[platform] || platform}
                                            </Typography>
                                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
                                                {list.map((token) => (
                                                    <TokenCard
                                                        key={token.id}
                                                        token={token}
                                                        isSelected={selectedToken?.id === token.id}
                                                        onClick={() => handleSelectToken(token)}
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    ))
                                )}
                            </Box>
                        </Card>
                    </Grid>

                    {/* ===== Right: Room Permissions ===== */}
                    <Grid xs={12} md={8} sx={{ display: "flex", flexDirection: "column" }}>
                        <Card variant="outlined" sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                            {!selectedToken ? (
                                <Box
                                    sx={{
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 1,
                                        color: "neutral.300",
                                    }}
                                >
                                    <LockOpenIcon sx={{ fontSize: 48 }} />
                                    <Typography level="title-md" sx={{ color: "neutral.400" }}>
                                        เลือก Token ทางซ้าย
                                    </Typography>
                                    <Typography level="body-sm" sx={{ color: "neutral.400" }}>
                                        เพื่อตั้งค่าสิทธิ์การส่งต่อห้องแชทสำหรับ platform นั้น
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    {/* Header */}
                                    <Box sx={{ p: 2 }}>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1 }}>
                                            <Box>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <Chip
                                                        color={PLATFORM_COLORS[selectedToken.platform] || "neutral"}
                                                        variant="solid"
                                                        size="sm"
                                                    >
                                                        {PLATFORM_LABELS[selectedToken.platform] || selectedToken.platform}
                                                    </Chip>
                                                    <Typography level="title-lg">
                                                        {selectedToken.description || `Token #${selectedToken.id}`}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: "flex", gap: 1, mt: 0.8 }}>
                                                    <Chip size="sm" color="success" variant="soft">
                                                        ✓ ส่งต่อได้ {allowedCount} ห้อง
                                                    </Chip>
                                                    {blockedCount > 0 && (
                                                        <Chip size="sm" color="danger" variant="soft">
                                                            ✗ ปิดกั้น {blockedCount} ห้อง
                                                        </Chip>
                                                    )}
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: "flex", gap: 1 }}>
                                                <Button size="sm" variant="outlined" color="success" onClick={() => handleSetAll(true)}>
                                                    เปิดทั้งหมด
                                                </Button>
                                                <Button size="sm" variant="outlined" color="danger" onClick={() => handleSetAll(false)}>
                                                    ปิดทั้งหมด
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    color="primary"
                                                    startDecorator={<SaveIcon />}
                                                    onClick={handleSave}
                                                    loading={saving}
                                                    disabled={!dirty}
                                                >
                                                    บันทึก
                                                </Button>
                                            </Box>
                                        </Box>

                                        {dirty && (
                                            <Box
                                                sx={{
                                                    mt: 1.5,
                                                    px: 1.5,
                                                    py: 1,
                                                    borderRadius: "sm",
                                                    bgcolor: "warning.50",
                                                    border: "1px solid",
                                                    borderColor: "warning.300",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1,
                                                }}
                                            >
                                                <Typography level="body-xs" sx={{ color: "warning.700" }}>
                                                    มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก — กด <strong>บันทึก</strong> เพื่อยืนยัน
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>

                                    <Divider />

                                    {/* Room Cards Grid */}
                                    <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
                                        <Grid container spacing={1.5}>
                                            {rooms.map((room) => {
                                                const isAllowed = pendingRules[room.roomId] ?? true;
                                                return (
                                                    <Grid key={room.roomId} xs={12} sm={6} md={4}>
                                                        <RoomCard
                                                            room={room}
                                                            isAllowed={isAllowed}
                                                            onChange={handleToggle}
                                                        />
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    </Box>
                                </>
                            )}
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Sheet>
    );
}
