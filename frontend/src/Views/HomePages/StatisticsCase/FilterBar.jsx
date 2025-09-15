import {
    Box, Button, Chip, ChipDelete, CircularProgress, FormControl, FormLabel,
    Input, Option, Select, Sheet, Stack, Typography, Alert
} from "@mui/joy";
import dayjs from "dayjs";
import { isRangeTooLongStr, makeEndMax, MAX_DAYS } from "./helpers";

export default function FilterBar({
    isLoading,
    platformOptions = [],
    deptOptions = [],
    empOptions = [],
    roomOptions = [],

    filterPlatform, setFilterPlatform,
    filterDept, setFilterDept,
    filterEmp, setFilterEmp,
    filterRoom, setFilterRoom,

    // วันที่ (ในเวลา)
    startDate, setStartDate,
    endDate, setEndDate,

    exporting,
    onExportDetailed,

    // modal toggles
    onOpenBusinessModal,
    onOpenAfterHourModal,
}) {
    const businessRangeError = isRangeTooLongStr(startDate, endDate);
    const businessEndMax = makeEndMax(startDate);

    const clearFilters = () => {
        setFilterDept("");
        setFilterEmp("");
        setFilterPlatform("");
        setFilterRoom("");
    };
    const getActiveFiltersCount = () => {
        let count = 0;
        if (filterDept) count++;
        if (filterEmp) count++;
        if (filterPlatform) count++;
        if (filterRoom) count++;
        return count;
    };

    const handleStartChange = (v) => {
        const s = v || "";
        setStartDate((prev) => (s || prev));
        if (!s) return;
        setEndDate((prev) => {
            let candidate = prev || s;
            if (dayjs(candidate).isBefore(s)) candidate = s;
            // คุมไม่เกิน 31 วัน
            const maxEnd = businessEndMax || s;
            if (dayjs(candidate).isAfter(maxEnd)) candidate = maxEnd;
            return candidate;
        });
    };
    const handleEndChange = (v) => {
        if (!v) return setEndDate("");
        let e = v;
        if (startDate && dayjs(e).isBefore(startDate)) e = startDate;
        const maxEnd = businessEndMax || e;
        if (dayjs(e).isAfter(maxEnd)) e = maxEnd;
        setEndDate(e);
    };

    return (
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

            {/* แถวเดียว */}
            <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                alignItems: 'flex-end',
                '@media (max-width: 1200px)': { flexDirection: 'column', gap: 2 }
            }}>
                <Box sx={{
                    display: 'flex',
                    gap: 2,
                    flexWrap: 'nowrap',
                    minWidth: 0,
                    flex: 1,
                    alignItems: 'flex-end',
                    '@media (max-width: 900px)': { flexWrap: 'wrap', width: '100%' }
                }}>
                    {/* Department */}
                    <FormControl sx={{ minWidth: 140 }}>
                        <FormLabel sx={{ fontSize: '0.875rem', height: 40, display: 'flex', alignItems: 'center' }}>🏢 แผนก</FormLabel>
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

                    <FormControl sx={{ minWidth: 160 }}>
                        <FormLabel sx={{ fontSize: '0.875rem', height: 40, display: 'flex', alignItems: 'center' }}>
                            💬 ห้องแชท
                        </FormLabel>
                        <Select
                            size="sm"
                            placeholder="ทั้งหมด"
                            value={filterRoom}
                            onChange={(e, value) => setFilterRoom(value || "")}
                            sx={{ backgroundColor: 'background.body' }}
                        >
                            <Option value="">ทั้งหมด</Option>
                            {roomOptions.map((room) => (
                                <Option key={room.value} value={room.value}>
                                    {room.label}
                                </Option>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Employee */}
                    <FormControl sx={{ minWidth: 140 }}>
                        <FormLabel sx={{ fontSize: '0.875rem', height: 40, display: 'flex', alignItems: 'center' }}>👤 พนักงาน</FormLabel>
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
                                .map((emp) => <Option key={emp.value} value={emp.value}>{emp.label}</Option>)}
                        </Select>
                    </FormControl>

                    {/* Platform */}
                    <FormControl sx={{ minWidth: 140 }}>
                        <FormLabel sx={{ fontSize: '0.875rem', height: 40, display: 'flex', alignItems: 'center' }}>📱 แพลตฟอร์ม</FormLabel>
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

                    {/* Date Range + Export (≤ 31 วัน) */}
                    <FormControl sx={{ minWidth: 300, flex: 1 }}>
                        <FormLabel sx={{ fontSize: '0.875rem', height: 40, display: 'flex', alignItems: 'center' }}>
                            📅 ช่วงวันที่ & Export รายการเคส (สูงสุด {MAX_DAYS} วัน)
                        </FormLabel>
                        <Box sx={{ display: "flex", flexDirection: "row", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                            <Input
                                type="date"
                                size="sm"
                                value={startDate}
                                onChange={(e) => handleStartChange(e.target.value)}
                                slotProps={{ input: { max: endDate || undefined } }}
                                sx={{ minWidth: 140 }}
                            />
                            <Typography level="body-sm">—</Typography>
                            <Input
                                type="date"
                                size="sm"
                                value={endDate}
                                onChange={(e) => handleEndChange(e.target.value)}
                                slotProps={{ input: { min: startDate || undefined, max: businessEndMax || undefined } }}
                                sx={{ minWidth: 140 }}
                            />
                            <Button
                                size="sm"
                                color="primary"
                                variant="solid"
                                onClick={onExportDetailed}
                                startDecorator="📥"
                                disabled={
                                    exporting ||
                                    !startDate ||
                                    !endDate ||
                                    dayjs(endDate).isBefore(startDate) ||
                                    businessRangeError
                                }
                                sx={{ minWidth: 80 }}
                            >
                                {exporting ? "กำลังสร้าง..." : "Export"}
                            </Button>
                        </Box>
                        {businessRangeError && (
                            <Alert color="danger" variant="soft" sx={{ mt: 1 }}>
                                เลือกช่วงได้ไม่เกิน {MAX_DAYS} วัน
                            </Alert>
                        )}
                    </FormControl>

                    {/* Actions + ปุ่มเปิดโมดัล */}
                    <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, '@media (max-width: 900px)': { width: '100%', justifyContent: 'stretch' } }}>
                        <Button size="sm" variant="solid" color="primary" onClick={() => window.location.reload()} startDecorator="🔄"
                            sx={{ '@media (max-width: 900px)': { flex: 1 } }}>
                            รีเฟรช
                        </Button>
                        <Button size="sm" variant="outlined" color="neutral" onClick={clearFilters}
                            disabled={getActiveFiltersCount() === 0} startDecorator="🗑️"
                            sx={{ '@media (max-width: 900px)': { flex: 1 } }}>
                            ล้าง
                        </Button>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
                        <Button size="sm" onClick={onOpenBusinessModal} variant="outlined" color="primary" startDecorator="📅"
                            sx={{ '@media (max-width: 900px)': { flex: 1 } }}>
                            ในเวลา
                        </Button>
                        <Button size="sm" onClick={onOpenAfterHourModal} variant="outlined" color="warning" startDecorator="🌙"
                            sx={{ '@media (max-width: 900px)': { flex: 1 } }}>
                            นอกเวลา
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* Active Filters */}
            {getActiveFiltersCount() > 0 && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography level="body-sm" color="neutral" sx={{ mb: 1 }}>ตัวกรองที่เลือก:</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        {filterDept && (
                            <Chip variant="soft" color="primary" endDecorator={
                                <ChipDelete aria-label="ลบตัวกรองแผนก" onClick={() => { setFilterDept(""); setFilterEmp(""); }} />
                            }>
                                🏢 {deptOptions.find(d => d.value === filterDept)?.label || filterDept}
                            </Chip>
                        )}
                        {filterEmp && (
                            <Chip variant="soft" color="primary" endDecorator={
                                <ChipDelete aria-label="ลบตัวกรองพนักงาน" onClick={() => setFilterEmp("")} />
                            }>
                                👤 {empOptions.find(e => e.value === filterEmp)?.label || filterEmp}
                            </Chip>
                        )}
                        {filterPlatform && (
                            <Chip variant="soft" color="primary" endDecorator={
                                <ChipDelete aria-label="ลบตัวกรองแพลตฟอร์ม" onClick={() => setFilterPlatform("")} />
                            }>
                                📱 {platformOptions.find(p => p.value === filterPlatform)?.label || filterPlatform}
                            </Chip>
                        )}
                        {filterRoom && (
                            <Chip variant="soft" color="primary" endDecorator={
                                <ChipDelete aria-label="ลบตัวกรองห้องแชท" onClick={() => setFilterRoom("")} />
                            }>
                                💬 {roomOptions.find(r => r.value === filterRoom)?.label || filterRoom}
                            </Chip>
                        )}
                    </Stack>
                </Box>
            )}
        </Sheet>
    );
}
