import { Box, Checkbox, Stack, Typography, Button, Chip, Sheet } from "@mui/joy";
import { ADMIN_MENUS, TOKEN_PLATFORMS } from "../../Components/adminMenus.js";

/**
 * เลือกเมนูผู้ดูแลระบบที่อนุญาตให้ผู้ใช้ทั่วไปใช้งาน — value = array ของ menu key, onChange(newArray)
 * ถ้าเลือกเมนู "จัดการ token" จะให้เลือกแพลตฟอร์มที่มองเห็นได้ด้วย — tokenPlatforms = array ของ platform key (ว่าง = ทั้งหมด)
 */
export default function MenuPicker({ value = [], onChange, tokenPlatforms = [], onTokenPlatformsChange }) {
    const toggle = (key) => onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
    const togglePlatform = (key) => onTokenPlatformsChange(
        tokenPlatforms.includes(key) ? tokenPlatforms.filter((k) => k !== key) : [...tokenPlatforms, key]
    );

    return (
        <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1} flexWrap="wrap" useFlexGap>
                <Chip size="sm" variant="soft" color={value.length ? 'warning' : 'neutral'}>
                    อนุญาต {value.length}/{ADMIN_MENUS.length} เมนู
                </Chip>
                <Button size="sm" variant="outlined" color="neutral"
                    disabled={value.length === ADMIN_MENUS.length}
                    onClick={() => onChange(ADMIN_MENUS.map((m) => m.key))}>
                    เลือกทั้งหมด
                </Button>
                <Button size="sm" variant="plain" color="neutral" disabled={value.length === 0} onClick={() => onChange([])}>
                    ล้าง
                </Button>
            </Stack>
            <Sheet variant="outlined" sx={{ borderRadius: 'sm', p: 1 }}>
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                    gap: 0.5,
                }}>
                    {ADMIN_MENUS.map((m) => {
                        const checked = value.includes(m.key);
                        return (
                            <Box key={m.key} sx={{
                                px: 1, py: 0.75, borderRadius: 'sm',
                                // overlay ของ Checkbox จะขยายพื้นที่กดถึงกล่องแม่ที่มี position — ต้องจำกัดไว้ที่กล่องของแต่ละรายการ
                                position: 'relative', minWidth: 0,
                                bgcolor: checked ? 'warning.softBg' : 'transparent',
                                '&:hover': { bgcolor: checked ? 'warning.softHoverBg' : 'background.level1' },
                            }}>
                                <Checkbox
                                    size="sm" overlay color="warning"
                                    checked={checked}
                                    onChange={() => toggle(m.key)}
                                    label={<Typography level="body-sm">{m.label}</Typography>}
                                />
                            </Box>
                        );
                    })}
                </Box>
            </Sheet>
            {onTokenPlatformsChange && value.includes('tokens') && (
                <Sheet variant="soft" color="warning" sx={{ borderRadius: 'sm', p: 1, mt: 1 }}>
                    <Typography level="body-sm" fontWeight="bold" mb={0.5}>
                        แพลตฟอร์มที่เห็นในหน้า "จัดการ token"
                    </Typography>
                    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                        {TOKEN_PLATFORMS.map((p) => (
                            <Checkbox
                                key={p.key} size="sm" color="warning"
                                checked={tokenPlatforms.includes(p.key)}
                                onChange={() => togglePlatform(p.key)}
                                label={<Typography level="body-sm">{p.label}</Typography>}
                            />
                        ))}
                    </Stack>
                    <Typography level="body-xs" color="neutral" mt={0.5}>
                        ไม่เลือกเลย = เห็นทุกแพลตฟอร์ม
                    </Typography>
                </Sheet>
            )}
            <Typography level="body-xs" color="neutral" mt={0.5}>
                ผู้ใช้จะเห็นเมนูที่เลือกในแถบ "เมนูเพิ่มเติม" และแก้ไขข้อมูลในเมนูนั้นได้ (มีผลหลังผู้ใช้รีเฟรชหน้า)
            </Typography>
        </Box>
    );
}
