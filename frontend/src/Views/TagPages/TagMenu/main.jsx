// src/Views/TagPages/TagPage.jsx
import { ChatPageStyle } from "../../../styles/ChatPageStyle.js";
import {
    Box,
    Sheet,
    Typography,
    Button,
    CircularProgress,
    Table,
    Input,
    Select,
    Option,
    Checkbox,
    Stack,
    Chip,
    IconButton,
    FormControl,
    FormLabel,
} from "@mui/joy";
import { useEffect, useMemo, useState } from "react";
import BreadcrumbsComponent from "../../../Components/Breadcrumbs.jsx";
import {
    deleteTagApi,
    listTagsApi,
    restoreTagApi,
    forceDeleteTagApi,
} from "../../../Api/Tags.js";
import RestoreRounded from "@mui/icons-material/RestoreRounded";
import DeleteForeverRounded from "@mui/icons-material/DeleteForeverRounded";
import { AlertDiaLog } from "../../../Dialogs/Alert.js";
import { convertFullDate } from "../../../Components/Options.jsx";
import { useNavigate } from "react-router-dom";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import DeleteRounded from "@mui/icons-material/DeleteRounded";
import FilterAltRounded from "@mui/icons-material/FilterAltRounded";
import ClearAllRounded from "@mui/icons-material/ClearAllRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";

const BreadcrumbsPath = [{ name: "จัดการ Tag การสนทนา" }, { name: "รายละเอียด" }];

// === Small UI helpers ===
function RequireNoteChip({ value }) {
    const isTrue = !!value;
    return (
        <Chip
            size="sm"
            variant="soft"
            color={isTrue ? "danger" : "neutral"}
            startDecorator={isTrue ? "●" : "○"}
            sx={{ fontWeight: 600, minWidth: 96, justifyContent: "center" }}
        >
            {isTrue ? "ต้องมีบันทึก" : "ไม่ต้องมี"}
        </Chip>
    );
}

function GroupChip({ groupId }) {
    if (!groupId)
        return (
            <Typography level="body-sm" sx={{ color: "neutral.500" }}>
                -
            </Typography>
        );
    return (
        <Chip size="sm" variant="outlined" color="primary" sx={{ fontWeight: 600 }}>
            Group: {groupId}
        </Chip>
    );
}

