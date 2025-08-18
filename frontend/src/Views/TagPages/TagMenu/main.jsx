import { ChatPageStyle } from "../../../styles/ChatPageStyle.js";
import { Box, Sheet, Typography, Button, CircularProgress, Table, Input, Select, Option, Checkbox, Chip, IconButton, } from "@mui/joy";
import { useEffect, useMemo, useState } from "react";
import BreadcrumbsComponent from "../../../Components/Breadcrumbs.jsx";
import { deleteTagApi, listTagsApi, restoreTagApi, forceDeleteTagApi, listTagGroupOptionsApi, } from "../../../Api/Tags.js";
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
import KeyboardArrowUpRounded from "@mui/icons-material/KeyboardArrowUpRounded";
import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";

const BreadcrumbsPath = [{ name: "จัดการ Tag Menu การสนทนา" }, { name: "Tag Menu" }, { name: "รายละเอียด" }];

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

function GroupChip({ group, permanentlyDeleted = false }) {
    // ไม่มีทั้ง group object และ group_id
    if (!group?.group_id && !group?.name) {
        return <Typography level="body-sm" sx={{ color: "neutral.500" }}>-</Typography>;
    }

    const isSoftDeleted = !!group?.deleted_at;
    const isPermanent = !isSoftDeleted && permanentlyDeleted;

    const label = group?.name
        ? `${group.name} (${group.group_id || "-"})`
        : `Group: ${group.group_id}`;

    const showDanger = isSoftDeleted || isPermanent;

    return (
        <Chip
            size="sm"
            variant={showDanger ? "soft" : "outlined"}
            color={showDanger ? "danger" : "primary"}
            sx={{ fontWeight: 600 }}
            title={
                isSoftDeleted
                    ? "กลุ่มนี้ถูกลบชั่วคราว (Soft Delete)"
                    : isPermanent
                        ? "กลุ่มนี้ถูกลบถาวร (Force Delete)"
                        : undefined
            }
        >
            {label}
            {isSoftDeleted ? " — กลุ่มถูกลบชั่วคราว" : isPermanent ? " — กลุ่มถูกลบถาวร" : ""}
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
    const [filterGroupId, setFilterGroupId] = useState(""); // ใช้ค่า value ของ option
    const [filterCreatedBy, setFilterCreatedBy] = useState("");
    const [filterUpdatedBy, setFilterUpdatedBy] = useState("");
    const [filterRequireNote, setFilterRequireNote] = useState(""); // '', 'true', 'false'
    const [filterStatus, setFilterStatus] = useState(""); // '', 'active', 'deleted'
    const [filterGroupDeletion, setFilterGroupDeletion] = useState("exclude"); // 'exclude' | '' | 'soft' | 'permanent' | 'any'

    // group options (normalized เป็น {value, label, raw})
    const [groupOptions, setGroupOptions] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(true);

    useEffect(() => {
        fetchData().finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        (async () => {
            setLoadingGroups(true);
            const { data, status } = await listTagGroupOptionsApi();
            if (status === 200) {
                const rawList = data?.options || data?.list || data || [];
                const normalized = rawList.map((it) => {
                    // ถ้าเป็นรูป {value,label,raw} อยู่แล้ว ก็ใช้ต่อได้เลย
                    if (it && "value" in it && "label" in it) return it;
                    // แปลงจาก {group_id, name, ...}
                    const groupId = String(it?.group_id ?? "");
                    const label = it?.name ? `${it.name} (${groupId})` : groupId;
                    return { value: groupId, label, raw: it };
                });
                setGroupOptions(normalized);
            }
            setLoadingGroups(false);
        })();
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

            // กรองด้วย group_id ที่เลือกจาก Select
            const byGroup =
                filterGroupId === ""
                    ? true
                    : filterGroupId === "__NULL__"
                        ? !t.group_id
                        : String(t.group_id || "") === String(filterGroupId);

            const createdDisplay = String(t.created_by_name || t.created_by_user_id || "").toLowerCase();
            const updatedDisplay = String(t.updated_by_name || t.updated_by_user_id || "").toLowerCase();

            const byCreated = filterCreatedBy ? createdDisplay.includes(filterCreatedBy.toLowerCase()) : true;
            const byUpdated = filterUpdatedBy ? updatedDisplay.includes(filterUpdatedBy.toLowerCase()) : true;

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

            // ✅ สถานะ Group ของแท็กที่อ้างอิง
            const isSoftDeletedGroup = !!(t.group?.deleted_at);
            const isPermanentlyDeletedGroup = !isSoftDeletedGroup && !t.group && !!t.group_id;

            const byGroupDeletion =
                filterGroupDeletion === "exclude"
                    ? (!isSoftDeletedGroup && !isPermanentlyDeletedGroup) // ✅ แสดงเฉพาะ group ปกติ
                    : filterGroupDeletion === ""
                        ? true
                        : filterGroupDeletion === "soft"
                            ? isSoftDeletedGroup
                            : filterGroupDeletion === "permanent"
                                ? isPermanentlyDeletedGroup
                                : filterGroupDeletion === "any"
                                    ? (isSoftDeletedGroup || isPermanentlyDeletedGroup)
                                    : true;

            return (
                byName &&
                byGroup &&
                byCreated &&
                byUpdated &&
                byRequire &&
                byStatus &&
                byGroupDeletion
            );
        });
    }, [
        tags,
        filterName,
        filterGroupId,
        filterCreatedBy,
        filterUpdatedBy,
        filterRequireNote,
        filterStatus,
        filterGroupDeletion,
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
                        overflow: "visible",
                        position: "relative",
                        minHeight: "auto",
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
                        <Typography level="title-sm" sx={{ flex: 1 }}>
                            ตัวกรอง
                        </Typography>

                        <IconButton
                            variant="plain"
                            color="neutral"
                            onClick={() => setFiltersOpen((v) => !v)}
                            sx={{ ml: "auto" }}
                            aria-label={filtersOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                        >
                            {filtersOpen ? <KeyboardArrowUpRounded /> : <KeyboardArrowDownRounded />}
                        </IconButton>
                    </Box>

                    {/* Content */}
                    <Box sx={{ display: filtersOpen ? "block" : "none", px: 1.5, py: 1.5 }}>
                        <Box
                            sx={{
                                display: "grid",
                                alignItems: "center",
                                columnGap: 2,
                                rowGap: 1.5,
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    md: "170px minmax(260px, 1fr) 170px minmax(260px, 1fr)",
                                },
                                gridAutoRows: "minmax(32px, auto)",
                            }}
                        >
                            {/* แถว 1 */}
                            <Typography level="body-sm" sx={{ fontWeight: 600, textAlign: { md: "right" } }}>
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

                            <Typography level="body-sm" sx={{ fontWeight: 600, textAlign: { md: "right" } }}>
                                Group
                            </Typography>
                            <Select
                                size="sm"
                                value={filterGroupId}
                                onChange={(_, v) => setFilterGroupId(v ?? "")}
                                disabled={loadingGroups}
                                sx={{ minHeight: 32, width: "100%" }}
                                placeholder={loadingGroups ? "กำลังโหลด..." : "เลือกกลุ่ม"}
                                slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                            >
                                <Option value="">ทั้งหมด</Option>
                                <Option value="__NULL__">(ไม่มี Group)</Option>
                                {groupOptions.map((opt) => (
                                    <Option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </Option>
                                ))}
                            </Select>

                            {/* แถว 2 */}
                            <Typography level="body-sm" sx={{ fontWeight: 600, textAlign: { md: "right" } }}>
                                สถานะ Group (ที่แท็กอ้างอิง)
                            </Typography>
                            <Select
                                size="sm"
                                value={filterGroupDeletion}
                                onChange={(_, v) => setFilterGroupDeletion(v ?? "exclude")}
                                sx={{ minHeight: 32 }}
                                slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                            >
                                <Option value="exclude">เฉพาะ Group ปกติ</Option>
                                <Option value="">ทั้งหมด</Option>
                                <Option value="soft">กลุ่มถูกลบชั่วคราว (Soft)</Option>
                                <Option value="permanent">กลุ่มถูกลบถาวร (Permanent)</Option>
                                <Option value="any">มีการลบ (Soft/Perm)</Option>
                            </Select>

                            <Typography level="body-sm" sx={{ fontWeight: 600, textAlign: { md: "right" } }}>
                                Require Note
                            </Typography>
                            <Select
                                size="sm"
                                value={filterRequireNote}
                                onChange={(_, v) => setFilterRequireNote(v ?? "")}
                                sx={{ minHeight: 32 }}
                                slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                            >
                                <Option value="">ทั้งหมด</Option>
                                <Option value="true">ต้องมีบันทึก</Option>
                                <Option value="false">ไม่ต้องมี</Option>
                            </Select>

                            {/* แถว 3 */}
                            <Typography level="body-sm" sx={{ fontWeight: 600, textAlign: { md: "right" } }}>
                                สถานะ
                            </Typography>
                            <Select
                                size="sm"
                                value={filterStatus}
                                onChange={(_, v) => setFilterStatus(v ?? "")}
                                sx={{ minHeight: 32 }}
                                slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                            >
                                <Option value="">ทั้งหมด</Option>
                                <Option value="active">ใช้งาน</Option>
                                <Option value="deleted">ลบแล้ว</Option>
                            </Select>

                            <Typography level="body-sm" sx={{ fontWeight: 600, textAlign: { md: "right" } }}>
                                Created By
                            </Typography>
                            <Input
                                size="sm"
                                value={filterCreatedBy}
                                onChange={(e) => setFilterCreatedBy(e.target.value)}
                                placeholder="ชื่อผู้สร้าง"
                                sx={{ minHeight: 32 }}
                            />

                            {/* แถว 4 */}
                            <Typography level="body-sm" sx={{ fontWeight: 600, textAlign: { md: "right" } }}>
                                Updated By
                            </Typography>
                            <Input
                                size="sm"
                                value={filterUpdatedBy}
                                onChange={(e) => setFilterUpdatedBy(e.target.value)}
                                placeholder="ชื่อผู้แก้ไข"
                                sx={{ minHeight: 32 }}
                            />

                            {/* แถวปุ่ม (เต็มแถว) */}
                            <Box
                                sx={{
                                    gridColumn: "1 / -1",
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: 1,
                                    pt: 0.5,
                                }}
                            >
                                <Button
                                    variant="outlined"
                                    color="neutral"
                                    size="sm"
                                    startDecorator={<ClearAllRounded />}
                                    onClick={() => {
                                        setFilterName("");
                                        setFilterGroupId("");
                                        setFilterCreatedBy("");
                                        setFilterUpdatedBy("");
                                        setFilterRequireNote("");
                                        setFilterStatus("");
                                        setFilterGroupDeletion("exclude"); // ดีฟอลต์
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
                            <Typography level="body-sm">
                                ลองปรับตัวกรองหรือกดรีเฟรชอีกครั้ง
                            </Typography>
                        </Box>
                    ) : (
                        <Table
                            borderAxis="xBetween yBetween"
                            stickyHeader
                            sx={{
                                "--Table-headerUnderlineThickness": "1px",
                                "--TableCell-paddingX": "12px",
                                minWidth: "100%",         
                                tableLayout: "auto",      
                                "& thead th": { bgcolor: "background.level1", whiteSpace: "nowrap" },
                            }}
                        >
                            <thead>
                                <tr>
                                    <th>
                                        <Checkbox
                                            checked={
                                                filtered.length > 0 &&
                                                selectedRows.length === filtered.length
                                            }
                                            indeterminate={
                                                selectedRows.length > 0 &&
                                                selectedRows.length < filtered.length
                                            }
                                            onChange={(e) => toggleSelectAll(e.target.checked)}
                                        />
                                    </th>
                                    <th>ID</th>
                                    <th>Tag Name</th>
                                    <th>Require Note</th>
                                    <th>Group</th>
                                    <th>Status</th>
                                    <th>Created By</th>
                                    <th>Updated By</th>
                                    <th>Created at</th>
                                    <th>Updated at</th>
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
                                        <td><RequireNoteChip value={r.require_note} /></td>
                                        <td>
                                            <GroupChip
                                                group={r.group || { group_id: r.group_id }}
                                                permanentlyDeleted={!r.group && !!r.group_id}
                                            />
                                        </td>
                                        <td>
                                            <Chip
                                                size="sm"
                                                variant="soft"
                                                color={r.deleted_at ? "danger" : "success"}
                                                startDecorator={r.deleted_at ? "●" : "○"}
                                                sx={{
                                                    fontWeight: 600,
                                                    minWidth: 80,
                                                    justifyContent: "center",
                                                }}
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