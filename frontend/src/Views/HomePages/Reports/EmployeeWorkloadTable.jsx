import {
    Table,
    Typography,
    IconButton,
    Sheet,
    Box,
} from "@mui/joy";
import DescriptionIcon from "@mui/icons-material/Description";

export default function EmployeeWorkloadTable({ rows }) {
    return (
        <Sheet sx={{ mt: 1 }}>
            <Typography level="h5" sx={{ fontWeight: 'bold', mb: 1 }}>ปริมาณงาน ตามพนักงาน</Typography>
            <Box sx={{ overflowX: "auto" }}>
                <Table
                    hoverRow
                    variant="outlined"
                    sx={{ minWidth: 800 }} // ปรับตามจำนวน column
                >
                    <thead>
                        <tr>
                            <th style={{ width: "40px", textAlign: "center" }}>#</th>
                            <th style={{ textAlign: "left" }}>พนักงาน</th>
                            <th style={{ textAlign: "center" }}>คิดเป็น (%)</th>
                            <th style={{ textAlign: "center" }}>งานทั้งหมด</th>
                            <th style={{ textAlign: "center" }}>1-5 นาที</th>
                            <th style={{ textAlign: "center" }}>5-10 นาที</th>
                            <th style={{ textAlign: "center" }}>มากกว่า 10 นาที</th>
                            <th style={{ textAlign: "center" }}>กำลังดำเนินการ</th>
                            <th>action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={row.name}>
                                <td>{index + 1}</td>
                                <td style={{ textAlign: "left" }}>{row.name}</td>
                                <td style={{ textAlign: "center" }}>{row.percent}%</td>
                                <td style={{ textAlign: "center" }}>{row.total}</td>
                                <td style={{ textAlign: "center" }}>{row.min1to5}</td>
                                <td style={{ textAlign: "center" }}>{row.min5to10}</td>
                                <td style={{ textAlign: "center" }}>{row.over10}</td>
                                <td style={{ textAlign: "center" }}>{row.inProgress}</td>
                                <td>
                                    <IconButton variant="soft" color="neutral" onClick={() => row.onClickDetail(row)}>
                                        <DescriptionIcon />
                                    </IconButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Box>
        </Sheet >
    );
}
