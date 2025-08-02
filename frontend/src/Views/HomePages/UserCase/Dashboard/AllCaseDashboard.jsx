import { useEffect, useState } from "react";
import axiosClient from "../../../../Axios";
import {
  Box,
  Typography,
  Sheet,
  Card,
  CardContent,
  Grid,
  LinearProgress
} from "@mui/joy";

export default function AllCaseDashboard() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    axiosClient.get("home/user-case/summary")
      .then(({ data }) => setSummary(data))
      .catch(() => alert("โหลดข้อมูลไม่สำเร็จ"));
  }, []);

  const statusColor = (val, good, warn) => {
    if (val === 0) return '#D32F2F';
    if (val <= warn) return '#FB8C00';
    if (val >= good) return '#2E7D32';
    return '#363D42';
  };

  const InfoCard = ({ title, value, color }) => (
    <Card variant="soft" sx={{ minWidth: 200, backgroundColor: color + "22" }}>
      <CardContent>
        <Typography level="title-md" fontWeight="lg">{title}</Typography>
        <Typography level="h3" fontWeight="xl">{value} เคส</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Sheet sx={{ p: 4 }}>
      <Typography level="h4" mb={3}>📊 ปริมาณงานทั้งหมด (Operational Dashboard)</Typography>

      {summary && (
        <Box>
          <Grid container spacing={2}>
            <Grid xs={12} md={4}>
              <InfoCard
                title="ปิดเคสวันนี้"
                value={summary.todaySuccess}
                color={statusColor(summary.todaySuccess, 10, 3)}
              />
            </Grid>
            <Grid xs={12} md={4}>
              <InfoCard
                title="เคสกำลังดำเนินการวันนี้"
                value={summary.todayProgress}
                color={summary.todayProgress > 50 ? '#D32F2F' : '#1976D2'}
              />
            </Grid>
            <Grid xs={12} md={4}>
              <InfoCard
                title="ส่งต่อเคสวันนี้"
                value={summary.todayForwarded}
                color={summary.todayForwarded > 10 ? '#FB8C00' : '#00796B'}
              />
            </Grid>
            <Grid xs={12} md={6}>
              <InfoCard
                title="📅 ปิดเคสในสัปดาห์นี้"
                value={summary.weekSuccess}
                color={statusColor(summary.weekSuccess, 100, 50)}
              />
            </Grid>
            <Grid xs={12} md={6}>
              <InfoCard
                title="📆 ปิดเคสในเดือนนี้"
                value={summary.monthSuccess}
                color={statusColor(summary.monthSuccess, 300, 100)}
              />
            </Grid>
          </Grid>

          {/* Optional: progress bar summary */}
          {/* <Box mt={4}>
            <Typography level="body-md" fontWeight="md" mb={1}>แสดงภาพรวม (bar จำลอง)</Typography>
            <LinearProgress
              determinate
              value={Math.min((summary.todaySuccess / summary.weekSuccess) * 100, 100)}
              color="success"
            />
          </Box> */}
        </Box>
      )}
    </Sheet>
  );
}
