import { useEffect, useState } from "react";
import axiosClient from "../../../../Axios";
import {
    Sheet,
    Typography,
    Table,
    CircularProgress,
    Box,
    Card,
    CardContent,
    Chip
} from "@mui/joy";
import dayjs from "dayjs";

export default function TagSummaryToday() {
    const [loading, setLoading] = useState(true);
    const [tags, setTags] = useState([]);
    const [totalClosed, setTotalClosed] = useState(0);

    useEffect(() => {
        axiosClient.get("home/user-case/tag-summary-today")
            .then(({ data }) => {
                const tagData = data.data || [];
                setTags(tagData);
                const total = tagData.reduce((sum, tag) => sum + parseInt(tag.total), 0);
                setTotalClosed(total);
                setLoading(false);
            }).catch(() => {
                // alert("โหลดข้อมูลแท็กไม่สําเร็จ");
                setLoading(false);
            });
    }, []);

    return (
        <Sheet sx={{ mt: 3 }}>
            <Typography level="h4" mb={2}>
                🏷️ สถิติการปิดเคสตามแท็ก ({dayjs().format('DD/MM/YYYY')})
            </Typography>

            {loading ? (
                <Box display="flex" justifyContent="center" mt={4}>
                    <CircularProgress size="lg" />
                </Box>
            ) : (
                <Card variant="outlined" sx={{ borderRadius: 'lg', boxShadow: 'sm' }}>
                    <CardContent>
                        <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                            <Table
                                variant="plain"
                                hoverRow
                                stickyHeader
                                sx={{ minWidth: 500 }}
                            >
                                <thead>
                                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                                        <th style={{ width: 60 }}>#</th>
                                        <th>ชื่อแท็ก</th>
                                        <th style={{ textAlign: 'center' }}>จำนวนที่ปิด</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tags.map((tag, idx) => (
                                        <tr key={tag.tag_name}>
                                            <td>{idx + 1}</td>
                                            <td>{tag.tag_name}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <Chip
                                                    color="primary"
                                                    variant="soft"
                                                    size="md"
                                                    sx={{ fontWeight: 'bold' }}
                                                >
                                                    {tag.total}
                                                </Chip>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ backgroundColor: '#f8f8f8', fontWeight: 'bold' }}>
                                        <td colSpan={2} style={{ textAlign: 'left' }}>รวมทั้งหมด</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <Chip color="success" variant="soft" size="md">
                                                {tags.reduce((sum, tag) => sum + parseInt(tag.total), 0)}
                                            </Chip>
                                        </td>
                                    </tr>
                                </tfoot>
                            </Table>
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Sheet>
    );
}
