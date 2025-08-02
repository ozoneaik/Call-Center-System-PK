import {
    Avatar,
    Box,
    Chip,
    Sheet,
    Stack,
    Table,
    Typography
} from "@mui/joy";

export default function EmployeeTable({ employees }) {
    return (
        <Sheet variant="outlined" sx={{ borderRadius: 'sm', overflow: 'auto', maxHeight: 490 }}>
            <Table stickyHeader hoverRow>
                <thead>
                    <tr>
                        <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                        <th style={{ width: '200px', padding: '12px' }}>พนักงาน</th>
                        <th style={{ textAlign: 'center' }}>ปิดเคสวันนี้</th>
                        <th style={{ textAlign: 'center' }}>กำลังดำเนินการ</th>
                        <th style={{ textAlign: 'center' }}>ปิดเคสสัปดาห์นี้</th>
                        <th style={{ textAlign: 'center' }}>ปิดเคสเดือนนี้</th>
                        <th style={{ textAlign: 'center' }}>ส่งต่อเคส</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>สถานะ</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map((employee, index) => (
                        <tr key={employee.id}>
                            <td style={{ textAlign: 'center' }}>{index + 1}</td>
                            <td style={{ padding: '12px' }}>
                                <Box display='flex' alignItems='center' gap={2}>
                                    <Avatar variant="solid" color="primary" sx={{ width: '40px', height: '40px' }} />
                                    <Stack spacing={0.5}>
                                        <Typography fontWeight='bold' fontSize={14}>{employee.name}</Typography>
                                        <Chip size="sm" variant="soft">{employee.department}</Chip>
                                    </Stack>
                                </Box>
                            </td>
                            <td style={{
                                textAlign: 'center',
                                color:
                                    employee.todayClosed === 0
                                        ? '#D32F2F' : "green",
                                fontWeight: employee.todayClosed === 0 ? 'bold' : 'normal',
                            }}>
                                {employee.todayClosed}
                            </td>
                            <td style={{
                                textAlign: 'center',
                                color:
                                    employee.inProgress === 0
                                        ? '#D32F2F' : "green",
                                fontWeight: employee.inProgress === 0 ? 'bold' : 'normal',
                            }}>
                                {employee.inProgress > 50 ? `${employee.inProgress} ⚠️` : employee.inProgress}
                            </td>
                            <td style={{
                                textAlign: 'center',
                                color:
                                    employee.weekClosed === 0
                                        ? '#D32F2F' : "green",
                                fontWeight: employee.weekClosed === 0 ? 'bold' : 'normal',
                            }}>
                                {employee.weekClosed}
                            </td>
                            <td style={{
                                textAlign: 'center',
                                color:
                                    employee.monthClosed === 0
                                        ? '#D32F2F' : "green",
                                fontWeight: employee.monthClosed === 0 ? 'bold' : 'normal',
                            }}>
                                {employee.monthClosed}
                            </td>
                            <td style={{
                                textAlign: 'center',
                                color:
                                    employee.forwarded === 0
                                        ? '#D32F2F' : "green",
                                fontWeight: employee.forwarded === 0 ? 'bold' : 'normal',
                            }}>
                                {employee.forwarded}
                            </td>
                            <td style={{ textAlign: 'center', padding: '12px' }}>
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
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Sheet>
    );
}