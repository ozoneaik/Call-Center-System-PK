import { useEffect, useState } from "react";
import axiosClient from "../../Axios";
import {
    Typography,
    Grid,
    Card,
    CardContent,
    Input,
    Box,
    Button,
    Modal,
    ModalDialog,
    ModalClose,
    Table,
    CircularProgress,
    Divider,
} from "@mui/joy";
import dayjs from "dayjs";
import EmployeeWorkloadTable from "./Reports/EmployeeWorkloadTable";
import TagWorkloadTable from "./Reports/TagWorkloadTable";
import EmployeeCaseDetailModal from "./Reports/EmployeeCaseDetailModal";
import TagCaseDetailModal from "./Reports/TagCaseDetailModal";

// Helper
const valueDisplay = (val) => (val !== undefined ? `${val}` : "-");

const BUCKET_KEYS = [
    "within_1_min",
    "one_to_five_min",
    "five_to_ten_min",
    "over_ten_min",
];

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

    inMap.total = BUCKET_KEYS.reduce((s, k) => s + (inMap[k] ?? 0), 0);
    outMap.total = BUCKET_KEYS.reduce((s, k) => s + (outMap[k] ?? 0), 0);
    totalMap.total = BUCKET_KEYS.reduce((s, k) => s + (totalMap[k] ?? 0), 0);

    return { inMap, outMap, totalMap };
}

const caseCategories = [
    { label: "📊 งานทั้งหมด", key: "total", color: "#1976D2" },
    { label: "⏱ ภายใน 1 นาที", key: "within_1_min", color: "#2E7D32" },
    { label: "🕐 1-5 นาที", key: "one_to_five_min", color: "#43A047" },
    { label: "🕒 5-10 นาที", key: "five_to_ten_min", color: "#FB8C00" },
    { label: "⏰ มากกว่า 10 นาที", key: "over_ten_min", color: "#FF9800" },
    { label: "🛠️ กำลังดำเนินการ", key: "in_progress", color: "#3949AB" },
    { label: "⌛ รอรับงาน", key: "pending", color: "#6D4C41" }, 
];

