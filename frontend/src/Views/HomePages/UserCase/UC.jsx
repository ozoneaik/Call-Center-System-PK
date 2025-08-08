import { Add } from "@mui/icons-material";
import { Box, Button, Stack, Typography, Sheet, Divider } from "@mui/joy";
import { Grid2, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import axiosClient from "../../../Axios";

import EmployeeCards from "./EmployeeCards";
import EmployeeModal from "./EmployeeModal";
import EmployeeTable from "./EmployeeTable";
import FilterControls from "./Fillter/FilterControls";
import LegendToggle from "./LegendToggle";
import ClosedTodayModal from "./Dashboard/ClosedModals/ClosedTodayModal";
import ClosedWeekModal from "./Dashboard/ClosedModals/ClosedWeekModal";
import ClosedMonthModal from "./Dashboard/ClosedModals/ClosedMonthModal";
import InProgressModal from "./Dashboard/ClosedModals/InProgressModal";
import ForwardedModal from "./Dashboard/ClosedModals/ForwardedModal";

export default function UC() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [openModal, setOpenModal] = useState(false);
    const [filterDept, setFilterDept] = useState("");
    const [searchName, setSearchName] = useState("");
    const [employees, setEmployees] = useState([]);

    // วันที่
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // แท็ก
    const [selectedTags, setSelectedTags] = useState([]);
    const [tagOptions, setTagOptions] = useState([]);

    // โมดอลต่าง ๆ
    const [openClosedToday, setOpenClosedToday] = useState(false);
    const [closedTodayLoading, setClosedTodayLoading] = useState(false);
    const [closedTodayData, setClosedTodayData] = useState([]);
    const [closedTodayDate, setClosedTodayDate] = useState("");
    const [closedTodayRange, setClosedTodayRange] = useState({ start: "", end: "" });
    const [closedTodayUser, setClosedTodayUser] = useState(null);

    const [openClosedWeek, setOpenClosedWeek] = useState(false);
    const [closedWeekLoading, setClosedWeekLoading] = useState(false);
    const [closedWeekData, setClosedWeekData] = useState([]);
    const [closedWeekRange, setClosedWeekRange] = useState({ start: "", end: "" });
    const [closedWeekUser, setClosedWeekUser] = useState(null);

    const [openClosedMonth, setOpenClosedMonth] = useState(false);
    const [closedMonthLoading, setClosedMonthLoading] = useState(false);
    const [closedMonthData, setClosedMonthData] = useState([]);
    const [closedMonthRange, setClosedMonthRange] = useState({ start: "", end: "" });
    const [closedMonthUser, setClosedMonthUser] = useState(null);

    const [openInProgress, setOpenInProgress] = useState(false);
    const [inProgressLoading, setInProgressLoading] = useState(false);
    const [inProgressRows, setInProgressRows] = useState([]);
    const [inProgressUser, setInProgressUser] = useState(null);

    const [openForwardedModal, setOpenForwardedModal] = useState(false);
    const [forwardedUser, setForwardedUser] = useState(null);
    const [forwardedData, setForwardedData] = useState([]);
    const [forwardedLoading, setForwardedLoading] = useState(false);
    const [forwardedRange, setForwardedRange] = useState({ start: "", end: "" });

    useEffect(() => {
        // โหลดแท็กครั้งแรก
        axiosClient
            .get("home/user-case/tags")
            .then(({ data }) => setTagOptions(data?.tags || []))
            .catch(() => setTagOptions([]));

        // โหลดข้อมูลครั้งแรก
        fetchData({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const buildRangeParams = () => {
        const params = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate || startDate;
        if (selectedTags?.length) params.tag_ids = selectedTags; // array
        return params;
    };

    const fetchData = async (paramsOverride) => {
        try {
            const params = paramsOverride ?? buildRangeParams();
            const [userCaseRes, activeUserRes] = await Promise.all([
                axiosClient.get("home/user-case", { params }),
                axiosClient.get("home/user-case/active-users"),
            ]);

            const data = userCaseRes.data;
            const activeList = activeUserRes.data?.active_users_today || [];
            const activeSet = new Set(activeList.map((u) => u.empCode));

            if (data?.success && data?.progress && data?.weekSuccess && data?.monthSuccess) {
                const mergedMap = new Map();

                const mergeSet = (dataset, key, field) => {
                    dataset.forEach((item) => {
                        const existing = mergedMap.get(item.empCode);
                        const value = item[key] || 0;
                        if (existing) {
                            existing[field] = value;
                        } else {
                            mergedMap.set(item.empCode, {
                                empCode: item.empCode,
                                name: item.user_name,
                                department: item.department || "ไม่ระบุแผนก",
                                todayClosed: 0,
                                inProgress: 0,
                                weekClosed: 0,
                                monthClosed: 0,
                                forwarded: 0,
                                isActiveToday: activeSet.has(item.empCode),
                                [field]: value,
                            });
                        }
                    });
                };

                // รวมชุดข้อมูล
                mergeSet(data.success, "count", "todayClosed");
                mergeSet(data.progress, "countprogress", "inProgress");
                mergeSet(data.weekSuccess, "countweek", "weekClosed");
                mergeSet(data.monthSuccess, "countmonth", "monthClosed");
                mergeSet(data.forwarded, "countforwarded", "forwarded");

                const mergedArray = Array.from(mergedMap.values()).map((item, index) => ({
                    id: index + 1,
                    ...item,
                }));

                const sorted = mergedArray.sort((a, b) => b.todayClosed - a.todayClosed);
                setEmployees(sorted);
            }
        } catch (error) {
            console.error(error);
            alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        }
    };

    const handleApplyRange = () => {
        if (startDate && endDate && dayjs(endDate).isBefore(dayjs(startDate))) {
            alert("วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น");
            return;
        }
        fetchData();
    };

    const handleClearRange = () => {
        setStartDate("");
        setEndDate("");
        setSelectedTags([]);
        fetchData({});
    };

    const handleChangeTags = (vals) => {
        setSelectedTags(vals);
        const params = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate || startDate;
        if (vals.length) params.tag_ids = vals;
        fetchData(params);
    };

    const filteredEmployees = employees.filter((emp) => {
        const matchesDept = !filterDept || emp.department === filterDept;
        const matchesName =
            !searchName || emp.name.toLowerCase().includes(searchName.toLowerCase());
        return matchesDept && matchesName;
    });

    const departments = Array.from(
        new Set(employees.map((emp) => emp.department).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "th"));

    // เปิดโมดอลต่าง ๆ
    const handleOpenClosedToday = async (emp) => {
        try {
            setClosedTodayUser(emp);
            setOpenClosedToday(true);
            setClosedTodayLoading(true);

            const hasRange = !!(startDate || endDate);
            const url = hasRange
                ? `home/user-case/users/${emp.empCode}/closed-range`
                : `home/user-case/users/${emp.empCode}/closed-today`;

            const { data } = await axiosClient.get(url, { params: buildRangeParams() });

            setClosedTodayData(data?.cases || []);
            if (hasRange) {
                setClosedTodayRange({
                    start: data?.range?.start || startDate || "",
                    end: data?.range?.end || endDate || startDate || "",
                });
                setClosedTodayDate("");
            } else {
                setClosedTodayDate(data?.date || "");
                setClosedTodayRange({ start: "", end: "" });
            }
        } catch {
            alert("โหลดข้อมูลปิดเคสไม่สำเร็จ");
        } finally {
            setClosedTodayLoading(false);
        }
    };

    const handleOpenClosedWeek = async (emp) => {
        try {
            setClosedWeekUser(emp);
            setOpenClosedWeek(true);
            setClosedWeekLoading(true);

            const { data } = await axiosClient.get(
                `home/user-case/users/${emp.empCode}/closed-week`,
                { params: buildRangeParams() }
            );

            setClosedWeekData(data?.cases || []);
            setClosedWeekRange(data?.range || { start: "", end: "" });
        } catch {
            alert("โหลดข้อมูลปิดเคสสัปดาห์นี้ไม่สำเร็จ");
        } finally {
            setClosedWeekLoading(false);
        }
    };

    const handleOpenClosedMonth = async (emp) => {
        try {
            setClosedMonthUser(emp);
            setOpenClosedMonth(true);
            setClosedMonthLoading(true);

            const { data } = await axiosClient.get(
                `home/user-case/users/${emp.empCode}/closed-month`,
                { params: buildRangeParams() }
            );

            setClosedMonthData(data?.cases || []);
            setClosedMonthRange(data?.range || { start: "", end: "" });
        } catch {
            alert("โหลดข้อมูลปิดเคสเดือนนี้ไม่สำเร็จ");
        } finally {
            setClosedMonthLoading(false);
        }
    };

    const handleOpenInProgress = async (emp) => {
        try {
            setInProgressUser(emp);
            setOpenInProgress(true);
            setInProgressLoading(true);

            const { data } = await axiosClient.get(
                `home/user-case/users/${emp.empCode}/in-progress`
            );

            setInProgressRows(data?.cases || []);
        } catch {
            alert("โหลดข้อมูลกำลังดำเนินการไม่สำเร็จ");
        } finally {
            setInProgressLoading(false);
        }
    };

    const handleOpenForwardedModal = async (emp) => {
        try {
            setForwardedUser(emp);
            setOpenForwardedModal(true);
            setForwardedLoading(true);

            const hasRange = !!(startDate || endDate);
            const url = hasRange
                ? `home/user-case/users/${emp.empCode}/forwarded-range`
                : `home/user-case/users/${emp.empCode}/forwarded-today`;

            const params = hasRange
                ? { start_date: startDate, end_date: endDate || startDate }
                : undefined;

            const { data } = await axiosClient.get(url, { params });

            setForwardedData(data?.cases || []);
            setForwardedRange(
                hasRange
                    ? {
                        start: data?.range?.start || startDate || "",
                        end: data?.range?.end || endDate || startDate || "",
                    }
                    : { start: "", end: "" }
            );
        } catch {
            alert("โหลดข้อมูลการส่งต่อเคสไม่สำเร็จ");
        } finally {
            setForwardedLoading(false);
        }
    };

    return (
        <div>
            {/* ส่วนหัวใหม่ (ปุ่มอยู่เฉพาะคอลัมน์ขวา) */}
            <Sheet
                variant="outlined"
                sx={{
                    // position: "sticky",
                    // top: 0,
                    zIndex: 10,
                    borderRadius: "lg",
                    p: 1.5,
                    mb: 2,
                    backdropFilter: "saturate(180%) blur(6px)",
                    backgroundColor: "background.surface",
                }}
            >
                {/* แถวหัวเรื่อง */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography level="h4">พนักงานที่ทำงาน</Typography>
                    {!isMobile && <Divider sx={{ mx: 2, flex: 1 }} />}
                </Stack>

                {/* 3 โซน: Legend · Filter · ปุ่มรายชื่อทั้งหมด */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "auto 1fr auto",
                        gap: 12,
                        alignItems: "start",
                    }}
                >
                    {/* ซ้าย: Legend */}
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <LegendToggle />
                    </Box>

                    {/* กลาง: ฟิลเตอร์ */}
                    <Box sx={{ minWidth: 280 }}>
                        <FilterControls
                            filterDept={filterDept}
                            setFilterDept={setFilterDept}
                            searchName={searchName}
                            setSearchName={setSearchName}
                            departments={departments}
                            fullWidth={isMobile}
                            startDate={startDate}
                            endDate={endDate}
                            setStartDate={setStartDate}
                            setEndDate={setEndDate}
                            onApplyRange={handleApplyRange}
                            onClearRange={handleClearRange}
                            selectedTags={selectedTags}
                            onChangeTags={handleChangeTags}
                            tagOptions={tagOptions}
                        />
                    </Box>

                    {/* ขวา: ปุ่มรายชื่อทั้งหมด (ปุ่มเดียวที่ใช้) */}
                    <Box sx={{ display: "flex", justifyContent: isMobile ? "flex-start" : "flex-end" }}>
                        <Button
                            size="sm"
                            variant="plain"
                            startDecorator={<Add />}
                            onClick={() => setOpenModal(true)}
                            fullWidth={isMobile}
                        >
                            แสดงรายชื่อพนักงานทั้งหมด
                        </Button>
                    </Box>
                </Box>
            </Sheet>

            {/* เนื้อหา */}
            {isMobile ? (
                <Grid2 spacing={2} container sx={{ maxHeight: 490 }} overflow="auto">
                    <EmployeeCards
                        employees={filteredEmployees.slice(0, 4)}
                        onClickTodayClosed={handleOpenClosedToday}
                        onClickWeekClosed={handleOpenClosedWeek}
                        onClickMonthClosed={handleOpenClosedMonth}
                        onClickInProgress={handleOpenInProgress}
                        onClickForwarded={handleOpenForwardedModal}
                    />
                </Grid2>
            ) : (
                <EmployeeTable
                    employees={filteredEmployees.slice(0, 4)}
                    onClickTodayClosed={handleOpenClosedToday}
                    onClickWeekClosed={handleOpenClosedWeek}
                    onClickMonthClosed={handleOpenClosedMonth}
                    onClickInProgress={handleOpenInProgress}
                    onClickForwarded={handleOpenForwardedModal}
                />
            )}

            {/* โมดอลทั้งหมด */}
            <EmployeeModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                isMobile={isMobile}
                filteredEmployees={filteredEmployees}
                filterDept={filterDept}
                setFilterDept={setFilterDept}
                searchName={searchName}
                setSearchName={setSearchName}
                departments={departments}
                onClickTodayClosed={handleOpenClosedToday}
                onClickWeekClosed={handleOpenClosedWeek}
                onClickMonthClosed={handleOpenClosedMonth}
                onClickInProgress={handleOpenInProgress}
                onClickForwarded={handleOpenForwardedModal}
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                onApplyRange={handleApplyRange}
                onClearRange={handleClearRange}
                selectedTags={selectedTags}
                onChangeTags={handleChangeTags}
                tagOptions={tagOptions}
            />

            <ClosedTodayModal
                open={openClosedToday}
                onClose={() => setOpenClosedToday(false)}
                loading={closedTodayLoading}
                date={closedTodayDate}
                range={closedTodayRange}
                user={closedTodayUser}
                data={closedTodayData}
            />

            <ClosedWeekModal
                open={openClosedWeek}
                onClose={() => setOpenClosedWeek(false)}
                loading={closedWeekLoading}
                data={closedWeekData}
                range={closedWeekRange}
                user={closedWeekUser}
            />

            <ClosedMonthModal
                open={openClosedMonth}
                onClose={() => setOpenClosedMonth(false)}
                loading={closedMonthLoading}
                data={closedMonthData}
                range={closedMonthRange}
                user={closedMonthUser}
            />

            <InProgressModal
                open={openInProgress}
                onClose={() => setOpenInProgress(false)}
                loading={inProgressLoading}
                user={inProgressUser}
                rows={inProgressRows}
            />

            <ForwardedModal
                open={openForwardedModal}
                onClose={() => setOpenForwardedModal(false)}
                user={forwardedUser}
                loading={forwardedLoading}
                data={forwardedData}
                range={forwardedRange}
            />
        </div>
    );
}
