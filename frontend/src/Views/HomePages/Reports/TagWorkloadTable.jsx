import { Box, IconButton, Sheet, Table, Typography } from "@mui/joy";
import DescriptionIcon from "@mui/icons-material/Description";

export default function TagWorkloadTable({ rows }) {
    return (
        <Sheet sx={{ mt: 3 }}>
            <Typography level="h5" sx={{ fontWeight: 'bold', mb: 1 }}>ปริมาณปิดงาน ตาม Tag</Typography>
            <Box sx={{ overflowX: "auto" }}>
                <Table
                    hoverRow
                    variant="outlined"
                    sx={{ minWidth: 800 }} // ปรับตามจำนวน column
                >
                    <thead>
                        <tr>
                            <th style={{ width: "40px", textAlign: "center" }}>#</th>
                            <th style={{ textAlign: "left" }}>Tag</th>
                            <th style={{ textAlign: "center" }}>คิดเป็น (%)</th>
                            <th style={{ textAlign: "center" }}>งานทั้งหมด</th>
                            <th style={{ textAlign: "center" }}>1-5 นาที</th>
                            <th style={{ textAlign: "center" }}>5-10 นาที</th>
                            <th style={{ textAlign: "center" }}>มากกว่า 10 นาที</th>
                            <th>action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={row.tag}>
                                <td style={{ textAlign: "center" }}>{index + 1}</td>
                                <td style={{ textAlign: "left" }}>{row.tag}</td>
                                <td style={{ textAlign: "center" }}>{row.percent}%</td>
                                <td style={{ textAlign: "center" }}>{row.total}</td>
                                <td style={{ textAlign: "center" }}>{row.min1to5}</td>
                                <td style={{ textAlign: "center" }}>{row.min5to10}</td>
                                <td style={{ textAlign: "center" }}>{row.over10}</td>
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
        </Sheet>
    );
}