export default function StatisticsCase() {
    const [today] = useState(dayjs().format("YYYY-MM-DD"));
    const [todayStats, setTodayStats] = useState(null);
    const [afterHourStats, setAfterHourStats] = useState(null);
    const [rangeStats, setRangeStats] = useState([]);
    const [afterHourRangeStats, setAfterHourRangeStats] = useState([]);

    const [employeeStats, setEmployeeStats] = useState([]);
    const [tagStats, setTagStats] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [showAfterHourModal, setShowAfterHourModal] = useState(false);

    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    const [afterHourStartDate, setAfterHourStartDate] = useState(today);
    const [afterHourEndDate, setAfterHourEndDate] = useState(today);

    const [openEmpModal, setOpenEmpModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [empCaseRows, setEmpCaseRows] = useState([]);

    const [openTagModal, setOpenTagModal] = useState(false);
    const [selectedTag, setSelectedTag] = useState(null);
    const [tagCaseRows, setTagCaseRows] = useState([]);

    const [progressInOut, setProgressInOut] = useState({ in_time: 0, out_time: 0, total: 0 });
    const [pendingTotal, setPendingTotal] = useState(0); 

    useEffect(() => {
        axiosClient
            .get("home/user-case/closure-stats", { params: { date: today } })
            .then(({ data }) => {
                const { inMap, outMap } = bucketsToKeyed(data.current || []);
                setTodayStats(inMap);
                setAfterHourStats(outMap);
            })
            .catch((err) => {
                console.error("❌ closure-stats error:", err);
                alert("โหลดข้อมูลวันนี้ไม่สำเร็จ");
            });

        axiosClient
            .get("home/user-case/in-progress-business-hours", { params: { today_only: 1 } })
            .then(({ data }) => setProgressInOut({
                in_time: data.in_time ?? 0,
                out_time: data.out_time ?? 0,
                total: data.total ?? 0,
            }))
            .catch((err) => {
                console.error("❌ in-progress-business-hours error:", err);
            });

        axiosClient
            .get("home/user-case/pending-today")
            .then(({ data }) => setPendingTotal(data?.total ?? 0))
            .catch((err) => {
                console.error("❌ pending-today error:", err);
                setPendingTotal(0);
            });

        axiosClient
            .get("home/user-case/employee")
            .then(({ data }) => {
                const rows = (data.data || []).map((item) => ({
                    name: item.name,
                    empCode: item.empCode,
                    percent: item.percentage,
                    total: item.total,
                    min1to5: item.one_to_five_min,
                    min5to10: item.five_to_ten_min,
                    over10: item.over_ten_min,
                    inProgress: item.in_progress,
                    onClickDetail: async (row) => {
                        setSelectedUser(row);
                        try {
                            const { data } = await axiosClient.get(`/home/user-case/employee/${row.empCode}/cases`);
                            const rows = (data.cases || []).map((c) => ({
                                conversation_id: c.conversation_id,
                                status_name: c.status_name,
                                customer_name: c.customer_name,
                                room_name: c.room_id ?? "-",
                                start_time: dayjs(c.started_at).format("DD/MM/YYYY HH:mm"),
                                accept_time: c.accepted_at
                                    ? dayjs(c.accepted_at).format("DD/MM/YYYY HH:mm")
                                    : "-",
                                end_time: c.closed_at
                                    ? dayjs(c.closed_at).format("DD/MM/YYYY HH:mm")
                                    : "-",
                                tag_name: c.tag_name,
                                custId: c.custId,
                            }));
                            setEmpCaseRows(rows);
                            setOpenEmpModal(true);
                        } catch (err) {
                            console.error("❌ Load all user cases failed", err);
                            alert("ไม่สามารถโหลดข้อมูลเคสทั้งหมดของพนักงานได้");
                        }
                    },
                }));
                setEmployeeStats(rows);
            })
            .catch((err) => {
                console.error("❌ employeeWorkloadSummary error:", err);
                alert("โหลดข้อมูลพนักงานไม่สำเร็จ");
            });

        axiosClient
            .get("home/user-case/tag-workload")
            .then(({ data }) => {
                const rows = (data.data || []).map((item) => ({
                    tag: item.tag,
                    percent: item.percent,
                    total: item.total,
                    min1to5: item.one_to_five_min,
                    min5to10: item.five_to_ten_min,
                    over10: item.over_ten_min,
                    onClickDetail: async (row) => {
                        try {
                            const { data } = await axiosClient.get(`/home/user-case/tag/${encodeURIComponent(row.tag)}/cases`);
                            const rows = (data.cases || []).map((c) => ({
                                customer_name: c.customer_name,
                                room_id: c.room_id ?? "-",
                                start_time: dayjs(c.started_at).format("DD/MM/YYYY HH:mm"),
                                accept_time: c.accepted_at ? dayjs(c.accepted_at).format("DD/MM/YYYY HH:mm") : "-",
                                end_time: c.closed_at ? dayjs(c.closed_at).format("DD/MM/YYYY HH:mm") : "-",
                                employee_name: c.employee_name ?? "-",
                                custId: c.custId,
                            }));
                            setSelectedTag(row.tag);
                            setTagCaseRows(rows);
                            setOpenTagModal(true);
                        } catch (err) {
                            console.error("❌ Load tag cases failed", err);
                            alert("โหลดข้อมูลเคสตามแท็กไม่สำเร็จ");
                        }
                    }
                }));
                setTagStats(rows);
            })
            .catch((err) => {
                console.error("❌ tagWorkloadSummary error:", err);
                alert("โหลดข้อมูลแท็กไม่สำเร็จ");
            });
    }, [today]);


    const fetchRangeStats = async () => {
        try {
            const { data } = await axiosClient.get(
                "home/user-case/closure-range-stats",
                { params: { start_date: startDate, end_date: endDate } }
            );
            const rows = (data.data || []).map((d) => {
                const { totalMap } = bucketsToKeyed(d.buckets || []);
                return {
                    date: d.date,
                    ...totalMap,
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
                {
                    params: {
                        start_date: afterHourStartDate,
                        end_date: afterHourEndDate,
                    },
                }
            );
            setAfterHourRangeStats(data.data || []);
        } catch (err) {
            console.error("❌ after-hour-closure-range-stats error:", err);
            alert("โหลดข้อมูลช่วงวันที่นอกเวลาทำการไม่สำเร็จ");
        }
    };

    // ปรับให้ pending แสดงแบบ “ยอดเดียว” แม้ว่าการ์ดอื่นจะแสดงแยกซ้าย/ขวา
    const renderStatCards = (data, categories, afterHourData = null) => (
        <Grid container spacing={3} mb={4}>
            {categories.map((item) => {
                const isPending = item.key === "pending";
                const showSplit = !!afterHourData && !isPending; // split เฉพาะที่ไม่ใช่ pending
                return (
                    <Grid key={item.key} xs={12} sm={6} md={3} lg={2}>
                        <Card
                            variant="outlined"
                            sx={{
                                borderLeft: `6px solid ${item.color}`,
                                borderRadius: 3,
                                boxShadow: 3,
                                transition: "transform 0.2s ease",
                                "&:hover": { transform: "scale(1.02)", boxShadow: 6 },
                            }}
                        >
                            <CardContent>
                                <Typography level="title-md" fontWeight="lg" sx={{ textAlign: "center", mb: 1 }}>
                                    {item.label}
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                {showSplit ? (
                                    <Box display="flex" justifyContent="space-between">
                                        <Box flex={1} display="flex" flexDirection="column" alignItems="center">
                                            <Typography level="h4">{valueDisplay(data[item.key])}</Typography>
                                            <Typography level="body-sm" color="neutral">ในเวลาทำการ</Typography>
                                        </Box>
                                        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                                        <Box flex={1} display="flex" flexDirection="column" alignItems="center">
                                            <Typography level="h4">{valueDisplay(afterHourData[item.key])}</Typography>
                                            <Typography level="body-sm" color="neutral">นอกเวลาทำการ</Typography>
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
                );
            })}
        </Grid>
    );

    const renderRangeTable = (data) => (
        <Box sx={{ overflowX: "auto", maxHeight: "60vh", border: "1px solid #ccc", borderRadius: 4, mt: 1 }}>
            {data.length > 0 && (
                <Table variant="outlined" hoverRow stickyHeader sx={{ minWidth: 850 }}>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>วันที่</th>
                            {BUCKET_KEYS.map(k => (<th key={k}>{k}</th>))}
                            <th>รวม</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr key={row.date}>
                                <td>{idx + 1}</td>
                                <td>{dayjs(row.date).format("DD/MM/YYYY")}</td>
                                {BUCKET_KEYS.map(k => (<td key={k}>{row[k]}</td>))}
                                <td>{row.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Box>
    );

    // รวมค่าให้พร้อมเรนเดอร์: ตัวอื่นมาจาก todayStats/afterHourStats, ส่วน pending มาเติมเพิ่ม
    const todayWithPending = todayStats ? { ...todayStats, pending: pendingTotal } : null;

    return (
        <>
            <Typography level="h2" mb={4}>📊 สถิติการปิดเคส ({dayjs().format("DD/MM/YYYY")})</Typography>

            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
                <Button onClick={() => setShowModal(true)} variant="outlined">📅 ดูข้อมูลช่วงวันที่ (ในเวลาทำการ)</Button>
                <Button onClick={() => setShowAfterHourModal(true)} variant="outlined">🌙 ดูข้อมูลช่วงวันที่ (นอกเวลาทำการ)</Button>
            </Box>

            {!todayWithPending || !afterHourStats ? (
                <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                    <CircularProgress size="lg" />
                </Box>
            ) : (
                renderStatCards(
                    {
                        ...todayWithPending,
                        in_progress: progressInOut.in_time, // in-progress ยังแยกเหมือนเดิม
                    },
                    caseCategories,
                    {
                        ...afterHourStats,
                        in_progress: progressInOut.out_time,
                        // ไม่มี pending ฝั่งขวา -> การ์ด pending จะเรนเดอร์แบบ single
                    }
                )
            )}

            {/* Modals */}
            <Modal open={showModal} onClose={() => setShowModal(false)}>
                <ModalDialog sx={{ width: "90vw", maxHeight: "90vh", p: 2 }}>
                    <ModalClose />
                    <Typography level="h5" mb={2}>📆 เลือกช่วงวันที่ (ในเวลาทำการ)</Typography>
                    <Grid container spacing={2}>
                        <Grid xs={6}><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></Grid>
                        <Grid xs={6}><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></Grid>
                        <Grid xs={12}><Button onClick={fetchRangeStats}>🔍 ค้นหา</Button></Grid>
                    </Grid>
                    {renderRangeTable(rangeStats)}
                </ModalDialog>
            </Modal>

            <Modal open={showAfterHourModal} onClose={() => setShowAfterHourModal(false)}>
                <ModalDialog sx={{ width: "90vw", maxHeight: "90vh", p: 2 }}>
                    <ModalClose />
                    <Typography level="h5" mb={2}>🌙 เลือกช่วงวันที่ (นอกเวลาทำการ)</Typography>
                    <Grid container spacing={2}>
                        <Grid xs={6}><Input type="date" value={afterHourStartDate} onChange={e => setAfterHourStartDate(e.target.value)} /></Grid>
                        <Grid xs={6}><Input type="date" value={afterHourEndDate} onChange={e => setAfterHourEndDate(e.target.value)} /></Grid>
                        <Grid xs={12}><Button onClick={fetchAfterHourRangeStats}>🔍 ค้นหา</Button></Grid>
                    </Grid>
                    {renderRangeTable(afterHourRangeStats)}
                </ModalDialog>
            </Modal>

            {/* Tables */}
            <EmployeeWorkloadTable rows={employeeStats} />
            <TagWorkloadTable rows={tagStats} />

            <EmployeeCaseDetailModal
                open={openEmpModal}
                onClose={() => setOpenEmpModal(false)}
                user={selectedUser}
                rows={empCaseRows}
            />
            <TagCaseDetailModal
                open={openTagModal}
                onClose={() => setOpenTagModal(false)}
                tag={selectedTag}
                rows={tagCaseRows}
            />
        </>
    );
}
