import { Select, Option } from "@mui/joy";
import { Stack } from "@mui/joy";

export default function FilterControls({
    filterDept,
    setFilterDept,
    searchName,
    setSearchName,
    departments,
    fullWidth = false
}) {
    return (
        <Stack direction={fullWidth ? "column" : "row"} spacing={1} flexWrap="wrap">
            <Select
                placeholder="เลือกแผนก"
                value={filterDept}
                onChange={(_, value) => setFilterDept(value || '')}
                size="sm"
                sx={{ width: fullWidth ? "100%" : 240 }}
            >
                <Option value="">ทั้งหมด</Option>
                {departments.map((dept) => (
                    <Option key={dept} value={dept}>{dept}</Option>
                ))}
            </Select>
            <input
                type="text"
                placeholder="ค้นหาชื่อพนักงาน"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    height: '32px',
                    width: fullWidth ? '100%' : '240px'
                }}
            />
        </Stack>
    );
}
