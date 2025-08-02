// components/EmployeeCards.jsx
import { Grid2 } from "@mui/material";
import { Card, CardContent, Stack, Typography, Chip, Box, Avatar } from "@mui/joy";
import { Autorenew, CalendarMonth, DateRange, Done, Send } from "@mui/icons-material";
import BoxCase from "./BoxCase";

export default function EmployeeCards({ employees }) {
    return employees.map((employee) => (
        <Grid2 size={{ xs: 12 }} key={employee.id}>
            <Card>
                <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <Avatar variant="solid" color="primary" sx={{ width: '40px', height: '40px' }} />
                        <Stack spacing={0.5}>
                            <Typography fontWeight="bold" fontSize={14}>
                                {employee.name}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Chip size="sm" variant="soft">
                                    {employee.department}
                                </Chip>
                                <Chip
                                    size="sm"
                                    variant="soft"
                                    color={employee.isActiveToday ? 'success' : 'neutral'}
                                    sx={{
                                        fontWeight: 'bold',
                                        backgroundColor: employee.isActiveToday ? '#E8F5E8' : '#F5F5F5',
                                        color: employee.isActiveToday ? '#2E7D32' : '#666666'
                                    }}
                                >
                                    {employee.isActiveToday ? 'Active' : 'Inactive'}
                                </Chip>
                            </Box>
                        </Stack>
                    </Box>
                    <Stack spacing={1}>
                        <BoxCase
                            icon={<Done />}
                            label="ปิดเคสวันนี้"
                            value={employee.todayClosed}
                            color={
                                employee.todayClosed === 0
                                    ? '#D32F2F' : "green"
                            }
                            warning={employee.todayClosed === 0}
                        />
                        <BoxCase
                            icon={<Autorenew />}
                            label="เคสที่กำลังดำเนินการ"
                            value={employee.inProgress}
                            color={
                                employee.inProgress === 0
                                    ? '#D32F2F' : "green"
                            }
                            warning={employee.inProgress === 0}
                        />
                        <BoxCase
                            icon={<DateRange />}
                            label="ปิดเคสสัปดาห์นี้"
                            value={employee.weekClosed}
                            color={
                                employee.weekClosed === 0
                                    ? '#D32F2F' : "green"
                            }
                            warning={employee.weekClosed === 0}
                        />
                        <BoxCase
                            icon={<CalendarMonth />}
                            label="ปิดเคสเดือนนี้"
                            value={employee.monthClosed}
                            color={
                                employee.monthClosed === 0
                                    ? '#D32F2F' : "green"
                            }
                            warning={employee.forwarded === 0}
                        />
                        <BoxCase
                            icon={<Send />}
                            label="ส่งต่อเคส"
                            value={employee.forwarded}
                            color={
                                employee.forwarded === 0
                                    ? '#D32F2F' : "green"
                            }
                            warning={employee.forwarded === 0}
                        />
                    </Stack>
                </CardContent>
            </Card>
        </Grid2>
    ));
}