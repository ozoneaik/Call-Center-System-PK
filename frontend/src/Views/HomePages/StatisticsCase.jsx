import { useEffect, useState } from "react";
import axiosClient from "../../Axios";
import {
    Typography,
    Grid,
    Card,
    CardContent,
    Sheet,
    Input,
    Box,
    Button,
    Modal,
    ModalDialog,
    Table,
    CircularProgress,
    Divider,
    ModalClose,
} from "@mui/joy";
import dayjs from "dayjs";

// ===================== Helper =====================

// แสดงค่าแบบ fallback
const valueDisplay = (val) => (val !== undefined ? `${val} ` : "-");

// bucket keys ตามฝั่ง backend
const BUCKET_KEYS = [
    "within_1_min",
    "over_1_min",
    "over_5_min",
    "over_10_min",
    "over_1_hour",
    "over_1_day",
];

// แปลง buckets (array) -> object แบบ key เดิม (in/out/total)
function bucketsToKeyed(buckets = []) {
    const inMap = {};
    const outMap = {};
    const totalMap = {};

    BUCKET_KEYS.forEach((k, i) => {
        const b = buckets[i] || { in_time: 0, out_time: 0, total_case: 0 };
        inMap[k] = b.in_time ?? 0;
        outMap[k] = b.out_time ?? 0;
        totalMap[k] = b.total_case ?? 0;
    });

    // รวมทั้งหมด
    inMap.total = BUCKET_KEYS.reduce((s, k) => s + (inMap[k] ?? 0), 0);
    outMap.total = BUCKET_KEYS.reduce((s, k) => s + (outMap[k] ?? 0), 0);
    totalMap.total = BUCKET_KEYS.reduce((s, k) => s + (totalMap[k] ?? 0), 0);

    return { inMap, outMap, totalMap };
}

// หมวดหมู่การ์ด
const caseCategories = [
    { label: "⏱ ภายใน 1 นาที", key: "within_1_min", color: "#2E7D32" },
    { label: "⚡ มากกว่า 1 นาที", key: "over_1_min", color: "#43A047" },
    { label: "🕒 มากกว่า 5 นาที", key: "over_5_min", color: "#FB8C00" },
    { label: "⏰ มากกว่า 10 นาที", key: "over_10_min", color: "#FF9800" },
    { label: "🕐 มากกว่า 1 ชั่วโมง", key: "over_1_hour", color: "#E91E63" },
    { label: "📅 มากกว่า 1 วัน", key: "over_1_day", color: "#D32F2F" },
    { label: "📊 รวมทั้งหมด", key: "total", color: "#1976D2" },
];

