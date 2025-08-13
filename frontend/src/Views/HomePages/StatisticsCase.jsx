import { useEffect, useState } from "react";
import axiosClient from "../../Axios";
import {
    Typography, Grid, Card, CardContent, Input, Box, Button,
    Modal, ModalDialog, ModalClose, Table, CircularProgress, Divider,
    Select, Option, FormLabel, FormControl, Chip, Stack, Sheet, Alert,
    ChipDelete
} from "@mui/joy";
import dayjs from "dayjs";
import EmployeeWorkloadTable from "./Reports/EmployeeWorkloadTable";
import TagWorkloadTable from "./Reports/TagWorkloadTable";
import EmployeeCaseDetailModal from "./Reports/EmployeeCaseDetailModal";
import TagCaseDetailModal from "./Reports/TagCaseDetailModal";

const valueDisplay = (val) => (val !== undefined ? `${val}` : "-");
const BUCKET_KEYS = ["ภายใน 1 นาที", "1-5 นาที", "5-10 นาที", "มากกว่า 10 นาที"];

function bucketsToKeyed(buckets = []) {
    const inMap = {}, outMap = {}, totalMap = {};
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
    { label: "⏱ ภายใน 1 นาที", key: "ภายใน 1 นาที", color: "#2E7D32" },
    { label: "🕐 1-5 นาที", key: "1-5 นาที", color: "#43A047" },
    { label: "🕒 5-10 นาที", key: "5-10 นาที", color: "#FB8C00" },
    { label: "⏰ มากกว่า 10 นาที", key: "มากกว่า 10 นาที", color: "#FF9800" },
    { label: "🛠️ กำลังดำเนินการ", key: "in_progress", color: "#3949AB" },
    { label: "⌛ รอรับงาน", key: "pending", color: "#6D4C41" },
];

