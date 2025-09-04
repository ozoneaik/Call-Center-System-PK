import {
    Box,
    Table,
    Typography,
    Sheet,
    Chip,
    Card,
    CardContent,
    CircularProgress,
} from "@mui/joy";

export default function ResponsiveTable({ data, totalCount, loading, emptyMessage }) {
    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Sheet
                variant="soft"
                sx={{
                    p: { xs: 2, sm: 3 },
                    textAlign: "center",
                    borderRadius: "md",
                }}
            >
                <Typography level="body-md">{emptyMessage}</Typography>
            </Sheet>
        );
    }

    return (
        <>
            <Box
                sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "center",
                    mb: 1,
                    flexWrap: "wrap",
                    px: { xs: 0, sm: 0 },
                }}
            >
                <Chip size="sm" variant="soft">
                    รวม {totalCount} เคส
                </Chip>
            </Box>

            {/* Desktop Table */}
            <Box
                sx={{
                    display: { xs: "none", md: "block" },
                    overflowX: "auto",
                }}
            >
                <Table stickyHeader hoverRow sx={{ "--TableCell-paddingY": "10px" }}>
                    <thead>
                        <tr>
                            <th style={{ width: 56, textAlign: "center" }}>#</th>
                            <th>แท็ก</th>
                            <th style={{ width: 140, textAlign: "right" }}>จำนวน (เคส)</th>
                            <th style={{ width: 120, textAlign: "right" }}>%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((r, idx) => {
                            const pct =
                                totalCount > 0
                                    ? ((r.total * 100) / totalCount).toFixed(1)
                                    : "0.0";
                            return (
                                <tr key={`${r.tag_name}-${idx}`}>
                                    <td style={{ textAlign: "center" }}>{idx + 1}</td>
                                    <td>{r.tag_name}</td>
                                    <td style={{ textAlign: "right" }}>{r.total}</td>
                                    <td style={{ textAlign: "right" }}>{pct}%</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </Box>

            {/* Mobile Card Layout */}
            <Box
                sx={{
                    display: { xs: "block", md: "none" },
                    maxHeight: "60vh",
                    overflow: "auto",
                }}
            >
                {data.map((r, idx) => {
                    const pct =
                        totalCount > 0
                            ? ((r.total * 100) / totalCount).toFixed(1)
                            : "0.0";
                    return (
                        <Card
                            key={`${r.tag_name}-${idx}`}
                            variant="outlined"
                            sx={{
                                mb: 1,
                                "&:last-child": { mb: 0 },
                            }}
                        >
                            <CardContent sx={{ p: 2 }}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        mb: 1,
                                    }}
                                >
                                    <Typography level="body-sm" sx={{ color: "text.tertiary" }}>
                                        #{idx + 1}
                                    </Typography>
                                    <Box sx={{ textAlign: "right" }}>
                                        <Typography level="title-sm" fontWeight="lg">
                                            {r.total} เคส
                                        </Typography>
                                        <Typography level="body-xs" sx={{ color: "text.tertiary" }}>
                                            {pct}%
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography level="body-md" fontWeight="md">
                                    {r.tag_name}
                                </Typography>
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>
        </>
    );
}
