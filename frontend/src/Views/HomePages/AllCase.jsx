import { useEffect, useState } from "react";
import axiosClient from "../../Axios";
import {
  Sheet,
  Typography,
  Table
} from "@mui/joy";

export default function AllCase() {
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        axiosClient.get("home/user-case/summary")
            .then(({ data }) => setSummary(data))
            .catch(() => alert("ไม่สามารถโหลดข้อมูลได้"));
    }, []);

    return (
        <Sheet
            variant="outlined"
            sx={{
                borderRadius: 'sm',
                overflow: 'auto',
                maxHeight: 490,
                padding: 2
            }}
        >
            <Typography level="h4" mb={2}>ปริมาณงานทั้งหมด</Typography>
            <Table stickyHeader hoverRow>
                <thead>
                    <tr>
                        {/* <th style={{ width: '40px', textAlign: 'center' }}>#</th> */}
                        <th style={{ textAlign: 'left', paddingLeft: '16px' }}>รายการ</th>
                        <th style={{ textAlign: 'center' }}>จำนวน (เคส)</th>
                    </tr>
                </thead>
                <tbody>
                    {summary && [
                        {
                            label: 'ปิดเคสวันนี้',
                            value: summary.todaySuccess,
                        },
                        {
                            label: 'เคสกำลังดำเนินการวันนี้',
                            value: summary.todayProgress,
                        },
                        {
                            label: 'เคสที่ถูกส่งต่อวันนี้',
                            value: summary.todayForwarded,
                        },
                        {
                            label: 'ปิดเคสในสัปดาห์นี้',
                            value: summary.weekSuccess,
                        },
                        {
                            label: 'ปิดเคสในเดือนนี้',
                            value: summary.monthSuccess,
                        }
                    ].map((item, index) => (
                        <tr key={item.label}>
                            {/* <td style={{ textAlign: 'center' }}>{index + 1}</td> */}
                            <td style={{ paddingLeft: '16px' }}>{item.label}</td>
                            <td style={{
                                textAlign: 'center',
                                color: item.color,
                                fontWeight: item.color ? 'bold' : 'normal'
                            }}>
                                {item.value}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Sheet>
    );
}