import { Add, Autorenew, CalendarMonth, DateRange, Done, Home, Send } from "@mui/icons-material";
import { Avatar, Box, Button, Card, CardContent, Chip, Divider, IconButton, Stack, Typography } from "@mui/joy";
import { Grid2 } from "@mui/material";

export default function UserCase() {
    return (
        <div>
            <Stack direction='row' justifyContent='space-between'>
                <h1>พนักงานที่ทำงาน</h1>
                 <Button size='sm' variant="plain" startDecorator={<Add/>}>แสดงเพิ่มเติม</Button>
            </Stack>
            <Grid2 mt={2} spacing={2} container sx={{ maxHeight: 490 }} overflow='auto'>
                {[1, 2, 3, 4].map((item, index) => (
                    <Grid2 size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
                        <Card>
                            <CardContent>
                                <Stack spacing={1}>
                                    <Box display='flex' justifyContent='start' alignItems='center' gap={2} mb={3}>
                                        <Avatar variant="solid" color="primary" sx={{ width: '60px', height: '60px' }} />
                                        <Stack spacing={1}>
                                            <Typography fontWeight='bold' textAlign='center' fontSize={20}>
                                                ชื่อพนักงาน
                                            </Typography>
                                            <Chip>แผนกการตลาด</Chip>
                                        </Stack>
                                    </Box>
                                    <Divider />
                                    <Stack spacing={1}>
                                        <BoxCase icon={<Done />} label="ปิดเคสวันนี้" value={10} color="green" />
                                        <BoxCase icon={<Autorenew />} label="เคสที่กำลังดำเนินการ" value={10} color="#0067C6" />
                                        <BoxCase icon={<DateRange />} label="ปิดเคสสัปดาห์นี้" value={10} color="#363D42" />
                                        <BoxCase icon={<CalendarMonth />} label="ปิดเคสเดือนนี้" value={10} color="#363D42" />
                                        <BoxCase icon={<Send />} label="ส่งต่อเคส" value={10} color="#FFB200" />
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid2>
                ))}
            </Grid2>

        </div>
    )
}

const BoxCase = ({ icon = <Home />, label = 'กรุณาระบุ label', value = 0, color = 'gray' }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 1,
                borderRadius: 6,
                boxShadow: 'sm',
                backgroundColor: '#fffff',
                color: color || 'black',
            }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton color={color} sx={{ color: color }}>
                    {icon}
                </IconButton>
                <span>{label}</span>
            </Box>
            <Box sx={{ fontWeight: 'bold' }}>{value}</Box>
        </Box>
    )
}