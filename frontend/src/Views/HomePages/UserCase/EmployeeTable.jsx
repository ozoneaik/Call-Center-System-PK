import { Avatar, Box, Chip, Sheet, Stack, Table, Typography } from "@mui/joy";
import { useAuth } from "../../../context/AuthContext";

export default function EmployeeTable({
    employees,
    onClickTodayClosed,
    onClickWeekClosed,
    onClickMonthClosed,
    onClickInProgress,
    onClickForwarded,
    onOpenAllEmployees,
}) {
    const { user } = useAuth();

    const isAdmin = (u) =>
        ["admin", "superadmin"].includes(String(u?.role || "").toLowerCase());

    const visibleEmployees = isAdmin(user)
        ? employees
        : employees.filter((e) => String(e.empCode) === String(user?.empCode));

    if (!user || visibleEmployees.length === 0) return <></>;

    return (
        
        <Sheet variant="outlined" sx={{ borderRadius: "sm", overflow: "auto", maxHeight: 490 }}>
            <Table stickyHeader hoverRow>
                <thead>
                    <tr>
                        <th style={{ width: "40px", textAlign: "center" }}>#</th>
                        <th style={{ width: "200px", padding: "12px" }}>พนักงาน</th>
                        <th style={{ textAlign: "center" }}>ปิดเคสวันนี้</th>
                        {/* <th style={{ textAlign: "center" }}>กำลังดำเนินการ</th> */}
                        <th style={{ textAlign: "center" }}>ปิดเคสสัปดาห์นี้</th>
                        <th style={{ textAlign: "center" }}>ปิดเคสเดือนนี้</th>
                        <th style={{ textAlign: "center" }}>ส่งต่อเคส</th>
                        <th style={{ width: "100px", textAlign: "center" }}>สถานะ</th>
                    </tr>
                </thead>
                <tbody>
                    {visibleEmployees.map((employee, index) => {
                        const clickableToday = employee.todayClosed > 0 && typeof onClickTodayClosed === "function";
                        const clickableWeek = employee.weekClosed > 0 && typeof onClickWeekClosed === "function";
                        const clickableMonth = employee.monthClosed > 0 && typeof onClickMonthClosed === "function";
                        const clickableInProgress = employee.inProgress > 0 && typeof onClickInProgress === "function";
                        const clickableForwarded = employee.forwarded > 0 && typeof onClickForwarded === "function";

                        return (
                            <tr key={employee.id}>
                                <td style={{ textAlign: "center" }}>{index + 1}</td>
                                <td style={{ padding: "12px" }}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Avatar variant="solid" color="primary" sx={{ width: 40, height: 40 }} />
                                        <Stack spacing={0.5}>
                                            <Typography fontWeight="bold" fontSize={14}>{employee.name}</Typography>
                                            <Chip size="sm" variant="soft">{employee.department}</Chip>
                                        </Stack>
                                    </Box>
                                </td>

                                {/* วันนี้ */}
                                <td style={{
                                    textAlign: "center",
                                    color: employee.todayClosed === 0 ? "#D32F2F" : "green",
                                    fontWeight: employee.todayClosed === 0 ? "bold" : "normal",
                                }}>
                                    <Typography
                                        component="span"
                                        sx={{
                                            cursor: clickableToday ? "pointer" : "default",
                                            textDecoration: clickableToday ? "underline" : "none",
                                            "&:hover": clickableToday ? { opacity: 0.8 } : {},
                                        }}
                                        aria-label="ดูรายละเอียดปิดเคสวันนี้"
                                        onClick={() => clickableToday && onClickTodayClosed(employee)}
                                    >
                                        {employee.todayClosed}
                                    </Typography>
                                </td>

                                {/* สัปดาห์นี้ */}
                                <td style={{
                                    textAlign: "center",
                                    color: employee.weekClosed === 0 ? "#D32F2F" : "green",
                                    fontWeight: employee.weekClosed === 0 ? "bold" : "normal",
                                }}>
                                    <Typography
                                        component="span"
                                        sx={{
                                            cursor: clickableWeek ? "pointer" : "default",
                                            textDecoration: clickableWeek ? "underline" : "none",
                                            "&:hover": clickableWeek ? { opacity: 0.8 } : {},
                                        }}
                                        aria-label="ดูรายละเอียดปิดเคสสัปดาห์นี้"
                                        onClick={() => clickableWeek && onClickWeekClosed(employee)}
                                    >
                                        {employee.weekClosed}
                                    </Typography>
                                </td>

                                {/* เดือนนี้ */}
                                <td style={{
                                    textAlign: "center",
                                    color: employee.monthClosed === 0 ? "#D32F2F" : "green",
                                    fontWeight: employee.monthClosed === 0 ? "bold" : "normal",
                                }}>
                                    <Typography
                                        component="span"
                                        sx={{
                                            cursor: clickableMonth ? "pointer" : "default",
                                            textDecoration: clickableMonth ? "underline" : "none",
                                            "&:hover": clickableMonth ? { opacity: 0.8 } : {},
                                        }}
                                        aria-label="ดูรายละเอียดปิดเคสเดือนนี้"
                                        onClick={() => clickableMonth && onClickMonthClosed(employee)}
                                    >
                                        {employee.monthClosed}
                                    </Typography>
                                </td>

                                {/* ส่งต่อเคส */}
                                <td style={{
                                    textAlign: "center",
                                    color: employee.forwarded === 0 ? "#D32F2F" : "green",
                                    fontWeight: employee.forwarded === 0 ? "bold" : "normal",
                                }}>
                                    <Typography
                                        component="span"
                                        sx={{
                                            cursor: clickableForwarded ? "pointer" : "default",
                                            textDecoration: clickableForwarded ? "underline" : "none",
                                            "&:hover": clickableForwarded ? { opacity: 0.8 } : {},
                                        }}
                                        onClick={() => clickableForwarded && onClickForwarded(employee)}
                                    >
                                        {employee.forwarded}
                                    </Typography>
                                </td>

                                {/* สถานะ */}
                                <td style={{ textAlign: "center", padding: "12px" }}>
                                    <Chip
                                        size="sm"
                                        variant="soft"
                                        color={employee.isActiveToday ? "success" : "neutral"}
                                        sx={{
                                            fontWeight: "bold",
                                            backgroundColor: employee.isActiveToday ? "#E8F5E8" : "#F5F5F5",
                                            color: employee.isActiveToday ? "#2E7D32" : "#666666",
                                        }}
                                    >
                                        {employee.isActiveToday ? "Active" : "Inactive"}
                                    </Chip>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
        </Sheet>
    );
}
