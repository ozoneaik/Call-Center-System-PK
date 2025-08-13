import {
    Sheet, Stack, Box, Divider, Drawer, ModalClose,
    Select, Option, Button, Input, Autocomplete, Chip, IconButton, Tooltip, Typography
} from "@mui/joy";
import { Search, Clear, Today, DateRange, FilterAltOff, FilterList, Add } from "@mui/icons-material";
import { useMemo, useState } from "react";

function useDebounce(fn, delay = 250) {
    const t = { id: null };
    return (...args) => {
        clearTimeout(t.id);
        t.id = setTimeout(() => fn(...args), delay);
    };
}

export default function FilterControls({
    filterDept, setFilterDept,
    searchName, setSearchName,
    departments,
    fullWidth = false,
    startDate, endDate, setStartDate, setEndDate,
    onApplyRange, onClearRange,
    selectedTags = [], onChangeTags = () => { },
    tagOptions = [],
    onOpenAllEmployees = () => { },        // <<< เพิ่ม prop สำหรับเปิดโมดอลรายชื่อทั้งหมด
}) {
    const options = (tagOptions || []).map(t => ({ id: String(t.id), label: t.tagName || String(t.id) }));
    const valueOptions = options.filter(o => selectedTags.includes(o.id));
    const debouncedSearch = useDebounce(v => setSearchName(v), 300);

    const [openDrawer, setOpenDrawer] = useState(false);

    const activeChips = useMemo(() => {
        const chips = [];
        if (filterDept) chips.push({ key: "dept", label: `แผนก: ${filterDept}` });
        if (searchName) chips.push({ key: "q", label: `ค้นหา: ${searchName}` });
        if (selectedTags.length) {
            const names = valueOptions.map(v => v.label).join(", ");
            chips.push({ key: "tags", label: `แท็ก: ${names}` });
        }
        if (startDate || endDate) chips.push({ key: "range", label: `ช่วง: ${startDate || "-"} → ${endDate || "-"}` });
        return chips;
    }, [filterDept, searchName, selectedTags, valueOptions, startDate, endDate]);

    const applyToday = () => {
        const d = new Date().toISOString().slice(0, 10);
        setStartDate(d); setEndDate(d); onApplyRange?.();
    };
    const applyThisWeek = () => {
        const now = new Date();
        const day = now.getDay() || 7;
        const monday = new Date(now); monday.setDate(now.getDate() - (day - 1));
        const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
        const s = monday.toISOString().slice(0, 10);
        const e = sunday.toISOString().slice(0, 10);
        setStartDate(s); setEndDate(e); onApplyRange?.();
    };
    const applyThisMonth = () => {
        const now = new Date();
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const s = first.toISOString().slice(0, 10);
        const e = last.toISOString().slice(0, 10);
        setStartDate(s); setEndDate(e); onApplyRange?.();
    };

    if (!fullWidth) {
        // ===== Desktop layout =====
        return (
            <Sheet sx={{ p: 1 }}>
                <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    alignItems="center"
                    flexWrap="nowrap"
                    sx={{
                        minHeight: 40,
                        overflowX: "auto",
                        "&::-webkit-scrollbar": { height: 6 },
                        "&::-webkit-scrollbar-thumb": { backgroundColor: "rgba(0,0,0,0.1)", borderRadius: 3 }
                    }}
                >
                    <Input
                        size="sm"
                        placeholder="ค้นหาชื่อ"
                        defaultValue={searchName}
                        onChange={(e) => debouncedSearch(e.target.value)}
                        startDecorator={<Search fontSize="small" />}
                        sx={{ minWidth: 180, width: 180, flexShrink: 0 }}
                    />
                    <Select
                        size="sm"
                        placeholder="แผนก"
                        value={filterDept}
                        onChange={(_, v) => setFilterDept(v || "")}
                        sx={{ minWidth: 140, width: 140, flexShrink: 0 }}
                    >
                        <Option value="">ทั้งหมด</Option>
                        {departments.map((dept) => (
                            <Option key={dept} value={dept}>{dept}</Option>
                        ))}
                    </Select>
                    <Autocomplete
                        multiple size="sm" placeholder="แท็ก"
                        options={options} value={valueOptions}
                        getOptionLabel={(opt) => opt.label}
                        onChange={(_, newValues) => onChangeTags(newValues.map(v => v.id))}
                        sx={{ minWidth: 180, width: 180, flexShrink: 0 }}
                    />
                    <Input
                        type="date" size="sm" value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        slotProps={{ input: { max: endDate || undefined } }}
                        sx={{ width: 150, flexShrink: 0 }}
                    />
                    <Input
                        type="date" size="sm" value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        slotProps={{ input: { min: startDate || undefined } }}
                        sx={{ width: 150, flexShrink: 0 }}
                    />
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                        <Tooltip title="วันนี้"><IconButton size="sm" variant="plain" onClick={applyToday}><Today fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="สัปดาห์นี้"><IconButton size="sm" variant="plain" onClick={applyThisWeek}><DateRange fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="เดือนนี้"><IconButton size="sm" variant="plain" onClick={applyThisMonth}><DateRange fontSize="small" /></IconButton></Tooltip>
                    </Stack>

                    <Divider orientation="vertical" sx={{ flexShrink: 0 }} />

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                        <Button size="sm" variant="solid" onClick={onApplyRange}>ใช้ตัวกรอง</Button>
                        <Button size="sm" variant="soft" color="neutral" onClick={onClearRange} startDecorator={<FilterAltOff fontSize="small" />}></Button>
                    </Stack>
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ flexShrink: 0, ml: 'auto' }} // ดันไปขวาสุด
                    >
                        <Button
                            size="sm"
                            variant="solid"
                            startDecorator={<Add />}
                            onClick={onOpenAllEmployees}
                        >
                            แสดงรายชื่อพนักงานทั้งหมด
                        </Button>
                    </Stack>
                </Stack>

                {activeChips.length > 0 && (
                    <>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                            {activeChips.map((c) => (
                                <Chip
                                    key={c.key}
                                    variant="soft"
                                    size="sm"
                                    endDecorator={
                                        <IconButton
                                            size="sm"
                                            variant="plain"
                                            sx={{ pointerEvents: 'auto' }}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (c.key === "dept") setFilterDept("");
                                                if (c.key === "q") setSearchName("");
                                                if (c.key === "tags") onChangeTags([]);
                                                if (c.key === "range") { setStartDate(""); setEndDate(""); }
                                            }}
                                        >
                                            <Clear fontSize="small" />
                                        </IconButton>
                                    }
                                >
                                    {c.label}
                                </Chip>
                            ))}
                        </Box>
                    </>
                )}
            </Sheet>
        );
    }

    // ===== Mobile layout =====
    return (
        <>
            {/* Toolbar mobile */}
            <Sheet sx={{ p: 1, borderRadius: "lg" }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Input
                        size="sm"
                        placeholder="ค้นหาชื่อ"
                        defaultValue={searchName}
                        onChange={(e) => debouncedSearch(e.target.value)}
                        startDecorator={<Search fontSize="small" />}
                        sx={{ flex: 1 }}
                    />
                    <Button size="sm" variant="soft" startDecorator={<FilterList />} onClick={() => setOpenDrawer(true)}>
                        ตัวกรอง
                    </Button>
                    {/* ปุ่มรายชื่อทั้งหมด บน toolbar มือถือ */}
                    <Button
                        size="sm"
                        variant="plain"
                        startDecorator={<Add />}
                        onClick={onOpenAllEmployees}
                    >
                        ทั้งหมด
                    </Button>
                </Stack>

                {activeChips.length > 0 && (
                    <Box sx={{ mt: 1, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {activeChips.map((c) => (
                            <Chip
                                key={c.key}
                                variant="soft"
                                size="sm"
                                endDecorator={
                                    <IconButton
                                        size="sm"
                                        variant="plain"
                                        sx={{ pointerEvents: 'auto' }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (c.key === "dept") setFilterDept("");
                                            if (c.key === "q") setSearchName("");
                                            if (c.key === "tags") onChangeTags([]);
                                            if (c.key === "range") { setStartDate(""); setEndDate(""); }
                                        }}
                                    >
                                        <Clear fontSize="small" />
                                    </IconButton>
                                }
                            >
                                {c.label}
                            </Chip>
                        ))}
                    </Box>
                )}
            </Sheet>

            {/* Drawer mobile */}
            <Drawer
                anchor="bottom"
                open={openDrawer}
                onClose={() => setOpenDrawer(false)}
                slotProps={{ content: { sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16 } } }}
            >
                <Sheet sx={{ p: 1.5, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography level="title-md">ตัวกรอง</Typography>
                        <ModalClose />
                    </Stack>

                    <Stack spacing={1.2}>
                        <Select
                            size="sm"
                            placeholder="เลือกแผนก"
                            value={filterDept}
                            onChange={(_, v) => setFilterDept(v || "")}
                            sx={{ width: "100%" }}
                        >
                            <Option value="">ทั้งหมด</Option>
                            {departments.map((dept) => (
                                <Option key={dept} value={dept}>{dept}</Option>
                            ))}
                        </Select>

                        <Autocomplete
                            multiple
                            size="sm"
                            placeholder="แท็ก (เลือกหลายได้)"
                            options={options}
                            value={valueOptions}
                            getOptionLabel={(opt) => opt.label}
                            onChange={(_, newValues) => onChangeTags(newValues.map(v => v.id))}
                            sx={{ width: "100%" }}
                        />

                        <Stack direction="row" spacing={1}>
                            <Input
                                type="date"
                                size="sm"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                slotProps={{ input: { max: endDate || undefined } }}
                                sx={{ flex: 1, minWidth: 160 }}
                            />
                            <Input
                                type="date"
                                size="sm"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                slotProps={{ input: { min: startDate || undefined } }}
                                sx={{ flex: 1, minWidth: 160 }}
                            />
                        </Stack>

                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <Tooltip title="วันนี้"><IconButton size="sm" variant="plain" onClick={applyToday}><Today fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="สัปดาห์นี้"><IconButton size="sm" variant="plain" onClick={applyThisWeek}><DateRange fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="เดือนนี้"><IconButton size="sm" variant="plain" onClick={applyThisMonth}><DateRange fontSize="small" /></IconButton></Tooltip>
                        </Stack>

                        {activeChips.length > 0 && (
                            <>
                                <Divider />
                                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                    {activeChips.map((c) => (
                                        <Chip
                                            key={c.key}
                                            variant="soft"
                                            size="sm"
                                            endDecorator={
                                                <IconButton
                                                    size="sm"
                                                    variant="plain"
                                                    sx={{ pointerEvents: 'auto' }}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (c.key === "dept") setFilterDept("");
                                                        if (c.key === "q") setSearchName("");
                                                        if (c.key === "tags") onChangeTags([]);
                                                        if (c.key === "range") { setStartDate(""); setEndDate(""); }
                                                    }}
                                                >
                                                    <Clear fontSize="small" />
                                                </IconButton>
                                            }
                                        >
                                            {c.label}
                                        </Chip>
                                    ))}
                                </Box>
                            </>
                        )}

                        {/* แถวปุ่ม action ของ Drawer */}
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                            <Button fullWidth size="sm" variant="solid" onClick={() => { onApplyRange?.(); setOpenDrawer(false); }}>
                                ใช้ตัวกรอง
                            </Button>
                            <Button fullWidth size="sm" variant="soft" color="neutral" onClick={() => { onClearRange?.(); setOpenDrawer(false); }} startDecorator={<FilterAltOff fontSize="small" />}>
                                ล้าง
                            </Button>
                        </Stack>
                        {/* ปุ่มรายชื่อทั้งหมดใน Drawer */}
                        <Button
                            fullWidth
                            size="sm"
                            variant="solid"
                            startDecorator={<Add />}
                            onClick={() => { onOpenAllEmployees(); setOpenDrawer(false); }}
                        >
                            แสดงรายชื่อพนักงานทั้งหมด
                        </Button>

                    </Stack>
                </Sheet>
            </Drawer>
        </>
    );
}
