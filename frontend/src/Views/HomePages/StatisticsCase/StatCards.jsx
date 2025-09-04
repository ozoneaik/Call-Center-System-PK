import { Card, CardContent, Divider, Typography, Box, Alert, Chip, Tooltip } from "@mui/joy";
import { valueDisplay } from "./helpers";

const CARD_WIDTH = 180;
const CARD_MIN_HEIGHT = { xs: 160, sm: 180, md: 190 };
const VALUE_ZONE_MIN = { xs: 68, sm: 76, md: 84 };

const caseCategories = [
    { label: "📊 งานทั้งหมด", key: "total", color: "#1976D2" },
    { label: "⏱ ภายใน 1 นาที", key: "ภายใน 1 นาที", color: "#2E7D32" },
    { label: "🕐 1-5 นาที", key: "1-5 นาที", color: "#43A047" },
    { label: "🕒 5-10 นาที", key: "5-10 นาที", color: "#FB8C00" },
    { label: "⏰ มากกว่า 10 นาที", key: "มากกว่า 10 นาที", color: "#FF9800" },
    { label: "🛠️ กำลังดำเนินการ", key: "in_progress", color: "#3949AB" },
    { label: "⌛ รอรับงาน", key: "pending", color: "#6D4C41" },
];

export function QuickSummary({ todayWithPending, progressInOut, pendingTotal, afterHourCount = 0, onClickAfterHourToday, inHourCount = 0, onClickInHourToday, onClickProgressInHourToday,
    onClickProgressAfterHourToday }) {
    if (!todayWithPending) return null;
    return (
        <Box sx={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: 2, p: 2, mb: 3, backgroundColor: 'background.level1',
            borderRadius: 'lg', border: '1px solid', borderColor: 'divider',
            flexWrap: 'wrap'
        }}>
            <Typography level="body-sm" color="neutral" fontWeight="lg">📊 สรุปวันนี้:</Typography>
            <Chip variant="soft" color="primary" size="md" onClick={onClickInHourToday} sx={{ cursor: 'pointer' }}>☀️ ในเวลา {inHourCount || 0} เคส</Chip>
            <Tooltip title="คลิกเพื่อดูรายการปิดนอกเวลาวันนี้">
                <Chip variant="soft" color="danger" size="md" onClick={onClickAfterHourToday} sx={{ cursor: 'pointer' }}>
                    🌙 นอกเวลา {afterHourCount || 0} เคส
                </Chip>
            </Tooltip>
            <Chip
                variant="soft"
                color="warning"
                size="md"
                onClick={onClickProgressInHourToday}
                sx={{ cursor: 'pointer' }}
            >
                🛠️ กำลังดำเนินการ  {progressInOut.in_time || 0} เคส
            </Chip>
            {/* <Chip
                variant="soft"
                color="warning"
                size="md"
                onClick={onClickProgressAfterHourToday}
                sx={{ cursor: 'pointer' }}
            >
                🛠️ กำลังดำเนินการ (นอกเวลา) {progressInOut.out_time || 0} เคส
            </Chip> */}
            <Chip variant="soft" color="second" size="md">รอรับ {pendingTotal || 0} เคส</Chip>
        </Box>
    );
}

export default function StatCards({ data, afterHourData, showFilterInfoAlert = false }) {
    if (!data) {
        return (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", my: 4 }}>
                <Typography level="body-sm" color="neutral">กำลังโหลดข้อมูล...</Typography>
            </Box>
        );
    }

    return (
        <>
            {showFilterInfoAlert && (
                <Alert color="info" variant="soft" sx={{ mb: 3, borderRadius: 'lg' }} startDecorator="ℹ️">
                    ข้อมูลที่แสดงถูกกรองตามเงื่อนไขที่เลือก - คลิกปุ่ม "ล้าง" เพื่อดูข้อมูลทั้งหมด
                </Alert>
            )}

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                    overflowX: "auto",
                    pb: 1,
                    pr: 1,
                    scrollSnapType: "x mandatory",
                    "&::-webkit-scrollbar": { height: 8 },
                    "&::-webkit-scrollbar-thumb": { borderRadius: 8, backgroundColor: "neutral.outlinedBorder" },
                }}
            >
                {caseCategories.map((item) => {
                    const isPending = item.key === "pending";
                    const showSplit = !!afterHourData && !isPending;

                    return (
                        <Card
                            key={item.key}
                            variant="outlined"
                            sx={{
                                flex: `0 0 ${CARD_WIDTH}px`,
                                scrollSnapAlign: "start",
                                borderLeft: `6px solid ${item.color}`,
                                borderRadius: 3,
                                boxShadow: 3,
                                transition: "transform 0.2s ease",
                                "&:hover": { transform: "scale(1.02)", boxShadow: 6 },
                                display: "flex",
                                flexDirection: "column",
                                minHeight: CARD_MIN_HEIGHT,
                            }}
                        >
                            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 36, textAlign: "center" }}>
                                    <Typography level="title-md" fontWeight="lg">{item.label}</Typography>
                                </Box>

                                <Divider />

                                <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: VALUE_ZONE_MIN }}>
                                    {showSplit ? (
                                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", width: "100%", columnGap: 1 }}>
                                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                                <Typography level="h4">{valueDisplay(data[item.key])}</Typography>
                                                <Typography level="body-sm" color="neutral">ในเวลา</Typography>
                                            </Box>
                                            <Divider orientation="vertical" />
                                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                                <Typography level="h4">{valueDisplay(afterHourData[item.key])}</Typography>
                                                <Typography level="body-sm" color="neutral">นอกเวลา</Typography>
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Box sx={{ textAlign: "center" }}>
                                            <Typography level="h3" fontWeight="xl">{valueDisplay(data[item.key])}</Typography>
                                            <Box sx={{ height: 4 }} />
                                        </Box>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>
        </>
    );
}