/** ดาวน์โหลดไฟล์ Excel จาก API (อ่านชื่อไฟล์จาก Content-Disposition ถ้ามี) */
/** ดาวน์โหลดไฟล์ Excel จาก API + รองรับ onStart/onDone สำหรับ loading */
async function downloadExcel(url, params = {}, opts = {}) {
    const { onStart, onDone } = opts;
    try {
        onStart && onStart();
        const resp = await axiosClient.get(url, { params, responseType: "blob" });
        let filename = "export.xlsx";
        const cd = resp.headers?.["content-disposition"] || resp.headers?.["Content-Disposition"];
        if (cd) {
            const m = /filename\*?=(?:UTF-8'')?"?([^\";]+)"?/i.exec(cd);
            if (m?.[1]) filename = decodeURIComponent(m[1]);
        }
        const blob = new Blob([resp.data], {
            type: resp.data?.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const link = document.createElement("a");
        const objectUrl = URL.createObjectURL(blob);
        link.href = objectUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(objectUrl);
    } catch (err) {
        console.error("Export Excel failed:", err);
        alert("Export Excel ไม่สำเร็จ");
    } finally {
        onDone && onDone();
    }
}

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

    // ===== ฟิลเตอร์ =====
    const [filterPlatform, setFilterPlatform] = useState("");
    const [filterDept, setFilterDept] = useState("");
    const [filterEmp, setFilterEmp] = useState("");

    const [platformOptions, setPlatformOptions] = useState([]);
    const [deptOptions, setDeptOptions] = useState([]);
    const [empOptions, setEmpOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        (async () => {
            const [p1, p2, p3] = await Promise.allSettled([
                axiosClient.get("home/user-case/options/platforms"),
                axiosClient.get("home/user-case/options/departments"),
                axiosClient.get("home/user-case/options/employees", { params: { dept: "" } }),
            ]);
            const asArray = (d) => (Array.isArray(d) ? d : d?.options ?? []);

            if (p1.status === "fulfilled") setPlatformOptions(asArray(p1.value.data)); else setPlatformOptions([]);
            if (p2.status === "fulfilled") setDeptOptions(asArray(p2.value.data)); else setDeptOptions([]);
            if (p3.status === "fulfilled") setEmpOptions(asArray(p3.value.data)); else setEmpOptions([]);
            setIsLoading(false);
        })();
    }, []);

    // เมื่อเปลี่ยนแผนก ให้รีเฟรชพนักงาน
    useEffect(() => {
        (async () => {
            try {
                const { data } = await axiosClient.get("home/user-case/options/employees", {
                    params: { dept: filterDept || "" },
                });
                const asArray = (d) => (Array.isArray(d) ? d : d?.options ?? []);
                const list = asArray(data);
                setEmpOptions(list);
                if (filterEmp && !list.some((e) => e.value === filterEmp)) setFilterEmp("");
            } catch (e) {
                console.error("reload employees failed", e);
            }
        })();
    }, [filterDept]);

    // โหลดข้อมูลหลัก (ผูก filters)
    useEffect(() => {
        const baseParams = {
            platform_id: filterPlatform || undefined,
            dept: filterDept || undefined,
            empCode: filterEmp || undefined,
        };

        axiosClient
            .get("home/user-case/closure-stats", { params: { date: today, ...baseParams } })
            .then(({ data }) => {
                const { inMap, outMap } = bucketsToKeyed(data.current || []);
                setTodayStats(inMap);
                setAfterHourStats(outMap);
            })
            .catch((err) => {
                console.error("❌ closure-stats error:", err);
                // alert("โหลดข้อมูลวันนี้ไม่สำเร็จ");
            });

        axiosClient
            .get("home/user-case/in-progress-business-hours", { params: { today_only: 1, ...baseParams } })
            .then(({ data }) => setProgressInOut({
                in_time: data.in_time ?? 0,
                out_time: data.out_time ?? 0,
                total: data.total ?? 0,
            }))
            .catch((err) => console.error("❌ in-progress-business-hours error:", err));

        axiosClient
            .get("home/user-case/pending-today", { params: baseParams })
            .then(({ data }) => setPendingTotal(data?.total ?? 0))
            .catch((err) => { console.error("❌ pending-today error:", err); setPendingTotal(0); });

        axiosClient
            .get("home/user-case/employee", { params: baseParams })
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
                            const { data } = await axiosClient.get(`/home/user-case/employee/${row.empCode}/cases`, { params: baseParams });
                            const rows = (data.cases || []).map((c) => ({
                                conversation_id: c.conversation_id,
                                status_name: c.status_name,
                                customer_name: c.customer_name,
                                room_name: c.room_id ?? "-",
                                start_time: dayjs(c.started_at).format("DD/MM/YYYY HH:mm"),
                                accept_time: c.accepted_at ? dayjs(c.accepted_at).format("DD/MM/YYYY HH:mm") : "-",
                                end_time: c.closed_at ? dayjs(c.closed_at).format("DD/MM/YYYY HH:mm") : "-",
                                tag_name: c.tag_name,
                                custId: c.custId,
                            }));
                            setEmpCaseRows(rows);
                            setOpenEmpModal(true);
                        } catch (err) {
                            console.error("❌ Load all user cases failed", err);
                            // alert("ไม่สามารถโหลดข้อมูลเคสทั้งหมดของพนักงานได้");
                        }
                    },
                }));
                setEmployeeStats(rows);
            })
            .catch((err) => {
                console.error("❌ employeeWorkloadSummary error:", err);
                // alert("โหลดข้อมูลพนักงานไม่สำเร็จ");
            });

        axiosClient
            .get("home/user-case/tag-workload", { params: baseParams })
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
                            const { data } = await axiosClient.get(`/home/user-case/tag/${encodeURIComponent(row.tag)}/cases`, { params: baseParams });
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
                            // alert("โหลดข้อมูลเคสตามแท็กไม่สำเร็จ");
                        }
                    },
                }));
                setTagStats(rows);
            })
            .catch((err) => {
                console.error("❌ tagWorkloadSummary error:", err);
                // alert("โหลดข้อมูลแท็กไม่สำเร็จ");
            });
    }, [today, filterPlatform, filterDept, filterEmp]);

    const fetchRangeStats = async () => {
        const params = {
            start_date: startDate, end_date: endDate,
            platform_id: filterPlatform || undefined,
            dept: filterDept || undefined,
            empCode: filterEmp || undefined,
        };
        try {
            const { data } = await axiosClient.get("home/user-case/closure-range-stats", { params });
            const rows = (data.data || []).map((d) => {
                const { totalMap } = bucketsToKeyed(d.buckets || []);
                return { date: d.date, ...totalMap };
            });
            setRangeStats(rows);
        } catch (err) {
            console.error("❌ closure-range-stats error:", err);
            // alert("โหลดข้อมูลช่วงวันที่ไม่สำเร็จ");
        }
    };

    const mapAfterHourRows = (rows = []) =>
        (rows || []).map(r => ({
            date: r.date,
            "ภายใน 1 นาที": r.within_1_min ?? 0,
            "1-5 นาที": r.one_to_five_min ?? 0,
            "5-10 นาที": r.five_to_ten_min ?? 0,
            "มากกว่า 10 นาที": r.over_ten_min ?? 0,
            total: r.total ?? 0,
        }));

    const fetchAfterHourRangeStats = async () => {
        const params = {
            start_date: afterHourStartDate, end_date: afterHourEndDate,
            platform_id: filterPlatform || undefined,
            dept: filterDept || undefined,
            empCode: filterEmp || undefined,
        };
        try {
            const { data } = await axiosClient.get("home/user-case/after-hour-closure-range-stats", { params });
            setAfterHourRangeStats(mapAfterHourRows(data.data));
        } catch (err) {
            console.error("❌ after-hour-closure-range-stats error:", err);
            // alert("โหลดข้อมูลช่วงวันที่นอกเวลาทำการไม่สำเร็จ");
        }
    };

    // ---------- Export Handlers ----------
    const buildBusinessExportParams = () => ({
        start_date: startDate,
        end_date: endDate,
        platform_id: filterPlatform || undefined,
        dept: filterDept || undefined,
        empCode: filterEmp || undefined,
    });

    const buildBusinessExportIntimeParams = () => ({
        start_date: startDate,
        end_date: endDate,
        platform_id: filterPlatform || undefined,
        dept: filterDept || undefined,
        empCode: filterEmp || undefined,
    });

    const buildAfterHourExportParams = () => ({
        start_date: afterHourStartDate,
        end_date: afterHourEndDate,
        platform_id: filterPlatform || undefined,
        dept: filterDept || undefined,
        empCode: filterEmp || undefined,
    });

    const fmtRange = (start, end) =>
        `${dayjs(start).format("DD/MM/YYYY")} - ${dayjs(end).format("DD/MM/YYYY")}`;

    const onExportBusiness = () =>
        downloadExcel("home/user-case/export/closure-range.xlsx", buildBusinessExportParams());

    const onExportAfterHour = () =>
        downloadExcel("home/user-case/export/after-hour-range.xlsx", buildAfterHourExportParams());

    const onExportDetailed = () =>
        downloadExcel(
            "home/user-case/export/detailed-cases.xlsx",
            buildBusinessExportParams(),
            { onStart: () => setExporting(true), onDone: () => setExporting(false) }
        );

    const onExportDetailedIntime = () =>
        downloadExcel(
            "home/user-case/export/detailed-cases-intime.xlsx",
            buildBusinessExportIntimeParams(),
            { onStart: () => setExporting(true), onDone: () => setExporting(false) }
        );
    // ------------------------------------

    const clearFilters = () => {
        setFilterDept("");
        setFilterEmp("");
        setFilterPlatform("");
    };

    const getActiveFiltersCount = () => {
        let count = 0;
        if (filterDept) count++;
        if (filterEmp) count++;
        if (filterPlatform) count++;
        return count;
    };

    const CARD_MIN_HEIGHT = { xs: 160, sm: 180, md: 190 };
    const VALUE_ZONE_MIN = { xs: 68, sm: 76, md: 84 };

    const renderStatCards = (data, categories, afterHourData = null) => (
        <Grid container spacing={3} mb={4} alignItems="stretch">
            {categories.map((item) => {
                const isPending = item.key === "pending";
                const showSplit = !!afterHourData && !isPending;

                return (
                    <Grid key={item.key} xs={12} sm={6} md={3} lg={2} sx={{ display: "flex" }}>
                        <Card
                            variant="outlined"
                            sx={{
                                borderLeft: `6px solid ${item.color}`,
                                borderRadius: 3,
                                boxShadow: 3,
                                transition: "transform 0.2s ease",
                                "&:hover": { transform: "scale(1.02)", boxShadow: 6 },
                                display: "flex",
                                flexDirection: "column",
                                height: "100%",
                                minHeight: CARD_MIN_HEIGHT,
                                width: "100%",
                            }}
                        >
                            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 36, textAlign: "center" }}>
                                    <Typography level="title-md" fontWeight="lg">
                                        {item.label}
                                    </Typography>
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
                            <th>#</th><th>วันที่</th>
                            {BUCKET_KEYS.map((k) => <th key={k}>{k}</th>)}
                            <th>รวม</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr key={row.date}>
                                <td>{idx + 1}</td>
                                <td>{dayjs(row.date).format("DD/MM/YYYY")}</td>
                                {BUCKET_KEYS.map((k) => <td key={k}>{row[k]}</td>)}
                                <td>{valueDisplay(row.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Box>
    );

    const todayWithPending = todayStats ? { ...todayStats, pending: pendingTotal } : null;

    return (
        <Box sx={{ p: 3, pt: 0 }}>
            <Typography level="h2" mb={2}>📊 สถิติการปิดเคส </Typography>

            {/* Filter Section - Single Row Layout */}
            <Sheet variant="outlined" sx={{
                p: 3, mb: 3, borderRadius: 'lg',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                border: '1px solid', borderColor: 'divider', boxShadow: 'sm'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography level="title-lg" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        🔍 ตัวกรองข้อมูล
                        {getActiveFiltersCount() > 0 && <Chip size="sm" color="primary" variant="soft">{getActiveFiltersCount()} ตัวกรอง</Chip>}
                        {isLoading && <CircularProgress size="sm" />}
                    </Typography>
                    <Typography level="body-sm" color="neutral">
                        อัปเดตล่าสุด: {dayjs().format("DD/MM/YYYY HH:mm:ss")}
                    </Typography>
                </Box>

                {/* Single Row Filter Layout */}
                <Box sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    alignItems: 'flex-end',
                    '@media (max-width: 1200px)': {
                        flexDirection: 'column',
                        gap: 2
                    }
                }}>
                    {/* Filter Controls */}
                    <Box sx={{
                        display: 'flex',
                        gap: 2,
                        flexWrap: 'nowrap',
                        minWidth: 0,
                        flex: 1,
                        alignItems: 'flex-end', // จัดให้อยู่ล่างสุดเท่ากัน
                        '@media (max-width: 900px)': {
                            flexWrap: 'wrap',
                            width: '100%'
                        }
                    }}>
                        {/* Department */}
                        <FormControl sx={{ minWidth: 140 }}>
                            <FormLabel sx={{
                                fontSize: '0.875rem',
                                height: '40px', // กำหนดความสูงให้เท่ากัน
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                🏢 แผนก
                            </FormLabel>
                            <Select
                                size="sm"
                                placeholder="ทั้งหมด"
                                value={filterDept}
                                onChange={(e, value) => setFilterDept(value || "")}
                                loading={isLoading}
                                sx={{ backgroundColor: 'background.body' }}
                            >
                                <Option value="">ทั้งหมด</Option>
                                {deptOptions.map((dept) => (
                                    <Option key={dept.value} value={dept.value}>{dept.label}</Option>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Employee */}
                        <FormControl sx={{ minWidth: 140 }}>
                            <FormLabel sx={{
                                fontSize: '0.875rem',
                                height: '40px', // กำหนดความสูงให้เท่ากัน
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                👤 พนักงาน
                            </FormLabel>
                            <Select
                                size="sm"
                                placeholder="ทั้งหมด"
                                value={filterEmp}
                                onChange={(e, value) => setFilterEmp(value || "")}
                                disabled={!filterDept}
                                sx={{ backgroundColor: 'background.body' }}
                            >
                                <Option value="">ทั้งหมด</Option>
                                {empOptions
                                    .filter((emp) => !filterDept || emp.department === filterDept)
                                    .map((emp) => (
                                        <Option key={emp.value} value={emp.value}>{emp.label}</Option>
                                    ))}
                            </Select>
                        </FormControl>

                        {/* Platform */}
                        <FormControl sx={{ minWidth: 140 }}>
                            <FormLabel sx={{
                                fontSize: '0.875rem',
                                height: '40px', // กำหนดความสูงให้เท่ากัน
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                📱 แพลตฟอร์ม
                            </FormLabel>
                            <Select
                                size="sm"
                                placeholder="ทั้งหมด"
                                value={filterPlatform}
                                onChange={(e, value) => setFilterPlatform(value || "")}
                                loading={isLoading}
                                sx={{ backgroundColor: 'background.body' }}
                            >
                                <Option value="">ทั้งหมด</Option>
                                {platformOptions.map((platform) => (
                                    <Option key={platform.value} value={platform.value}>{platform.label}</Option>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Action Buttons */}
                        <Box sx={{
                            display: 'flex',
                            gap: 1,
                            flexShrink: 0,
                            '@media (max-width: 900px)': {
                                width: '100%',
                                justifyContent: 'stretch'
                            }
                        }}>
                            <Button
                                size="sm"
                                variant="solid"
                                color="primary"
                                onClick={() => window.location.reload()}
                                startDecorator="🔄"
                                sx={{ '@media (max-width: 900px)': { flex: 1 } }}
                            >
                                รีเฟรช
                            </Button>
                            <Button
                                size="sm"
                                variant="outlined"
                                color="neutral"
                                onClick={clearFilters}
                                disabled={getActiveFiltersCount() === 0}
                                startDecorator="🗑️"
                                sx={{ '@media (max-width: 900px)': { flex: 1 } }}
                            >
                                ล้าง
                            </Button>
                        </Box>

                        <Box sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
                            <Button
                                size="sm"
                                onClick={() => setShowModal(true)}
                                variant="outlined"
                                color="primary"
                                startDecorator="📅"
                                sx={{ '@media (max-width: 900px)': { flex: 1 } }}
                            >
                                ในเวลา
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => setShowAfterHourModal(true)}
                                variant="outlined"
                                color="warning"
                                startDecorator="🌙"
                                sx={{ '@media (max-width: 900px)': { flex: 1 } }}
                            >
                                นอกเวลา
                            </Button>
                        </Box>
                        {/* Date Range */}
                        <FormControl sx={{ minWidth: 200 }}>
                            <FormLabel sx={{
                                fontSize: '0.875rem',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                📅 ช่วงวันที่ & Export รายการเคส
                            </FormLabel>
                            <Box sx={{ display: "flex", flexDirection: "row", gap: 1, flexWrap: "wrap" }}>
                                <Input
                                    type="date"
                                    size="sm"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    placeholder="เริ่มวันที่"
                                    sx={{ minWidth: 120 }}
                                />
                                <Typography level="body-sm">—</Typography>
                                <Input
                                    type="date"
                                    size="sm"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    placeholder="สิ้นสุดวันที่"
                                    sx={{ minWidth: 120 }}
                                />
                                <Button
                                    size="sm"
                                    color="primary"
                                    variant="solid"
                                    onClick={onExportDetailed}
                                    startDecorator="📥"
                                    disabled={exporting || !startDate || !endDate || dayjs(endDate).isBefore(dayjs(startDate))}
                                    sx={{ minWidth: 80 }}
                                >
                                    {exporting ? "กำลังสร้าง..." : "Export"}
                                </Button>
                            </Box>
                        </FormControl>
                    </Box>
                </Box>

                {/* Active Filters */}
                {getActiveFiltersCount() > 0 && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography level="body-sm" color="neutral" sx={{ mb: 1 }}>
                            ตัวกรองที่เลือก:
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            {filterDept && (
                                <Chip variant="soft" color="primary" endDecorator={
                                    <ChipDelete aria-label="ลบตัวกรองแผนก" onClick={() => { setFilterDept(""); setFilterEmp(""); }} onDelete={() => { setFilterDept(""); setFilterEmp(""); }} />
                                }>
                                    🏢 {deptOptions.find(d => d.value === filterDept)?.label || filterDept}
                                </Chip>
                            )}

                            {filterEmp && (
                                <Chip variant="soft" color="primary" endDecorator={
                                    <ChipDelete aria-label="ลบตัวกรองพนักงาน" onClick={() => setFilterEmp("")} onDelete={() => setFilterEmp("")} />
                                }>
                                    👤 {empOptions.find(e => e.value === filterEmp)?.label || filterEmp}
                                </Chip>
                            )}

                            {filterPlatform && (
                                <Chip variant="soft" color="primary" endDecorator={
                                    <ChipDelete aria-label="ลบตัวกรองแพลตฟอร์ม" onClick={() => setFilterPlatform("")} onDelete={() => setFilterPlatform("")} />
                                }>
                                    📱 {platformOptions.find(p => p.value === filterPlatform)?.label || filterPlatform}
                                </Chip>
                            )}
                        </Stack>
                    </Box>
                )}
            </Sheet>

            {/* Quick Stats Summary */}
            {todayWithPending && (
                <Box sx={{
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    gap: 2, p: 2, mb: 3, backgroundColor: 'background.level1',
                    borderRadius: 'lg', border: '1px solid', borderColor: 'divider',
                    flexWrap: 'wrap'
                }}>
                    <Typography level="body-sm" color="neutral" fontWeight="lg">📊 สรุปวันนี้:</Typography>
                    <Chip variant="soft" color="success" size="md">ปิดแล้ว {todayWithPending.total || 0} เคส</Chip>
                    <Chip variant="soft" color="warning" size="md">กำลังดำเนินการ {progressInOut.in_time || 0} เคส</Chip>
                    <Chip variant="soft" color="neutral" size="md">รอรับ {pendingTotal || 0} เคส</Chip>
                </Box>
            )}

            {!todayWithPending || !afterHourStats ? (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", my: 4 }}>
                    <CircularProgress size="lg" />
                    <Typography level="body-sm" color="neutral" sx={{ mt: 2 }}>
                        กำลังโหลดข้อมูล...
                    </Typography>
                </Box>
            ) : (
                <>
                    {getActiveFiltersCount() > 0 && (
                        <Alert color="info" variant="soft" sx={{ mb: 3, borderRadius: 'lg' }} startDecorator="ℹ️">
                            ข้อมูลที่แสดงถูกกรองตามเงื่อนไขที่เลือก - คลิกปุ่ม "ล้าง" เพื่อดูข้อมูลทั้งหมด
                        </Alert>
                    )}
                    {renderStatCards(
                        { ...todayWithPending, in_progress: progressInOut.in_time },
                        caseCategories,
                        { ...afterHourStats, in_progress: progressInOut.out_time }
                    )}
                </>
            )}

            {/* Modals */}
            <Modal open={showModal} onClose={() => setShowModal(false)}>
                <ModalDialog sx={{ width: "90vw", maxHeight: "90vh", p: 2 }}>
                    <ModalClose />
                    <Typography level="h5" mb={2}>📆 เลือกช่วงวันที่ (ในเวลาทำการ)</Typography>
                    <Grid container spacing={2}>
                        <Grid xs={6}><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Grid>
                        <Grid xs={6}><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Grid>
                        <Grid xs={12} sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            <Button onClick={fetchRangeStats}>🔍 ค้นหา</Button>
                            {/* <Button color="success" variant="soft" onClick={onExportBusiness}>📤 Export สรุปรายวัน</Button> */}
                            <Button color="primary" variant="solid" onClick={onExportDetailedIntime}
                                disabled={exporting || !startDate || !endDate || dayjs(endDate).isBefore(dayjs(startDate))} sx={{ minWidth: 80 }}>{exporting ? "กำลังสร้าง..." : "Export"}</Button>
                        </Grid>
                    </Grid>
                    {renderRangeTable(rangeStats)}
                </ModalDialog>
            </Modal>

            <Modal open={showAfterHourModal} onClose={() => setShowAfterHourModal(false)}>
                <ModalDialog sx={{ width: "90vw", maxHeight: "90vh", p: 2 }}>
                    <ModalClose />
                    <Typography level="h5" mb={2}>🌙 เลือกช่วงวันที่ (นอกเวลาทำการ)</Typography>
                    <Grid container spacing={2}>
                        <Grid xs={6}><Input type="date" value={afterHourStartDate} onChange={(e) => setAfterHourStartDate(e.target.value)} /></Grid>
                        <Grid xs={6}><Input type="date" value={afterHourEndDate} onChange={(e) => setAfterHourEndDate(e.target.value)} /></Grid>
                        <Grid xs={12} sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            <Button onClick={fetchAfterHourRangeStats}>🔍 ค้นหา</Button>
                            {/* <Button color="success" variant="soft" onClick={onExportAfterHour}>📤 Export สรุปนอกเวลา</Button> */}
                        </Grid>
                    </Grid>
                    {renderRangeTable(afterHourRangeStats)}
                </ModalDialog>
            </Modal>

            <Modal open={exporting}>
                <ModalDialog sx={{ p: 3, width: 360, textAlign: "center" }}>
                    <CircularProgress size="lg" />
                    <Typography level="title-md" sx={{ mt: 2 }}>
                        กำลังสร้างไฟล์ Excel...
                    </Typography>
                    <Typography level="body-sm" color="neutral" sx={{ mt: 1 }}>
                        โปรดรอสักครู่ ขนาดข้อมูลมีผลต่อระยะเวลา
                    </Typography>
                </ModalDialog>
            </Modal>

            <EmployeeWorkloadTable rows={employeeStats} />
            <TagWorkloadTable rows={tagStats} />

            <EmployeeCaseDetailModal open={openEmpModal} onClose={() => setOpenEmpModal(false)} user={selectedUser} rows={empCaseRows} />
            <TagCaseDetailModal open={openTagModal} onClose={() => setOpenTagModal(false)} tag={selectedTag} rows={tagCaseRows} />
        </Box>
    );
}