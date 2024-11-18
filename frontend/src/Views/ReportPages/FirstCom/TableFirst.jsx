import {Button,  Table, } from "@mui/joy";
export const TableFirst = () => {
    return (
        <>
            <Table stickyHeader borderAxis="both">
                <thead>
                    <tr>
                        <th>จากไลน์</th>
                        <th>เคสที่จบแล้ว</th>
                        <th>เคสที่ค้าง</th>
                        <th>#</th>
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
            </Table>
        </>
    )
}