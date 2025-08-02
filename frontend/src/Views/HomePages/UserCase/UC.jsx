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

export default function UC() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [openModal, setOpenModal] = useState(false);
    const [filterDept, setFilterDept] = useState('');
    const [searchName, setSearchName] = useState('');
    const [employees, setEmployees] = useState([]);

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

            // แปลงเป็น Set เพื่อ lookup ง่าย
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
                                isActiveToday: activeSet.has(item.empCode), // ✅ เพิ่มตรงนี้
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

    return (
        <div>
            <Stack direction="row" justifyContent="space-between" mb={2}>
                <Typography level="h2">พนักงานที่ทำงาน</Typography>
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
                        <EmployeeCards employees={filteredEmployees.slice(0, 4)} />
                    </Grid2>
                </>
            ) : (
                <>
                    {/* <LegendToggle /> */}
                    <EmployeeTable employees={filteredEmployees.slice(0, 4)} />
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
            />
        </div>
    );
}