export default function StatisticsCase() {
    const [today] = useState(dayjs().format("YYYY-MM-DD"));
    const [todayStats, setTodayStats] = useState(null);      // ในเวลาทำการ (mapped)
    const [afterHourStats, setAfterHourStats] = useState(null); // นอกเวลาทำการ (mapped)

    const [showModal, setShowModal] = useState(false);
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [rangeStats, setRangeStats] = useState([]);

    const [showAfterHourModal, setShowAfterHourModal] = useState(false);
    const [afterHourStartDate, setAfterHourStartDate] = useState(today);
    const [afterHourEndDate, setAfterHourEndDate] = useState(today);
    const [afterHourRangeStats, setAfterHourRangeStats] = useState([]);

    useEffect(() => {
        axiosClient
            .get("home/user-case/closure-stats", { params: { date: today } })
            .then(({ data }) => {
                console.log("✅ closure-stats response:", data);
                // backend: { date, current: [...buckets], compare: {...} }
                const { inMap, outMap } = bucketsToKeyed(data.current || []);
                setTodayStats(inMap);
                setAfterHourStats(outMap);
            })
            .catch((err) => {
                console.error("❌ closure-stats error:", err);
                alert("โหลดข้อมูลวันนี้ไม่สำเร็จ");
            });
    }, [today]);

    const fetchRangeStats = async () => {
        try {
            const { data } = await axiosClient.get(
                "home/user-case/closure-range-stats",
                { params: { start_date: startDate, end_date: endDate } }
            );
            console.log("✅ closure-range-stats response:", data);
            // data.data: [{ date, buckets: [...] }, ...]
            const rows = (data.data || []).map((d) => {
                const { totalMap } = bucketsToKeyed(d.buckets || []);
                return {
                    date: d.date,
                    within_1_min: totalMap.within_1_min,
                    over_1_min: totalMap.over_1_min,
                    over_5_min: totalMap.over_5_min,
                    over_10_min: totalMap.over_10_min,
                    over_1_hour: totalMap.over_1_hour,
                    over_1_day: totalMap.over_1_day,
                    total: totalMap.total,
                };
            });
            setRangeStats(rows);
        } catch (err) {
            console.error("❌ closure-range-stats error:", err);
            alert("โหลดข้อมูลช่วงวันที่ไม่สำเร็จ");
        }
    };

    const fetchAfterHourRangeStats = async () => {
        try {
            const { data } = await axiosClient.get(
                "home/user-case/after-hour-closure-range-stats",
                { params: { start_date: afterHourStartDate, end_date: afterHourEndDate } }
            );
            console.log("✅ after-hour-closure-range-stats response:", data);
            setAfterHourRangeStats(data.data || []);
        } catch (err) {
            console.error("❌ after-hour-closure-range-stats error:", err);
            alert("โหลดข้อมูลช่วงวันที่นอกเวลาทำการไม่สำเร็จ");
        }
    };

    const renderStatCards = (data, categories, afterHourData = null) => (
        <Grid container spacing={3} mb={4}>
            {categories.map((item) => (
                <Grid key={item.key} xs={12} sm={6} md={3} lg={2}>
                    <Card
                        variant="outlined"
                        sx={{
                            borderLeft: `6px solid ${item.color}`,
                            borderRadius: 3,
                            boxShadow: 3,
                            transition: "transform 0.2s ease",
                            "&:hover": {
                                transform: "scale(1.02)",
                                boxShadow: 6,
                            },
                        }}
                    >
                        <CardContent>
                            <Typography
                                level="title-md"
                                fontWeight="lg"
                                sx={{ textAlign: "center", mb: 1 }}
                            >
                                {item.label}
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {afterHourData ? (
                                <Box display="flex" justifyContent="space-between">
                                    <Box
                                        flex={1}
                                        display="flex"
                                        flexDirection="column"
                                        alignItems="center"
                                    >
                                        <Typography level="h4" fontWeight="xl" sx={{ mb: 0.5 }}>
                                            {valueDisplay(data[item.key])}
                                        </Typography>
                                        <Typography level="body-sm" color="neutral">
                                            ในเวลาทำการ
                                        </Typography>
                                    </Box>

                                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                                    <Box
                                        flex={1}
                                        display="flex"
                                        flexDirection="column"
                                        alignItems="center"
                                    >
                                        <Typography level="h4" fontWeight="xl" sx={{ mb: 0.5 }}>
                                            {valueDisplay(afterHourData[item.key])}
                                        </Typography>
                                        <Typography level="body-sm" color="neutral">
                                            นอกเวลาทำการ
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : (
                                <Box textAlign="center">
                                    <Typography level="h3" fontWeight="xl">
                                        {valueDisplay(data[item.key])}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );

    const renderRangeTable = (data) => (
        <Box
            sx={{
                overflowX: "auto",
                maxHeight: "60vh",
                border: "1px solid #ccc",
                borderRadius: 4,
                mt: 1,
            }}
        >
            {data.length > 0 && (
                <Table
                    variant="outlined"
                    hoverRow
                    stickyHeader
                    sx={{
                        minWidth: 850,
                        "& td, & th": { textAlign: "center", whiteSpace: "nowrap" },
                    }}
                >
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>วันที่</th>
                            <th>ภายใน 1 นาที</th>
                            <th>มากกว่า 1 นาที</th>
                            <th>มากกว่า 5 นาที</th>
                            <th>มากกว่า 10 นาที</th>
                            <th>มากกว่า 1 ชั่วโมง</th>
                            <th>มากกว่า 1 วัน</th>
                            <th>รวม</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr key={row.date}>
                                <td>{idx + 1}</td>
                                <td>{dayjs(row.date).format("DD/MM/YYYY")}</td>
                                <td>{row.within_1_min}</td>
                                <td>{row.over_1_min}</td>
                                <td>{row.over_5_min}</td>
                                <td>{row.over_10_min}</td>
                                <td>{row.over_1_hour}</td>
                                <td>{row.over_1_day}</td>
                                <td>{row.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Box>
    );

    return (
        <Sheet sx={{ mt: 3 }}>
            <Typography level="h2" mb={4}>
                📊 สถิติการปิดเคส ({dayjs().format("DD/MM/YYYY")})
            </Typography>

            {/* Control Buttons */}
            <Box
                sx={{
                    display: "flex",
                    gap: 2,
                    mb: 3,
                    flexWrap: "wrap",
                    justifyContent: "left",
                }}
            >
                <Button
                    onClick={() => setShowModal(true)}
                    color="primary"
                    variant="outlined"
                    startDecorator="📅"
                >
                    ดูข้อมูลช่วงวันที่ (เวลาทำการ)
                </Button>
                <Button
                    onClick={() => setShowAfterHourModal(true)}
                    color="primary"
                    variant="outlined"
                    startDecorator="🌙"
                >
                    ดูข้อมูลช่วงวันที่ (นอกเวลาทำการ)
                </Button>
            </Box>

            <Typography level="title-lg" mb={2} sx={{ textAlign: "left" }}>
                📊 สรุปภาพรวม (ในเวลาทำการ vs นอกเวลาทำการ)
            </Typography>

            {!todayStats || !afterHourStats ? (
                <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                    <CircularProgress size="lg" />
                </Box>
            ) : (
                renderStatCards(todayStats, caseCategories, afterHourStats)
            )}

            {/* Modal: Regular Hours */}
            <Modal open={showModal} onClose={(e, reason) => {
                if (reason === "backdropClick" || reason === "escapeKeyDown") {
                    return;
                }
                setShowModal(false);
            }}>
                <ModalDialog
                    sx={{
                        width: "90vw",
                        maxWidth: 1200,
                        minWidth: { xs: "90vw", sm: 700 },
                        maxHeight: "90vh",
                        overflowY: "auto",
                        p: 2,
                    }}
                >
                    <ModalClose />
                    <Typography level="h5" mb={2}>
                        📆 เลือกช่วงวันที่ (เวลาทำการ)
                    </Typography>
                    <Grid container spacing={2} mb={2}>
                        <Grid xs={12} sm={6}>
                            <Typography level="body-sm" mb={1}>
                                วันที่เริ่มต้น
                            </Typography>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </Grid>
                        <Grid xs={12} sm={6}>
                            <Typography level="body-sm" mb={1}>
                                วันที่สิ้นสุด
                            </Typography>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </Grid>
                        <Grid xs={12}>
                            <Button onClick={fetchRangeStats}>🔍 ค้นหา</Button>
                        </Grid>
                    </Grid>
                    {renderRangeTable(rangeStats)}
                </ModalDialog>
            </Modal>

            <Modal open={showAfterHourModal} onClose={(e, reason) => {
                if (reason === "backdropClick" || reason === "escapeKeyDown") {
                    return;
                }
                setShowAfterHourModal(false)
            }}>
                <ModalDialog
                    sx={{
                        width: "90vw",
                        maxWidth: 1200,
                        minWidth: { xs: "90vw", sm: 700 },
                        maxHeight: "90vh",
                        overflowY: "auto",
                        p: 2,
                    }}
                >
                    <ModalClose/>
                    <Typography level="h5" mb={2}>
                        🌙 เลือกช่วงวันที่ (นอกเวลาทำการ)
                    </Typography>
                    <Grid container spacing={2} mb={2}>
                        <Grid xs={12} sm={6}>
                            <Typography level="body-sm" mb={1}>
                                วันที่เริ่มต้น
                            </Typography>
                            <Input
                                type="date"
                                value={afterHourStartDate}
                                onChange={(e) => setAfterHourStartDate(e.target.value)}
                            />
                        </Grid>
                        <Grid xs={12} sm={6}>
                            <Typography level="body-sm" mb={1}>
                                วันที่สิ้นสุด
                            </Typography>
                            <Input
                                type="date"
                                value={afterHourEndDate}
                                onChange={(e) => setAfterHourEndDate(e.target.value)}
                            />
                        </Grid>
                        <Grid xs={12}>
                            <Button onClick={fetchAfterHourRangeStats}>🔍 ค้นหา</Button>
                        </Grid>
                    </Grid>
                    {renderRangeTable(afterHourRangeStats)}
                </ModalDialog>
            </Modal>
        </Sheet>
    );
}
