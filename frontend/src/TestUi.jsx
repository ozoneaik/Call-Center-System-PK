import React, { useState } from "react";
import {
    Sheet,
    Typography,
    IconButton,
    Box,
    Card,
    CardContent,
    Stack,
    Select,
    Option,
    Input,
    Button
} from "@mui/joy";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";

export default function TestUi() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [holidays, setHolidays] = useState([]); // [{date:'2025-09-25', name:'...'}]

    const formatDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };
    const addDays = (date, days) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    };
    const isSameDay = (d1, d2) => formatDate(d1) === formatDate(d2);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = addDays(firstDay, -firstDay.getDay());
    const calendarDays = Array.from({ length: 42 }, (_, i) =>
        addDays(startDate, i)
    );

    // ✅ toggle holiday
    const toggleHoliday = (date) => {
        const dateStr = formatDate(date);
        const exists = holidays.find((h) => h.date === dateStr);

        if (exists) {
            setHolidays((prev) => prev.filter((h) => h.date !== dateStr));
        } else {
            setHolidays((prev) => [...prev, { date: dateStr, name: "" }]);
        }
    };

    const updateHolidayName = (dateStr, newName) => {
        setHolidays((prev) =>
            prev.map((h) => (h.date === dateStr ? { ...h, name: newName } : h))
        );
    };

    const removeHoliday = (dateStr) => {
        setHolidays((prev) => prev.filter((h) => h.date !== dateStr));
    };

    const navigateMonth = (dir) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + dir);
        setCurrentDate(newDate);
    };

    const isCurrentMonth = (d) => d.getMonth() === month;
    const isToday = (d) => isSameDay(d, new Date());
    const isHoliday = (d) => holidays.some((h) => h.date === formatDate(d));

    const monthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    const dayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
    const yearOptions = Array.from({ length: 21 }, (_, i) => year - 10 + i);

    return (
        <Card
            variant="outlined"
            sx={{
                maxWidth: 800,
                mx: "auto",
                my: 3,
                boxShadow: "lg",
                borderRadius: "xl",
                overflow: "hidden",
            }}
        >
            <CardContent sx={{ p: 0 }}>
                {/* Header */}
                <Sheet
                    variant="solid"
                    sx={{
                        p: 3,
                        background: "linear-gradient(45deg, #ec750d, #f59f00)",
                        boxShadow: "md",
                    }}
                >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <IconButton variant="soft" color="neutral" onClick={() => navigateMonth(-1)}>
                            <ChevronLeft size={20} />
                        </IconButton>

                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Calendar size={24} color="white" />
                            <Select
                                value={month}
                                onChange={(_, val) => setCurrentDate(new Date(year, Number(val), 1))}
                                size="sm"
                                sx={{ minWidth: 120, bgcolor: "white", borderRadius: "lg" }}
                            >
                                {monthNames.map((m, i) => (
                                    <Option key={i} value={i}>
                                        {m}
                                    </Option>
                                ))}
                            </Select>
                            <Select
                                value={year}
                                onChange={(_, val) => setCurrentDate(new Date(Number(val), month, 1))}
                                size="sm"
                                sx={{ minWidth: 100, bgcolor: "white", borderRadius: "lg" }}
                            >
                                {yearOptions.map((y) => (
                                    <Option key={y} value={y}>
                                        {y}
                                    </Option>
                                ))}
                            </Select>
                        </Stack>

                        <IconButton variant="soft" color="neutral" onClick={() => navigateMonth(1)}>
                            <ChevronRight size={20} />
                        </IconButton>
                    </Stack>
                </Sheet>

                <Box sx={{ p: 3 }}>
                    {/* Day headers */}
                    <Stack direction="row" sx={{ mb: 2 }}>
                        {dayNames.map((day, i) => (
                            <Box key={day} sx={{ flex: 1, textAlign: "center", py: 1 }}>
                                <Typography
                                    level="body-sm"
                                    sx={{
                                        fontWeight: "lg",
                                        color: i === 0 || i === 6 ? "danger.500" : "text.primary",
                                    }}
                                >
                                    {day}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>

                    {/* Calendar days */}
                    <Box>
                        {Array.from({ length: 6 }, (_, weekIdx) => (
                            <Stack key={weekIdx} direction="row" sx={{ mb: 0.5 }}>
                                {Array.from({ length: 7 }, (_, dayIdx) => {
                                    const idx = weekIdx * 7 + dayIdx;
                                    if (idx >= calendarDays.length) return null;
                                    const date = calendarDays[idx];
                                    const current = isCurrentMonth(date);
                                    const today = isToday(date);
                                    const holiday = isHoliday(date);
                                    const weekend = date.getDay() === 0 || date.getDay() === 6;

                                    return (
                                        <Box key={dayIdx} sx={{ flex: 1, p: 0.25 }}>
                                            <Sheet
                                                onClick={() => current && toggleHoliday(date)}
                                                variant={
                                                    holiday && current
                                                        ? "solid"
                                                        : today
                                                            ? "soft"
                                                            : "outlined"
                                                }
                                                color={
                                                    holiday && current
                                                        ? "danger"
                                                        : today
                                                            ? "primary"
                                                            : "neutral"
                                                }
                                                sx={{
                                                    cursor: current ? "pointer" : "default",
                                                    borderRadius: "md",
                                                    minHeight: 60,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    opacity: current ? 1 : 0.3,
                                                    transition: "all 0.2s ease",
                                                    "&:hover": current ? { transform: "scale(1.05)", boxShadow: "sm" } : {},
                                                    fontWeight: today ? "bold" : "normal",
                                                    color: !current
                                                        ? "neutral.400"
                                                        : holiday
                                                            ? "white"
                                                            : weekend
                                                                ? "danger.600"
                                                                : "text.primary",
                                                    background:
                                                        holiday && current
                                                            ? "linear-gradient(135deg, #d32f2f, #e91e63)"
                                                            : undefined,
                                                }}
                                            >
                                                {date.getDate()}
                                            </Sheet>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        ))}
                    </Box>

                    {/* ✅ Holiday list */}
                    {holidays.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography level="title-md" sx={{ mb: 2 }}>
                                📅 รายการวันหยุดที่เลือก
                            </Typography>

                            <Stack spacing={2}>
                                {holidays.map((h) => {
                                    const d = new Date(h.date + "T00:00:00");
                                    return (
                                        <Sheet
                                            key={h.date}
                                            variant="outlined"
                                            sx={{ p: 2, borderRadius: "lg" }}
                                        >
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Typography sx={{ minWidth: 120 }}>
                                                    {d.getDate()}/{d.getMonth() + 1}/{d.getFullYear()}
                                                </Typography>
                                                <Input
                                                    placeholder="ระบุชื่อวันหยุด..."
                                                    value={h.name}
                                                    onChange={(e) => updateHolidayName(h.date, e.target.value)}
                                                    size="sm"
                                                    variant="soft"
                                                    sx={{ flex: 1 }}
                                                />
                                                <IconButton
                                                    size="sm"
                                                    variant="soft"
                                                    color="danger"
                                                    onClick={() => removeHoliday(h.date)}
                                                >
                                                    <X size={16} />
                                                </IconButton>
                                            </Stack>
                                        </Sheet>
                                    );
                                })}
                            </Stack>

                            <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
                                <Button
                                    variant="soft"
                                    color="danger"
                                    size="sm"
                                    onClick={() => setHolidays([])}
                                    startDecorator={<X size={16} />}
                                >
                                    ลบทั้งหมด
                                </Button>
                            </Stack>
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}
