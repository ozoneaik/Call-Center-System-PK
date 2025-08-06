import {
    Add
} from "@mui/icons-material";
import {
    Box,
    Button,
    Stack,
    Typography
} from "@mui/joy";
import { Grid2, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
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
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [openModal, setOpenModal] = useState(false);
    const [filterDept, setFilterDept] = useState('');
    const [searchName, setSearchName] = useState('');
    const [employees, setEmployees] = useState([]);

    const [openClosedToday, setOpenClosedToday] = useState(false);
    const [closedTodayLoading, setClosedTodayLoading] = useState(false);
    const [closedTodayData, setClosedTodayData] = useState([]);
    const [closedTodayDate, setClosedTodayDate] = useState("");
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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [
                userCaseRes,
                activeUserRes
            ] = await Promise.all([
                axiosClient.get('home/user-case'),
                axiosClient.get('home/user-case/active-users')
            ]);

            const data = userCaseRes.data;
            const activeList = activeUserRes.data?.active_users_today || [];

            const activeSet = new Set(activeList.map(u => u.empCode));

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
                                [field]: value
                            });
                        }
                    });
                };

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
            alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        }
    };

    const filteredEmployees = employees.filter(emp => {
        const matchesDept = !filterDept || emp.department === filterDept;
        const matchesName = !searchName || emp.name.toLowerCase().includes(searchName.toLowerCase());
        return matchesDept && matchesName;
    });

    const departments = Array.from(
        new Set(employees.map(emp => emp.department).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, 'th'));

    const handleOpenClosedToday = async (emp) => {
        try {
            setClosedTodayUser(emp);
            setOpenClosedToday(true);
            setClosedTodayLoading(true);
            const { data } = await axiosClient.get(`home/user-case/users/${emp.empCode}/closed-today`);
            setClosedTodayData(data?.cases || []);
            setClosedTodayDate(data?.date || "");
        } catch (e) {
            alert("โหลดข้อมูลปิดเคสวันนี้ไม่สำเร็จ");
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
                `home/user-case/users/${emp.empCode}/closed-week`
            );
            setClosedWeekData(data?.cases || []);
            setClosedWeekRange(data?.range || { start: "", end: "" });
        } catch (e) {
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
            const { data } = await axiosClient.get(`home/user-case/users/${emp.empCode}/closed-month`);
            setClosedMonthData(data?.cases || []);
            setClosedMonthRange(data?.range || { start: "", end: "" });
        } catch (e) {
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
            const { data } = await axiosClient.get(`home/user-case/users/${emp.empCode}/in-progress`);
            setInProgressRows(data?.cases || []);
        } catch (e) {
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
            const { data } = await axiosClient.get(`home/user-case/users/${emp.empCode}/forwarded-today`);
            setForwardedData(data?.cases || []);
        } catch (error) {
            alert("โหลดข้อมูลการส่งต่อเคสไม่สำเร็จ");
        } finally {
            setForwardedLoading(false);
        }
    };

    return (
        <div>
            <Stack direction="row" justifyContent="space-between" mb={2}>
                <Typography level="h4">พนักงานที่ทำงาน</Typography>
            </Stack>

            <Box mb={2}>
                <Stack
                    direction={isMobile ? "column" : "row"}
                    spacing={2}
                    alignItems={isMobile ? "stretch" : "center"}
                    justifyContent="space-between"
                    flexWrap="wrap"
                >
                    <Stack
                        direction={isMobile ? "column" : "row"}
                        spacing={2}
                        flexWrap="wrap"
                        sx={{ flexGrow: 0 }}
                    >
                        <LegendToggle />
                        <FilterControls
                            filterDept={filterDept}
                            setFilterDept={setFilterDept}
                            searchName={searchName}
                            setSearchName={setSearchName}
                            departments={departments}
                            fullWidth={isMobile}
                        />
                    </Stack>
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
                </Stack>
            </Box>

            {isMobile ? (
                <>
                    <LegendToggle />
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
                </>
            ) : (
                <>
                    {/* <LegendToggle /> */}
                    <EmployeeTable employees={filteredEmployees.slice(0, 4)}
                        onClickTodayClosed={handleOpenClosedToday}
                        onClickWeekClosed={handleOpenClosedWeek}
                        onClickMonthClosed={handleOpenClosedMonth}
                        onClickInProgress={handleOpenInProgress}
                        onClickForwarded={handleOpenForwardedModal}
                    />
                </>
            )}

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
            />

            <ClosedTodayModal
                open={openClosedToday}
                onClose={() => setOpenClosedToday(false)}
                loading={closedTodayLoading}
                date={closedTodayDate}
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
            />
        </div>
    );
}
