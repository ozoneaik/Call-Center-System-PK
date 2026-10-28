import { useMemo, useState } from "react";
import { Box, Checkbox, Input, Stack, Typography, Button, Chip, Sheet } from "@mui/joy";
import { Search } from "@mui/icons-material";

/**
 * เลือกห้องแชทหลายห้อง — มีช่องค้นหา, เลือกทั้งหมด/ล้าง, แสดงเป็นตารางหลายคอลัมน์ในกรอบที่เลื่อนได้
 * value = array ของ roomId, onChange(newArray)
 */
export default function RoomPicker({ rooms = [], value = [], onChange, maxHeight = 260 }) {
    const [q, setQ] = useState('');

    const visible = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return rooms;
        return rooms.filter((r) =>
            String(r.roomName ?? '').toLowerCase().includes(term) || String(r.roomId ?? '').toLowerCase().includes(term));
    }, [rooms, q]);

    const toggle = (roomId) =>
        onChange(value.includes(roomId) ? value.filter((id) => id !== roomId) : [...value, roomId]);

    const visibleIds = visible.map((r) => r.roomId);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => value.includes(id));

    const selectVisible = () => onChange([...new Set([...value, ...visibleIds])]);
    const clearVisible = () => onChange(value.filter((id) => !visibleIds.includes(id)));

    return (
        <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} mb={1}>
                <Input
                    size="sm" startDecorator={<Search />} placeholder="ค้นหาห้อง..."
                    value={q} onChange={(e) => setQ(e.target.value)} sx={{ flex: 1 }}
                />
                <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="sm" variant="soft" color={value.length ? 'primary' : 'neutral'}>
                        เลือกแล้ว {value.length}/{rooms.length}
                    </Chip>
                    <Button size="sm" variant="outlined" color="neutral" disabled={allVisibleSelected} onClick={selectVisible}>
                        {q ? 'เลือกที่ค้นเจอ' : 'เลือกทั้งหมด'}
                    </Button>
                    <Button size="sm" variant="plain" color="neutral" disabled={!visibleIds.some((id) => value.includes(id))} onClick={clearVisible}>
                        ล้าง
                    </Button>
                </Stack>
            </Stack>

            <Sheet variant="outlined" sx={{ borderRadius: 'sm', p: 1, maxHeight, overflowY: 'auto', overflowX: 'hidden' }}>
                {visible.length === 0 ? (
                    <Typography level="body-sm" color="neutral" textAlign="center" py={2}>ไม่พบห้องที่ค้นหา</Typography>
                ) : (
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                        gap: 0.5,
                    }}>
                        {visible.map((room) => {
                            const checked = value.includes(room.roomId);
                            return (
                                <Box
                                    key={room.roomId}
                                    sx={{
                                        px: 1, py: 0.75, borderRadius: 'sm',
                                        // overlay ของ Checkbox จะขยายพื้นที่กดถึงกล่องแม่ที่มี position — ต้องจำกัดไว้ที่กล่องของแต่ละรายการ
                                        position: 'relative', minWidth: 0,
                                        bgcolor: checked ? 'primary.softBg' : 'transparent',
                                        '&:hover': { bgcolor: checked ? 'primary.softHoverBg' : 'background.level1' },
                                    }}
                                >
                                    <Checkbox
                                        size="sm"
                                        overlay
                                        checked={checked}
                                        onChange={() => toggle(room.roomId)}
                                        label={
                                            <Typography level="body-sm" sx={{ wordBreak: 'break-word' }}>
                                                {room.roomName || room.roomId}
                                                <Typography level="body-xs" color="neutral" sx={{ ml: 0.75 }}>{room.roomId}</Typography>
                                            </Typography>
                                        }
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </Sheet>
        </Box>
    );
}
