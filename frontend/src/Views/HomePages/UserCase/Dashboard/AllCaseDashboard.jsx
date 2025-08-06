import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../../../Axios";
import {
  Box, Typography, Sheet, Grid, Modal, ModalDialog,
  ModalClose, Divider, useTheme
} from "@mui/joy";

import InfoCard from "./InfoCard";
import TagsTodayModal from "./modals/TagsTodayModal";
import TagsWeekModal from "./modals/TagsWeekModal";
import TagsMonthModal from "./modals/TagsMonthModal";

export default function AllCaseDashboard() {
  const theme = useTheme();
  const [summary, setSummary] = useState(null);

  const [openTags, setOpenTags] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagDate, setTagDate] = useState("");

  const [openWeekTags, setOpenWeekTags] = useState(false);
  const [tagsWeekLoading, setTagsWeekLoading] = useState(false);
  const [tagsWeek, setTagsWeek] = useState([]);
  const [weekRange, setWeekRange] = useState({});

  const [openMonthTags, setOpenMonthTags] = useState(false);
  const [tagsMonthLoading, setTagsMonthLoading] = useState(false);
  const [tagsMonth, setTagsMonth] = useState([]);
  const [monthRange, setMonthRange] = useState({});

  useEffect(() => {
    axiosClient
      .get("home/user-case/summary")
      .then(({ data }) => setSummary(data))
      .catch(() => alert("โหลดข้อมูลไม่สำเร็จ"));
  }, []);

  const statusColor = (val, good, warn) => {
    if (val === 0) return "#D32F2F";
    if (val <= warn) return "#FB8C00";
    if (val >= good) return "#2E7D32";
    return "#363D42";
  };

  const handleOpenTodayTags = () => {
    setOpenTags(true);
    setTagsLoading(true);
    axiosClient
      .get("home/user-case/today-closed-tags")
      .then(({ data }) => {
        setTags(data?.tags ?? []);
        setTagDate(data?.date ?? "");
      })
      .catch(() => alert("โหลดแท็กวันนี้ไม่สำเร็จ"))
      .finally(() => setTagsLoading(false));
  };

  const handleOpenWeekTags = () => {
    setOpenWeekTags(true);
    setTagsWeekLoading(true);
    axiosClient
      .get("home/user-case/week-closed-tags")
      .then(({ data }) => {
        setTagsWeek(data.tags);
        setWeekRange(data.range);
      })
      .catch(() => alert("โหลดแท็กของสัปดาห์นี้ไม่สำเร็จ"))
      .finally(() => setTagsWeekLoading(false));
  };

  const handleOpenMonthTags = () => {
    setOpenMonthTags(true);
    setTagsMonthLoading(true);
    axiosClient
      .get("home/user-case/month-closed-tags")
      .then(({ data }) => {
        setTagsMonth(data.tags);
        setMonthRange(data.range);
      })
      .catch(() => alert("โหลดแท็กของเดือนนี้ไม่สำเร็จ"))
      .finally(() => setTagsMonthLoading(false));
  };

  const totalTags = useMemo(() => tags.reduce((sum, r) => sum + (r.total ?? 0), 0), [tags]);
  const totalWeekTags = useMemo(() => tagsWeek.reduce((sum, r) => sum + (r.total ?? 0), 0), [tagsWeek]);
  const totalMonthTags = useMemo(() => tagsMonth.reduce((sum, r) => sum + (r.total ?? 0), 0), [tagsMonth]);

  return (
    <Sheet sx={{ mt: 3 }}>
      <Typography level="h4" mb={3}>📊 ปริมาณงานทั้งหมด (Operational Dashboard)</Typography>
      {summary && (
        <Box>
          <Grid container spacing={2}>
            <Grid xs={12} sm={6} md={6}>
              <InfoCard
                title="ปิดเคสวันนี้"
                value={summary.todaySuccess}
                color={statusColor(summary.todaySuccess, 10, 3)}
                onClick={handleOpenTodayTags}
              />
            </Grid>
            <Grid xs={12} sm={6} md={6}>
              <InfoCard
                title="เคสกำลังดำเนินการวันนี้"
                value={summary.todayProgress}
                color={summary.todayProgress > 50 ? "#D32F2F" : "#1976D2"}
              />
            </Grid>
            <Grid xs={12} sm={6} md={6}>
              <InfoCard
                title="📅 ปิดเคสในสัปดาห์นี้"
                value={summary.weekSuccess}
                color={statusColor(summary.weekSuccess, 100, 50)}
                onClick={handleOpenWeekTags}
              />
            </Grid>
            <Grid xs={12} sm={6} md={6}>
              <InfoCard
                title="📆 ปิดเคสในเดือนนี้"
                value={summary.monthSuccess}
                color={statusColor(summary.monthSuccess, 300, 100)}
                onClick={handleOpenMonthTags}
              />
            </Grid>
          </Grid>
        </Box>
      )}

      <TagsTodayModal open={openTags} onClose={() => setOpenTags(false)} data={tags} loading={tagsLoading} total={totalTags} date={tagDate} />
      <TagsWeekModal open={openWeekTags} onClose={() => setOpenWeekTags(false)} data={tagsWeek} loading={tagsWeekLoading} total={totalWeekTags} range={weekRange} />
      <TagsMonthModal open={openMonthTags} onClose={() => setOpenMonthTags(false)} data={tagsMonth} loading={tagsMonthLoading} total={totalMonthTags} range={monthRange} />
    </Sheet>
  );
}
