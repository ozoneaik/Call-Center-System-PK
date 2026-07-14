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

function PermissionRow({ icon: Icon, label, checked, onChange }) {
    return (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Icon sx={{ fontSize: 13, color: checked ? "success.500" : "danger.400" }} />
                <Typography level="body-xs" sx={{ color: checked ? "success.600" : "danger.500" }}>
                    {label}
                </Typography>
            </Box>
            <Switch checked={checked} onChange={onChange} color={checked ? "success" : "neutral"} size="sm" />
        </Box>
    );
}

function RoomCard({ room, isAllowed, allowCreateCase, onChange }) {
    const anyBlocked = !isAllowed || !allowCreateCase;
    return (
        <Card
            variant="outlined"
            sx={{
                borderColor: anyBlocked ? "warning.200" : "neutral.200",
                bgcolor: anyBlocked ? "warning.50" : "background.surface",
                transition: "all 0.2s",
            }}
        >
            <CardContent sx={{ p: 1.5, gap: 1 }}>
                <Box sx={{ minWidth: 0, mb: 0.5 }}>
                    <Typography
                        level="body-sm"
                        sx={{ fontFamily: "monospace", color: "primary.500", fontSize: "0.7rem", fontWeight: 600 }}
                    >
                        {room.roomId}
                    </Typography>
                    <Typography
                        level="body-md"
                        sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                        {room.roomName}
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                    <PermissionRow
                        icon={isAllowed ? LockOpenIcon : LockIcon}
                        label="ส่งต่อห้อง"
                        checked={isAllowed}
                        onChange={(e) => onChange(room.roomId, "is_allowed", e.target.checked)}
                    />
                    <PermissionRow
                        icon={allowCreateCase ? LockOpenIcon : LockIcon}
                        label="สร้างเคสใหม่"
                        checked={allowCreateCase}
                        onChange={(e) => onChange(room.roomId, "allow_create_case", e.target.checked)}
                    />
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
        token.room_permissions.forEach((p) => {
            rules[p.roomId] = { is_allowed: p.is_allowed, allow_create_case: p.allow_create_case };
        });
        setPendingRules(rules);
        setDirty(false);
    };

    const handleToggle = (roomId, field, value) => {
        setPendingRules((prev) => ({ ...prev, [roomId]: { ...prev[roomId], [field]: value } }));
        setDirty(true);
    };

    const handleSetAllAllowed = (value) => {
        const updated = {};
        rooms.forEach((r) => {
            updated[r.roomId] = { ...(pendingRules[r.roomId] ?? {}), is_allowed: value };
        });
        setPendingRules(updated);
        setDirty(true);
    };

    const handleSetAllCreateCase = (value) => {
        const updated = {};
        rooms.forEach((r) => {
            updated[r.roomId] = { ...(pendingRules[r.roomId] ?? {}), allow_create_case: value };
        });
        setPendingRules(updated);
        setDirty(true);
    };

    const handleSave = async () => {
        setSaving(true);
        const rules = Object.entries(pendingRules).map(([roomId, perms]) => ({
            roomId,
            is_allowed: perms.is_allowed,
            allow_create_case: perms.allow_create_case,
        }));
        const { data, status } = await updatePlatformRoutingRulesApi({ token_id: selectedToken.id, rules });
        setSaving(false);

        AlertDiaLog({
            icon: status === 200 ? "success" : "error",
            title: data.message,
            text: data.detail || "",
            onPassed: () => {
                if (status === 200) {
                    setDirty(false);
                    const mergePerms = (p) => ({
                        ...p,
                        is_allowed:        pendingRules[p.roomId]?.is_allowed        ?? p.is_allowed,
                        allow_create_case: pendingRules[p.roomId]?.allow_create_case ?? p.allow_create_case,
                    });
                    setTokens((prev) =>
                        prev.map((t) =>
                            t.id !== selectedToken.id ? t : {
                                ...t,
                                room_permissions: t.room_permissions.map(mergePerms),
                            }
                        )
                    );
                    setSelectedToken((prev) => ({
                        ...prev,
                        room_permissions: prev.room_permissions.map(mergePerms),
                    }));
                }
            },
        });
    };

    const allowedCount      = Object.values(pendingRules).filter((p) => p.is_allowed).length;
    const blockedCount      = rooms.length - allowedCount;
    const createCaseCount   = Object.values(pendingRules).filter((p) => p.allow_create_case).length;

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
                    <Grid xs={12} md={4} sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
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
                    <Grid xs={12} md={8} sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
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
                                                <Box sx={{ display: "flex", gap: 1, mt: 0.8, flexWrap: "wrap" }}>
                                                    <Chip size="sm" color="success" variant="soft">
                                                        ✓ ส่งต่อได้ {allowedCount} ห้อง
                                                    </Chip>
                                                    {blockedCount > 0 && (
                                                        <Chip size="sm" color="danger" variant="soft">
                                                            ✗ ปิดกั้น {blockedCount} ห้อง
                                                        </Chip>
                                                    )}
                                                    <Chip size="sm" color="primary" variant="soft">
                                                        สร้างเคสได้ {createCaseCount} ห้อง
                                                    </Chip>
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, alignItems: "flex-end" }}>
                                                <Box sx={{ display: "flex", gap: 0.8, alignItems: "center" }}>
                                                    <Typography level="body-xs" sx={{ color: "neutral.500", whiteSpace: "nowrap" }}>ส่งต่อ:</Typography>
                                                    <Button size="sm" variant="outlined" color="success" onClick={() => handleSetAllAllowed(true)}>
                                                        เปิดทั้งหมด
                                                    </Button>
                                                    <Button size="sm" variant="outlined" color="danger" onClick={() => handleSetAllAllowed(false)}>
                                                        ปิดทั้งหมด
                                                    </Button>
                                                </Box>
                                                <Box sx={{ display: "flex", gap: 0.8, alignItems: "center" }}>
                                                    <Typography level="body-xs" sx={{ color: "neutral.500", whiteSpace: "nowrap" }}>สร้างเคส:</Typography>
                                                    <Button size="sm" variant="outlined" color="success" onClick={() => handleSetAllCreateCase(true)}>
                                                        เปิดทั้งหมด
                                                    </Button>
                                                    <Button size="sm" variant="outlined" color="danger" onClick={() => handleSetAllCreateCase(false)}>
                                                        ปิดทั้งหมด
                                                    </Button>
                                                </Box>
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
                                                const perms = pendingRules[room.roomId] ?? { is_allowed: true, allow_create_case: true };
                                                return (
                                                    <Grid key={room.roomId} xs={12} sm={6} md={4}>
                                                        <RoomCard
                                                            room={room}
                                                            isAllowed={perms.is_allowed}
                                                            allowCreateCase={perms.allow_create_case}
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
