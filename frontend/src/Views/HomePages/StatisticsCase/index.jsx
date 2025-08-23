import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../../Axios";
import { Box, Typography, CircularProgress, Modal, ModalDialog } from "@mui/joy";
import dayjs from "dayjs";

import FilterBar from "./FilterBar";
import StatCards, { QuickSummary } from "./StatCards";
import RangeModal from "./RangeModal";
import AfterHourModal from "./AfterHourModal";

import EmployeeWorkloadTable from "../Reports/EmployeeWorkloadTable";
import TagWorkloadTable from "../Reports/TagWorkloadTable";
import EmployeeCaseDetailModal from "../Reports/EmployeeCaseDetailModal";
import TagCaseDetailModal from "../Reports/TagCaseDetailModal";

import { bucketsToKeyed, downloadExcel, valueDisplay } from "./helpers";
import AfterHourListModal from "./AfterHourListModal";
import InProgressListModal from "./InProgressListModal";

export default function StatisticsCase() {
    const [today] = useState(dayjs().format("YYYY-MM-DD"));

    const [todayStats, setTodayStats] = useState(null);
    const [afterHourStats, setAfterHourStats] = useState(null);
    const [progressInOut, setProgressInOut] = useState({ in_time: 0, out_time: 0, total: 0 });
    const [pendingTotal, setPendingTotal] = useState(0);

    const [rangeStats, setRangeStats] = useState([]);
    const [afterHourRangeStats, setAfterHourRangeStats] = useState([]);

    const [ahList, setAhList] = useState([]);
    const [ahLoading, setAhLoading] = useState(false);
    const [ahPage, setAhPage] = useState(1);
    const [ahPerPage, setAhPerPage] = useState(50);
    const [ahTotal, setAhTotal] = useState(0);
    const [ahBucket, setAhBucket] = useState("");

    const [ihList, setIhList] = useState([]);
    const [ihLoading, setIhLoading] = useState(false);
    const [ihPage, setIhPage] = useState(1);
    const [ihPerPage, setIhPerPage] = useState(50);
    const [ihTotal, setIhTotal] = useState(0);
    const [ihBucket, setIhBucket] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [showAfterHourListModal, setShowAfterHourListModal] = useState(false);
    const [showInHourListModal, setShowInHourListModal] = useState(false);
    const [showAfterHourModal, setShowAfterHourModal] = useState(false);
    const [exporting, setExporting] = useState(false);

    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [afterHourStartDate, setAfterHourStartDate] = useState(today);
    const [afterHourEndDate, setAfterHourEndDate] = useState(today);

    const [inHourStartDate, setInHourStartDate] = useState(today);
    const [inHourEndDate, setInHourEndDate] = useState(today);
    const [progStartDate, setProgStartDate] = useState(today);
    const [progEndDate, setProgEndDate] = useState(today);

    const [filterPlatform, setFilterPlatform] = useState("");
    const [filterDept, setFilterDept] = useState("");
    const [filterEmp, setFilterEmp] = useState("");

    const [platformOptions, setPlatformOptions] = useState([]);
    const [deptOptions, setDeptOptions] = useState([]);
    const [empOptions, setEmpOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [employeeStats, setEmployeeStats] = useState([]);
    const [tagStats, setTagStats] = useState([]);

    const [openEmpModal, setOpenEmpModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [empCaseRows, setEmpCaseRows] = useState([]);

    const [openTagModal, setOpenTagModal] = useState(false);
    const [selectedTag, setSelectedTag] = useState(null);
    const [tagCaseRows, setTagCaseRows] = useState([]);

    const [showProgInModal, setShowProgInModal] = useState(false);
    const [showProgModal, setShowProgModal] = useState(false);

    const [progList, setProgList] = useState([]);
    const [progLoading, setProgLoading] = useState(false);
    const [progPage, setProgPage] = useState(1);
    const [progPerPage, setProgPerPage] = useState(50);
    const [progTotal, setProgTotal] = useState(0);
    const [progHours, setProgHours] = useState("in");
    const isRangeMode = !!(startDate && endDate) && !(startDate === today && endDate === today);

    const selectedRange = isRangeMode ? { s: startDate, e: endDate } : { s: today, e: today };

    const fetchProgressList = async ({
        s = progStartDate,
        e = progEndDate,
        page = progPage,
        perPage = progPerPage,
        hours = progHours, // in/out/all
    } = {}) => {
        const params = {
            start_date: s,
            end_date: e,
            page,
            per_page: perPage,
            hours,
            platform_id: filterPlatform || undefined,
            dept: filterDept || undefined,
            empCode: filterEmp || undefined,
        };
        try {
            setProgLoading(true);
            const { data } = await axiosClient.get("home/user-case/in-progress-cases", { params });
            setProgList(data?.data || []);
            setProgTotal(data?.pagination?.total || 0);
        } catch (e) {
            console.error("❌ in-progress-cases error:", e);
            setProgList([]);
            setProgTotal(0);
        } finally {
            setProgLoading(false);
        }
    };

    const openProgressInToday = async () => {
        setProgHours("in");
        setProgPage(1);
        setProgStartDate(selectedRange.s);
        setProgEndDate(selectedRange.e);
        await fetchProgressList({ s: selectedRange.s, e: selectedRange.e, page: 1, hours: "in" });
        setShowProgModal(true);
    };

    const openProgressOutToday = async () => {
        setProgHours("out");
        setProgPage(1);
        setProgStartDate(selectedRange.s);
        setProgEndDate(selectedRange.e);
        await fetchProgressList({ s: selectedRange.s, e: selectedRange.e, page: 1, hours: "out" });
        setShowProgModal(true);
    };

    useEffect(() => {
        setIsLoading(true);
        (async () => {
            const [p1, p2, p3] = await Promise.allSettled([
                axiosClient.get("home/user-case/options/platforms"),
                axiosClient.get("home/user-case/options/departments"),
                axiosClient.get("home/user-case/options/employees", { params: { dept: "" } }),
            ]);
            const asArray = (d) => (Array.isArray(d) ? d : d?.options ?? []);
            if (p1.status === "fulfilled") setPlatformOptions(asArray(p1.value.data)); else setPlatformOptions([]);
            if (p2.status === "fulfilled") setDeptOptions(asArray(p2.value.data)); else setDeptOptions([]);
            if (p3.status === "fulfilled") setEmpOptions(asArray(p3.value.data)); else setEmpOptions([]);
            setIsLoading(false);
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await axiosClient.get("home/user-case/options/employees", {
                    params: { dept: filterDept || "" },
                });
                const asArray = (d) => (Array.isArray(d) ? d : d?.options ?? []);
                const list = asArray(data);
                setEmpOptions(list);
                if (filterEmp && !list.some((e) => e.value === filterEmp)) setFilterEmp("");
            } catch (e) {
                console.error("reload employees failed", e);
            }
        })();
    }, [filterDept]);

    useEffect(() => {
        const baseParams = {
            platform_id: filterPlatform || undefined,
            dept: filterDept || undefined,
            empCode: filterEmp || undefined,
        };
        const rangeMode = !!(startDate && endDate) && !(startDate === today && endDate === today);
        const rangeParams = rangeMode
            ? {
                start_date: dayjs(startDate).format("YYYY-MM-DD"),
                end_date: dayjs(endDate).format("YYYY-MM-DD"),
            }
            : null;

        const loadClosureSummary = rangeParams
            ? axiosClient
                .get("home/user-case/closure-range-stats", { params: { ...baseParams, ...rangeParams } })
                .then(({ data }) => {
                    const rows = Array.isArray(data?.data)
                        ? data.data
                        : (data?.current ? [{ date: rangeParams.start_date, buckets: data.current }] : []);
                    const agg = rows.reduce((acc, dayRow) => {
                        const { inMap, outMap } = bucketsToKeyed(dayRow?.buckets || []);
                        Object.entries(inMap || {}).forEach(([k, v]) => acc.in[k] = (acc.in[k] || 0) + (v || 0));
                        Object.entries(outMap || {}).forEach(([k, v]) => acc.out[k] = (acc.out[k] || 0) + (v || 0));
                        return acc;
                    }, { in: {}, out: {} });
                    setTodayStats(agg.in);
                    setAfterHourStats(agg.out);
                })
            : axiosClient
                .get("home/user-case/closure-stats", { params: { date: today, ...baseParams } })
                .then(({ data }) => {
                    const { inMap, outMap } = bucketsToKeyed(data.current || []);
                    setTodayStats(inMap);
                    setAfterHourStats(outMap);
                });

        const loadInProgress = rangeParams
            ? Promise.all([
                axiosClient.get("home/user-case/in-progress-cases", { params: { ...baseParams, ...rangeParams, hours: "in", per_page: 1 } }),
                axiosClient.get("home/user-case/in-progress-cases", { params: { ...baseParams, ...rangeParams, hours: "out", per_page: 1 } }),
            ]).then(([inRes, outRes]) => {
                const inTotal = inRes?.data?.pagination?.total ?? 0;
                const outTotal = outRes?.data?.pagination?.total ?? 0;
                setProgressInOut({ in_time: inTotal, out_time: outTotal, total: inTotal + outTotal });
            })
            : axiosClient
                .get("home/user-case/in-progress-business-hours", { params: { today_only: 1, ...baseParams } })
                .then(({ data }) => setProgressInOut({
                    in_time: data.in_time ?? 0,
                    out_time: data.out_time ?? 0,
                    total: data.total ?? 0,
                }));

        // รอรับ (Pending)
        const loadPending = rangeParams
            ? axiosClient
                .get("home/user-case/pending-cases", { params: { ...baseParams, ...rangeParams, per_page: 1 } })
                .then(({ data }) => setPendingTotal(data?.pagination?.total ?? 0))
            : axiosClient
                .get("home/user-case/pending-today", { params: baseParams })
                .then(({ data }) => setPendingTotal(data?.total ?? 0));

        const loadEmployee = axiosClient
            .get("home/user-case/employee", { params: { ...baseParams, ...(rangeParams || {}) } })
            .then(({ data }) => {
                const rows = (data.data || []).map((item) => ({
                    name: item.name,
                    empCode: item.empCode,
                    percent: item.percentage,
                    total: item.total,
                    min1to5: item.one_to_five_min,
                    min5to10: item.five_to_ten_min,
                    over10: item.over_ten_min,
                    inProgress: item.in_progress,
                    onClickDetail: async (row) => {
                        setSelectedUser(row);
                        try {
                            const { data } = await axiosClient.get(
                                `/home/user-case/employee/${row.empCode}/cases`,
                                { params: { ...baseParams, ...(rangeParams || {}), statuses: 'success' } }
                            );
                            const rows = (data.cases || []).map((c) => ({
                                conversation_id: c.conversation_id,
                                status_name: c.status_name,
                                customer_name: c.customer_name,
                                room_name: c.room_id ?? "-",
                                start_time: dayjs(c.started_at).format("DD/MM/YYYY HH:mm"),
                                accept_time: c.accepted_at ? dayjs(c.accepted_at).format("DD/MM/YYYY HH:mm") : "-",
                                end_time: c.closed_at ? dayjs(c.closed_at).format("DD/MM/YYYY HH:mm") : "-",
                                tag_name: c.tag_name,
                                custId: c.custId,
                            }));
                            setEmpCaseRows(rows);
                            setOpenEmpModal(true);
                        } catch (err) {
                            console.error("❌ Load all user cases failed", err);
                        }
                    },
                }));
                setEmployeeStats(rows);
            })
            .catch((err) => console.error("❌ employeeWorkloadSummary error:", err));

        const loadTag = axiosClient
            .get("home/user-case/tag-workload", { params: { ...baseParams, ...(rangeParams || {}) } })
            .then(({ data }) => {
                const rows = (data.data || []).map((item) => ({
                    tag: item.tag,
                    percent: item.percent,
                    total: item.total,
                    min1to5: item.one_to_five_min,
                    min5to10: item.five_to_ten_min,
                    over10: item.over_ten_min,
                    onClickDetail: async (row) => {
                        try {
                            const { data } = await axiosClient.get(`/home/user-case/tag/${encodeURIComponent(row.tag)}/cases`, { params: { ...baseParams, ...(rangeParams || {}) } });
                            const rows = (data.cases || []).map((c) => ({
                                customer_name: c.customer_name,
                                room_id: c.room_id ?? "-",
                                start_time: dayjs(c.started_at).format("DD/MM/YYYY HH:mm"),
                                accept_time: c.accepted_at ? dayjs(c.accepted_at).format("DD/MM/YYYY HH:mm") : "-",
                                end_time: c.closed_at ? dayjs(c.closed_at).format("DD/MM/YYYY HH:mm") : "-",
                                employee_name: c.employee_name ?? "-",
                                custId: c.custId,
                            }));
                            setSelectedTag(row.tag);
                            setTagCaseRows(rows);
                            setOpenTagModal(true);
                        } catch (err) {
                            console.error("❌ Load tag cases failed", err);
                        }
                    },
                }));
                setTagStats(rows);
            })
            .catch((err) => console.error("❌ tagWorkloadSummary error:", err));

        Promise.all([loadClosureSummary, loadInProgress, loadPending, loadEmployee, loadTag]).catch(() => { });
    }, [today, filterPlatform, filterDept, filterEmp, startDate, endDate]);

    const todayWithPending = todayStats ? { ...todayStats, pending: pendingTotal } : null;
    const showFilterInfoAlert = !!(filterPlatform || filterDept || filterEmp);

    const summaryLabel = isRangeMode
        ? `📊 สรุปช่วง: ${dayjs(startDate).format("DD/MM/YYYY")} - ${dayjs(endDate).format("DD/MM/YYYY")}:`
        : "📊 สรุปวันนี้:";

    const onExportDetailed = () =>
        downloadExcel(axiosClient, "home/user-case/export/detailed-cases.xlsx", {
            start_date: startDate,
            end_date: endDate,
            platform_id: filterPlatform || undefined,
            dept: filterDept || undefined,
            empCode: filterEmp || undefined,
        }, { onStart: () => setExporting(true), onDone: () => setExporting(false) });

    const afterHourCount = afterHourStats?.total ?? 0;
    const inHourCount = todayStats?.total ?? 0;
    const fetchAfterHourList = async ({
        s = afterHourStartDate,
        e = afterHourEndDate,
        page = ahPage,
        perPage = ahPerPage,
        bucket = ahBucket,
    } = {}) => {
        const params = {
            start_date: s,
            end_date: e,
            page,
            per_page: perPage,
            bucket: bucket || undefined,
            platform_id: filterPlatform || undefined,
            dept: filterDept || undefined,
            empCode: filterEmp || undefined,
        };
        try {
            setAhLoading(true);
            const { data } = await axiosClient.get("home/user-case/after-hour-closed-cases", { params });
            setAhList(data?.data || []);
            setAhTotal(data?.pagination?.total || 0);
        } catch (e) {
            console.error("❌ after-hour-closed-cases error:", e);
            setAhList([]);
            setAhTotal(0);
        } finally {
            setAhLoading(false);
        }
    };

    const openAfterHourTodayList = async () => {
        const { s, e } = selectedRange;
        setAfterHourStartDate(s);
        setAfterHourEndDate(e);
        setAhPage(1);
        await fetchAfterHourList({ s, e, page: 1 });
        setShowAfterHourListModal(true);
    };

    const fetchInHourList = async ({
        s = inHourStartDate,
        e = inHourEndDate,
        page = ihPage,
        perPage = ihPerPage,
        bucket = ihBucket,
    } = {}) => {
        const params = {
            start_date: s,
            end_date: e,
            page,
            per_page: perPage,
            bucket: bucket || undefined,
            platform_id: filterPlatform || undefined,
            dept: filterDept || undefined,
            empCode: filterEmp || undefined,
        };
        try {
            setIhLoading(true);
            const { data } = await axiosClient.get("home/user-case/in-hour-closed-cases", { params });
            setIhList(data?.data || []);
            setIhTotal(data?.pagination?.total || 0);
        } catch (e) {
            console.error("❌ in-hour-closed-cases error:", e);
            setIhList([]);
            setIhTotal(0);
        } finally {
            setIhLoading(false);
        }
    };

    const openInHourTodayList = async () => {
        const { s, e } = selectedRange;
        setInHourStartDate(s);
        setInHourEndDate(e);
        setIhPage(1);
        await fetchInHourList({ s, e, page: 1 });
        setShowInHourListModal(true);
    };

    return (
        <Box sx={{ p: 0, pt: 0 }}>
            <Typography level="h2" mb={2}>📊 สถิติการปิดเคส </Typography>

            <FilterBar
                isLoading={isLoading}
                platformOptions={platformOptions}
                deptOptions={deptOptions}
                empOptions={empOptions}
                filterPlatform={filterPlatform} setFilterPlatform={setFilterPlatform}
                filterDept={filterDept} setFilterDept={setFilterDept}
                filterEmp={filterEmp} setFilterEmp={setFilterEmp}
                startDate={startDate} setStartDate={setStartDate}
                endDate={endDate} setEndDate={setEndDate}
                exporting={exporting}
                onExportDetailed={onExportDetailed}
                onOpenBusinessModal={() => setShowModal(true)}
                onOpenAfterHourModal={() => setShowAfterHourModal(true)}
            />

            <QuickSummary
                summaryLabel={summaryLabel}
                todayWithPending={todayWithPending}
                progressInOut={progressInOut}
                pendingTotal={pendingTotal}
                afterHourCount={afterHourCount}
                onClickAfterHourToday={openAfterHourTodayList}
                inHourCount={inHourCount}
                onClickInHourToday={openInHourTodayList}
                onClickProgressInHourToday={openProgressInToday}
                onClickProgressAfterHourToday={openProgressOutToday}
            />

            {!todayWithPending || !afterHourStats ? (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", my: 4 }}>
                    <CircularProgress size="lg" />
                    <Typography level="body-sm" color="neutral" sx={{ mt: 2 }}>
                        กำลังโหลดข้อมูล...
                    </Typography>
                </Box>
            ) : (
                <StatCards
                    data={{ ...todayWithPending, in_progress: progressInOut.in_time }}
                    afterHourData={{ ...afterHourStats, in_progress: progressInOut.out_time }}
                    showFilterInfoAlert={showFilterInfoAlert}
                />
            )}

            <RangeModal
                open={showModal}
                onClose={() => setShowModal(false)}
                startDate={startDate} setStartDate={setStartDate}
                endDate={endDate} setEndDate={setEndDate}
                exporting={exporting} setExporting={setExporting}
                axiosClient={axiosClient}
                rows={rangeStats} setRows={setRangeStats}
                baseParams={{
                    platform_id: filterPlatform || undefined,
                    dept: filterDept || undefined,
                    empCode: filterEmp || undefined,
                }}
            />

            <AfterHourModal
                open={showAfterHourModal}
                onClose={() => setShowAfterHourModal(false)}
                startDate={afterHourStartDate} setStartDate={setAfterHourStartDate}
                endDate={afterHourEndDate} setEndDate={setAfterHourEndDate}
                rows={afterHourRangeStats} setRows={setAfterHourRangeStats}
                axiosClient={axiosClient}
                baseParams={{
                    platform_id: filterPlatform || undefined,
                    dept: filterDept || undefined,
                    empCode: filterEmp || undefined,
                }}
            />

            <AfterHourListModal
                open={showAfterHourListModal}
                onClose={() => setShowAfterHourListModal(false)}
                title="🌙 รายการเคสที่รับเรื่อง “นอกเวลาทำการ”"
                startDate={afterHourStartDate}
                endDate={afterHourEndDate}
                platformId={filterPlatform || undefined}
                dept={filterDept || undefined}
                empCode={filterEmp || undefined}
                rows={ahList}
                loading={ahLoading}
                page={ahPage}
                perPage={ahPerPage}
                total={ahTotal}
                bucket={ahBucket}
                setBucket={setAhBucket}
                onRefresh={() => fetchAfterHourList()}
                onChangePage={(p) => { setAhPage(p); fetchAfterHourList({ page: p }); }}
                onChangePerPage={(pp) => { setAhPerPage(pp); setAhPage(1); fetchAfterHourList({ page: 1, perPage: pp }); }}
            />

            <AfterHourListModal
                open={showInHourListModal}
                onClose={() => setShowInHourListModal(false)}
                title="☀️ รายการเคสที่ปิด “ในเวลาทำการ”"
                startDate={inHourStartDate}
                endDate={inHourEndDate}
                platformId={filterPlatform || undefined}
                dept={filterDept || undefined}
                empCode={filterEmp || undefined}
                rows={ihList}
                loading={ihLoading}
                page={ihPage}
                perPage={ihPerPage}
                total={ihTotal}
                bucket={ihBucket}
                setBucket={setIhBucket}
                onRefresh={() => fetchInHourList()}
                onChangePage={(p) => { setIhPage(p); fetchInHourList({ page: p }); }}
                onChangePerPage={(pp) => { setIhPerPage(pp); setIhPage(1); fetchInHourList({ page: 1, perPage: pp }); }}
            />

            <InProgressListModal
                open={showProgModal}
                onClose={() => setShowProgModal(false)}
                title="🛠️ กำลังดำเนินการ"
                rows={progList}
                loading={progLoading}
                page={progPage}
                perPage={progPerPage}
                startDate={progStartDate}
                endDate={progEndDate}
                setHours={(h) => { setProgHours(h); setProgPage(1); fetchProgressList({ page: 1, hours: h }); }}
                onChangePage={(p) => { setProgPage(p); fetchProgressList({ page: p }); }}
                onChangePerPage={(pp) => { setProgPerPage(pp); setProgPage(1); fetchProgressList({ page: 1, perPage: pp }); }}
            />

            <Modal open={exporting}>
                <ModalDialog sx={{ p: 3, width: 360, textAlign: "center" }}>
                    <CircularProgress size="lg" />
                    <Typography level="title-md" sx={{ mt: 2 }}>
                        กำลังสร้างไฟล์ Excel...
                    </Typography>
                    <Typography level="body-sm" color="neutral" sx={{ mt: 1 }}>
                        โปรดรอสักครู่ ขนาดข้อมูลมีผลต่อระยะเวลา
                    </Typography>
                </ModalDialog>
            </Modal>
            <EmployeeWorkloadTable rows={employeeStats} />
            <TagWorkloadTable rows={tagStats} />
            <EmployeeCaseDetailModal
                open={openEmpModal}
                onClose={() => setOpenEmpModal(false)}
                user={selectedUser}
                rows={empCaseRows}
                startDate={isRangeMode ? startDate : undefined}
                endDate={isRangeMode ? endDate : undefined}
            />
            <TagCaseDetailModal
                open={openTagModal}
                onClose={() => setOpenTagModal(false)}
                tag={selectedTag}
                rows={tagCaseRows}
                startDate={isRangeMode ? startDate : undefined}
                endDate={isRangeMode ? endDate : undefined}
            />
        </Box>
    );
}
