import { Box, Table } from "@mui/joy";
import dayjs from "dayjs";
import { BUCKET_KEYS, valueDisplay } from "./helpers";

export default function RangeTable({ rows = [] }) {
    return (
        <Box sx={{ overflowX: "auto", maxHeight: "60vh", border: "1px solid #ccc", borderRadius: 4, mt: 1 }}>
            {rows.length > 0 && (
                <Table variant="outlined" hoverRow stickyHeader sx={{ minWidth: 850 }}>
                    <thead>
                        <tr>
                            <th>#</th><th>วันที่</th>
                            {BUCKET_KEYS.map((k) => <th key={k}>{k}</th>)}
                            <th>รวม</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, idx) => (
                            <tr key={row.date}>
                                <td>{idx + 1}</td>
                                <td>{dayjs(row.date).format("DD/MM/YYYY")}</td>
                                {BUCKET_KEYS.map((k) => <td key={k}>{row[k]}</td>)}
                                <td>{valueDisplay(row.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Box>
    );
}
