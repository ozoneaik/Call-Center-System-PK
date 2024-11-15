import { Box, Button, Card, Input, Sheet, Stack, Table, Typography } from "@mui/joy";
export const ActiveList = () => {
    return (
        <Table stickyHeader borderAxis="both" stickyFooter>
                <thead>
                    <tr>
                        <th colSpan={4}>ชื่อลูกค้า : jsldfjlksadfl</th>
                    </tr>
                    <tr>
                        <th>ห้องแชท</th>
                        <th>เวลาที่คุย</th>
                        <th>พนักงานรับเรื่อง</th>
                        <th>เวลาสนทนา</th>
                    </tr>
                </thead>
                <tbody>
                    {[1, 2, 3, 4, 5, 67, 4, 2, 2, 3, 23, 23, 24, 2].map((item) => (
                        <tr>
                            <td>sldfls</td>
                            <td>sldfls</td>
                            <td>sldfls</td>
                            <td>
                                <Button size="sm">ดู</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot >
                    <tr>
                        <th colSpan={2}>รวม</th>
                        <th colSpan={2}>6 ชั่วโมง 30 นาที 0 วินาที</th>
                    </tr>
                </tfoot>
            </Table>
    )
}