export default function TagPage() {
    const navigate = useNavigate();

    // data states
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);

    // selection states
    const [selectedRows, setSelectedRows] = useState([]); // array of ids (number)

    // filter states
    const [filterName, setFilterName] = useState("");
    const [filterGroup, setFilterGroup] = useState("");
    const [filterCreatedBy, setFilterCreatedBy] = useState("");
    const [filterUpdatedBy, setFilterUpdatedBy] = useState("");
    const [filterRequireNote, setFilterRequireNote] = useState(""); // '', 'true', 'false'
    const [filterStatus, setFilterStatus] = useState(""); // '', 'active', 'deleted'

    useEffect(() => {
        fetchData().finally(() => setLoading(false));
    }, []);

    const fetchData = async () => {
        const { data, status } = await listTagsApi({ with_trashed: 1 });
        if (status === 200) setTags(data.list || []);
    };

    // client-side filter
    const filtered = useMemo(() => {
        return (tags || []).filter((t) => {
            const byName = filterName
                ? (t.tagName || "").toLowerCase().includes(filterName.toLowerCase())
                : true;

            const byGroup = filterGroup
                ? String(t.group_id || "").toLowerCase().includes(filterGroup.toLowerCase())
                : true;

            const createdDisplay = String(
                t.created_by_name || t.created_by_user_id || ""
            ).toLowerCase();
            const updatedDisplay = String(
                t.updated_by_name || t.updated_by_user_id || ""
            ).toLowerCase();

            const byCreated = filterCreatedBy
                ? createdDisplay.includes(filterCreatedBy.toLowerCase())
                : true;

            const byUpdated = filterUpdatedBy
                ? updatedDisplay.includes(filterUpdatedBy.toLowerCase())
                : true;

            const byRequire =
                filterRequireNote === ""
                    ? true
                    : filterRequireNote === "true"
                        ? !!t.require_note
                        : !t.require_note;

            const byStatus =
                filterStatus === ""
                    ? true
                    : filterStatus === "active"
                        ? !t.deleted_at
                        : !!t.deleted_at;

            return byName && byGroup && byCreated && byUpdated && byRequire && byStatus;
        });
    }, [
        tags,
        filterName,
        filterGroup,
        filterCreatedBy,
        filterUpdatedBy,
        filterRequireNote,
        filterStatus,
    ]);

    // ✅ อ้างอิง filtered หลังนิยามแล้วเท่านั้น
    const selectedTags = useMemo(
        () => filtered.filter((t) => selectedRows.includes(t.id)),
        [filtered, selectedRows]
    );
    const hasActiveSelected = useMemo(
        () => selectedTags.some((t) => !t.deleted_at),
        [selectedTags]
    );
    const hasDeletedSelected = useMemo(
        () => selectedTags.some((t) => !!t.deleted_at),
        [selectedTags]
    );

    const toggleSelectAll = (checked) => {
        setSelectedRows(checked ? filtered.map((r) => r.id) : []);
    };

    const toggleSelect = (id, checked) => {
        setSelectedRows((prev) =>
            checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)
        );
    };

    const onDelete = (ids) => {
        if (!ids?.length) return;
        AlertDiaLog({
            icon: "question",
            title: "ยืนยันการลบ Tag",
            text: `ต้องการลบ ${ids.length} รายการหรือไม่?`,
            onPassed: async (confirm) => {
                if (!confirm) return;
                let okCount = 0;
                for (const id of ids) {
                    const { status } = await deleteTagApi({ id });
                    if (status === 200) okCount++;
                }
                AlertDiaLog({
                    icon: "success",
                    title: "ผลการลบ",
                    text: `ลบสำเร็จ ${okCount}/${ids.length} รายการ`,
                    onPassed: async () => {
                        await fetchData();
                        setSelectedRows([]);
                    },
                });
            },
        });
    };

    const onRestore = (ids) => {
        if (!ids?.length) return;
        AlertDiaLog({
            icon: "question",
            title: "ยืนยันการกู้คืนแท็ก",
            text: `ต้องการกู้คืน ${ids.length} รายการหรือไม่?`,
            onPassed: async (confirm) => {
                if (!confirm) return;
                let okCount = 0;
                for (const id of ids) {
                    const { status } = await restoreTagApi(id);
                    if (status === 200) okCount++;
                }
                AlertDiaLog({
                    icon: "success",
                    title: "ผลการกู้คืน",
                    text: `กู้คืนสำเร็จ ${okCount}/${ids.length} รายการ`,
                    onPassed: async () => {
                        await fetchData();
                        setSelectedRows([]);
                    },
                });
            },
        });
    };

    const onForceDelete = (ids) => {
        if (!ids?.length) return;
        AlertDiaLog({
            icon: "question",
            title: "ยืนยันการลบถาวร",
            text: `ต้องการลบถาวร ${ids.length} รายการหรือไม่? การดำเนินการนี้ไม่สามารถกู้คืนได้`,
            onPassed: async (confirm) => {
                if (!confirm) return;
                let okCount = 0;
                for (const id of ids) {
                    const { status } = await forceDeleteTagApi(id);
                    if (status === 200) okCount++;
                }
                AlertDiaLog({
                    icon: "success",
                    title: "ผลการลบถาวร",
                    text: `ลบถาวรสำเร็จ ${okCount}/${ids.length} รายการ`,
                    onPassed: async () => {
                        await fetchData();
                        setSelectedRows([]);
                    },
                });
            },
        });
    };

    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                </Box>

                {/* Header */}
                <Box sx={[ChatPageStyle.BoxTable, { alignItems: "center", gap: 1 }]}>
                    <Box sx={{ flex: 1 }}>
                        <Typography level="h2" component="h1">
                            จัดการ Tag การสนทนา
                        </Typography>
                        <Typography level="body-sm" sx={{ color: "neutral.500" }}>
                            ทั้งหมด {tags.length} รายการ • แสดง {filtered.length} รายการหลังกรอง
                        </Typography>
                    </Box>
                    <IconButton variant="outlined" color="neutral" onClick={fetchData}>
                        <RefreshRounded />
                    </IconButton>
                </Box>

                {/* Filter Card */}
                <Sheet
                    variant="outlined"
                    sx={{
                        mb: 1.5,
                        p: 0,
                        borderRadius: "lg",
                        borderColor: "divider",
                        overflow: "visible",  // เปลี่ยนจาก "hidden" เป็น "visible"
                        minHeight: "auto"     // เพิ่ม minHeight
                    }}
                >
                    {/* Header */}
                    <Box
                        sx={{
                            px: 2,
                            py: 1.1,
                            bgcolor: "neutral.softBg",
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        <FilterAltRounded />
                        <Typography level="title-sm">ตัวกรอง</Typography>
                    </Box>

                    {/* Filter Content */}
                    <Box sx={{
                        px: 1.5,
                        py: 1.5,           // เพิ่ม padding
                        overflowX: "auto",
                        minHeight: 60      // กำหนด minHeight ชัดเจน
                    }}>
                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "nowrap",
                                alignItems: "flex-end",  // เปลี่ยนจาก "end" เป็น "flex-end"
                                gap: 1.5,               // เพิ่ม gap
                                minWidth: 1260,
                                height: "auto",         // เพิ่ม height auto
                            }}
                        >
                            {/* ค้นหาชื่อแท็ก */}
                            <Box sx={{ minWidth: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
                                <Typography level="body-sm" sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
                                    ค้นหาชื่อแท็ก
                                </Typography>
                                <Input
                                    size="sm"
                                    value={filterName}
                                    onChange={(e) => setFilterName(e.target.value)}
                                    placeholder="เช่น ปิดงาน, โอนต่อ…"
                                    startDecorator={<SearchRounded />}
                                    sx={{ minHeight: 32 }}
                                />
                            </Box>

                            {/* Group */}
                            <Box sx={{ minWidth: 180, flexShrink: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
                                <Typography level="body-sm" sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
                                    Group
                                </Typography>
                                <Input
                                    size="sm"
                                    value={filterGroup}
                                    onChange={(e) => setFilterGroup(e.target.value)}
                                    placeholder="เช่น A / B หรือรหัสกลุ่ม"
                                    sx={{ minHeight: 32 }}
                                />
                            </Box>

                            {/* Created By */}
                            <Box sx={{ minWidth: 180, flexShrink: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
                                <Typography level="body-sm" sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
                                    Created By
                                </Typography>
                                <Input
                                    size="sm"
                                    value={filterCreatedBy}
                                    onChange={(e) => setFilterCreatedBy(e.target.value)}
                                    placeholder="ชื่อผู้สร้าง"
                                    sx={{ minHeight: 32 }}
                                />
                            </Box>

                            {/* Updated By */}
                            <Box sx={{ minWidth: 180, flexShrink: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
                                <Typography level="body-sm" sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
                                    Updated By
                                </Typography>
                                <Input
                                    size="sm"
                                    value={filterUpdatedBy}
                                    onChange={(e) => setFilterUpdatedBy(e.target.value)}
                                    placeholder="ชื่อผู้แก้ไข"
                                    sx={{ minHeight: 32 }}
                                />
                            </Box>

                            {/* Require Note */}
                            <Box sx={{ minWidth: 160, flexShrink: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
                                <Typography level="body-sm" sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
                                    Require Note
                                </Typography>
                                <Select
                                    size="sm"
                                    value={filterRequireNote}
                                    onChange={(_, v) => setFilterRequireNote(v ?? "")}
                                    sx={{ minHeight: 32 }}
                                >
                                    <Option value="">ทั้งหมด</Option>
                                    <Option value="true">ต้องมีบันทึก</Option>
                                    <Option value="false">ไม่ต้องมี</Option>
                                </Select>
                            </Box>

                            {/* สถานะ */}
                            <Box sx={{ minWidth: 160, flexShrink: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
                                <Typography level="body-sm" sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
                                    สถานะ
                                </Typography>
                                <Select
                                    size="sm"
                                    value={filterStatus}
                                    onChange={(_, v) => setFilterStatus(v ?? "")}
                                    sx={{ minHeight: 32 }}
                                >
                                    <Option value="">ทั้งหมด</Option>
                                    <Option value="active">ใช้งาน</Option>
                                    <Option value="deleted">ลบแล้ว</Option>
                                </Select>
                            </Box>

                            {/* Spacer */}
                            <Box sx={{ flex: 1, minWidth: 20 }} />

                            {/* Action Buttons */}
                            <Box sx={{
                                display: "flex",
                                gap: 1,
                                flexShrink: 0,
                                alignItems: "flex-end",
                                height: "fit-content"
                            }}>
                                <Button
                                    variant="outlined"
                                    color="neutral"
                                    size="sm"
                                    startDecorator={<ClearAllRounded />}
                                    onClick={() => {
                                        setFilterName("");
                                        setFilterGroup("");
                                        setFilterCreatedBy("");
                                        setFilterUpdatedBy("");
                                        setFilterRequireNote("");
                                        setFilterStatus("");
                                    }}
                                    sx={{ minHeight: 32, whiteSpace: "nowrap" }}
                                >
                                    ล้างตัวกรอง
                                </Button>

                                <Button
                                    size="sm"
                                    startDecorator={<RefreshRounded />}
                                    onClick={fetchData}
                                    sx={{ minHeight: 32, whiteSpace: "nowrap" }}
                                >
                                    รีเฟรช
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Sheet>

                {/* Action Bar */}
                <Sheet
                    variant="soft"
                    sx={{
                        mb: 1.5,
                        p: 1,
                        borderRadius: "lg",
                        display: "flex",
                        gap: 1,
                        alignItems: "center",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                    }}
                >
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Button
                            variant="solid"
                            color="primary"
                            startDecorator={<AddRounded />}
                            onClick={() => navigate("/tags/create")}
                        >
                            สร้างแท็ก
                        </Button>

                        <Button
                            variant="soft"
                            color="warning"
                            startDecorator={<EditRounded />}
                            disabled={selectedRows.length !== 1}
                            onClick={() => {
                                const tag = filtered.find((r) => r.id === selectedRows[0]);
                                if (!tag) return;
                                navigate(`/tags/${tag.id}/edit`, { state: { tag } });
                            }}
                        >
                            แก้ไข
                        </Button>

                        <Button
                            variant="solid"
                            color="danger"
                            startDecorator={<DeleteRounded />}
                            disabled={selectedRows.length === 0 || !hasActiveSelected}
                            onClick={() =>
                                onDelete(
                                    selectedRows.filter((id) => {
                                        const tag = filtered.find((t) => t.id === id);
                                        return tag && !tag.deleted_at;
                                    })
                                )
                            }
                        >
                            ลบแท็ก
                        </Button>

                        <Button
                            variant="solid"
                            color="success"
                            startDecorator={<RestoreRounded />}
                            disabled={selectedRows.length === 0 || !hasDeletedSelected}
                            onClick={() =>
                                onRestore(
                                    selectedRows.filter((id) => {
                                        const tag = filtered.find((t) => t.id === id);
                                        return tag && tag.deleted_at;
                                    })
                                )
                            }
                        >
                            กู้คืน
                        </Button>

                        <Button
                            variant="solid"
                            color="danger"
                            startDecorator={<DeleteForeverRounded />}
                            disabled={selectedRows.length === 0 || !hasDeletedSelected}
                            onClick={() =>
                                onForceDelete(
                                    selectedRows.filter((id) => {
                                        const tag = filtered.find((t) => t.id === id);
                                        return tag && tag.deleted_at;
                                    })
                                )
                            }
                        >
                            ลบถาวร
                        </Button>
                    </Box>

                    {selectedRows.length > 0 && (
                        <Chip variant="soft" color="neutral">
                            เลือก {selectedRows.length} รายการ
                        </Chip>
                    )}
                </Sheet>

                {/* Table */}
                <Sheet
                    variant="outlined"
                    sx={[ChatPageStyle.BoxSheet, { border: "none", p: 0, overflowX: "auto" }]}
                >
                    {loading ? (
                        <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
                            <CircularProgress />
                        </Box>
                    ) : filtered.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: "center", color: "neutral.500" }}>
                            <Typography level="title-md">ไม่พบรายการที่ตรงกับตัวกรอง</Typography>
                            <Typography level="body-sm">ลองปรับตัวกรองหรือกดรีเฟรชอีกครั้ง</Typography>
                        </Box>
                    ) : (
                        <Table
                            borderAxis="xBetween yBetween"
                            stickyHeader
                            sx={{
                                "--Table-headerUnderlineThickness": "1px",
                                "--TableCell-paddingX": "12px",
                                minWidth: 1100,
                                "& thead th": { bgcolor: "background.level1" },
                            }}
                        >
                            <thead>
                                <tr>
                                    <th style={{ width: 48 }}>
                                        <Checkbox
                                            checked={
                                                filtered.length > 0 && selectedRows.length === filtered.length
                                            }
                                            indeterminate={
                                                selectedRows.length > 0 &&
                                                selectedRows.length < filtered.length
                                            }
                                            onChange={(e) => toggleSelectAll(e.target.checked)}
                                        />
                                    </th>
                                    <th style={{ width: 70 }}>ID</th>
                                    <th style={{ width: 280 }}>Tag Name</th>
                                    <th style={{ width: 160 }}>Require Note</th>
                                    <th style={{ width: 160 }}>Group</th>
                                    <th style={{ width: 120 }}>Status</th>
                                    <th style={{ width: 220 }}>Created By</th>
                                    <th style={{ width: 220 }}>Updated By</th>
                                    <th style={{ width: 200 }}>Created at</th>
                                    <th style={{ width: 200 }}>Updated at</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r) => (
                                    <tr
                                        key={r.id}
                                        onDoubleClick={() =>
                                            navigate(`/tags/${r.id}/edit`, { state: { tag: r } })
                                        }
                                        style={{ cursor: "pointer" }}
                                    >
                                        <td>
                                            <Checkbox
                                                checked={selectedRows.includes(r.id)}
                                                onChange={(e) => toggleSelect(r.id, e.target.checked)}
                                            />
                                        </td>
                                        <td>{r.id}</td>
                                        <td style={{ fontWeight: 700 }}>{r.tagName}</td>
                                        <td>
                                            <RequireNoteChip value={r.require_note} />
                                        </td>
                                        <td>
                                            <GroupChip groupId={r.group_id} />
                                        </td>
                                        <td>
                                            <Chip
                                                size="sm"
                                                variant="soft"
                                                color={r.deleted_at ? "danger" : "success"}
                                                startDecorator={r.deleted_at ? "●" : "○"}
                                                sx={{ fontWeight: 600, minWidth: 80, justifyContent: "center" }}
                                            >
                                                {r.deleted_at ? "ลบแล้ว" : "ใช้งาน"}
                                            </Chip>
                                        </td>
                                        <td>{r.created_by_name || r.created_by_user_id || "-"}</td>
                                        <td>{r.updated_by_name || r.updated_by_user_id || "-"}</td>
                                        <td>{r.created_at ? convertFullDate(r.created_at) : "-"}</td>
                                        <td>{r.updated_at ? convertFullDate(r.updated_at) : "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Sheet>
            </Box>
        </Sheet>
    );
}
