import { Box, Button, Card, Input, Sheet, Stack, Table, Typography } from "@mui/joy";
export const RateList = () => {
    return (
    
            <Table stickyHeader borderAxis="both">
                <thead>
                    <tr>
                        <th>ลูกค้า</th>
                        <th>สถานะ</th>
                        <th>แท็คการจบสนทนา</th>
                        <th>ชั่วโมงรวม</th>
                        <th>จำนวนดาว</th>
                    </tr>
                </thead>
                <tbody>
                    {[1, 2, 3, 4, 5, 67, 4, 2, 2, 3, 23, 23, 24, 2].map((item) => (
                        <tr>
                            <td>sldfls</td>
                            <td>sldfls</td>
                            <td>sldfls</td>
                            <td>sldfls</td>
                            <td>
                                <Button size="sm">ดู</Button>
                            </td>
                        </tr>
                    ))}

                </tbody>
            </Table>
        
    )
}