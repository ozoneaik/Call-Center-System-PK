import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Sheet,
  Typography,
  Button,
  Input,
  FormControl,
  FormLabel,
  Select,
  Option,
  Table,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Checkbox,
} from "@mui/joy";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
  DeleteForever as DeleteForeverIcon,
  Refresh as RefreshIcon,
  FilterAlt as FilterIcon,
  ClearAll as ClearAllIcon,
} from "@mui/icons-material";
import KeyboardArrowUpRounded from "@mui/icons-material/KeyboardArrowUpRounded";
import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";

import {
  listTagGroupsApi,
  deleteTagGroupApi,
  restoreTagGroupApi,
  forceDeleteTagGroupApi,
} from "../../Api/TagGroups.js";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import { convertFullDate } from "../../Components/Options.jsx";
import { AlertDiaLog } from "../../Dialogs/Alert.js";

const BreadcrumbsPath = [
  { name: "จัดการกลุ่ม Tag การสนทนา" },
  { name: "Tags Groups" },
  { name: "รายละเอียด" },
];

function StatusChip({ deleted_at }) {
  return (
    <Chip
      size="sm"
      variant="soft"
      color={deleted_at ? "danger" : "success"}
      startDecorator={deleted_at ? "●" : "○"}
      sx={{ fontWeight: 600, minWidth: 80, justifyContent: "center" }}
    >
      {deleted_at ? "ลบแล้ว" : "ใช้งาน"}
    </Chip>
  );
}

export default function GroupPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [flash, setFlash] = useState(location.state?.flash || null);

  // Data
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selections
  const [selectedRows, setSelectedRows] = useState([]);

  // Filters
  const [filterName, setFilterName] = useState("");
  const [filterGroupId, setFilterGroupId] = useState("");
  const [filterCreatedBy, setFilterCreatedBy] = useState("");
  const [filterUpdatedBy, setFilterUpdatedBy] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // '', 'active', 'deleted'
  const [filtersOpen, setFiltersOpen] = useState(true); // ✅ พับ/กางฟิลเตอร์

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
    if (flash) {
      const t = setTimeout(() => setFlash(null), 5000);
      return () => clearTimeout(t);
    }
  }, []);

  const fetchData = async () => {
    try {
      const { status, data } = await listTagGroupsApi({ with_trashed: 1 });
      if (status === 200 && data) {
        console.log('data >>>>>>>' ,data);
        setGroups(Array.isArray(data.data) ? data.data : []);
      } else {
        console.log('data >>>>>>>');
        setGroups([]);
      }
    } catch (e) {
      console.error("Fetch data error:", e);
      setGroups([]);
    }
  };

  // Filtered list
  const filtered = useMemo(() => {
    return (groups || []).filter((g) => {
      const byName = filterName
        ? (g.group_name || "").toLowerCase().includes(filterName.toLowerCase()) ||
        (g.group_description || "").toLowerCase().includes(filterName.toLowerCase())
        : true;

      const byGroupId = filterGroupId
        ? String(g.group_id || "").toLowerCase().includes(filterGroupId.toLowerCase())
        : true;

      const createdDisplay = String(g.created_by_user_id || "").toLowerCase();
      const updatedDisplay = String(g.updated_by_user_id || "").toLowerCase();

      const byCreated = filterCreatedBy ? createdDisplay.includes(filterCreatedBy.toLowerCase()) : true;
      const byUpdated = filterUpdatedBy ? updatedDisplay.includes(filterUpdatedBy.toLowerCase()) : true;

      const byStatus =
        filterStatus === ""
          ? true
          : filterStatus === "active"
            ? !g.deleted_at
            : !!g.deleted_at;

      return byName && byGroupId && byCreated && byUpdated && byStatus;
    });
  }, [groups, filterName, filterGroupId, filterCreatedBy, filterUpdatedBy, filterStatus]);

  const toggleSelectAll = (checked) => {
    setSelectedRows(checked ? filtered.map((r) => r.id) : []);
  };

  const toggleSelect = (id, checked) => {
    setSelectedRows((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)));
  };

  const onDelete = (ids, force = false) => {
    if (!ids?.length) return;
    AlertDiaLog({
      icon: "question",
      title: force ? "ยืนยันการลบถาวร" : "ยืนยันการลบ Tag Groups",
      text: force
        ? `ต้องการลบถาวร ${ids.length} รายการหรือไม่? การดำเนินการนี้ไม่สามารถกู้คืนได้`
        : `ต้องการลบ ${ids.length} รายการหรือไม่? สามารถกู้คืนได้ภายหลัง`,
      onPassed: async (confirm) => {
        if (!confirm) return;
        let ok = 0;
        const api = force ? forceDeleteTagGroupApi : deleteTagGroupApi;
        for (const id of ids) {
          const { status } = await api(id);
          if (status === 200) ok++;
        }
        AlertDiaLog({
          icon: "success",
          title: "ผลการลบ",
          text: `ลบสำเร็จ ${ok}/${ids.length} รายการ`,
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
      title: "ยืนยันการกู้คืน Tag Groups",
      text: `ต้องการกู้คืน ${ids.length} รายการหรือไม่?`,
      onPassed: async (confirm) => {
        if (!confirm) return;
        let ok = 0;
        for (const id of ids) {
          const { status } = await restoreTagGroupApi(id);
          if (status === 200) ok++;
        }
        AlertDiaLog({
          icon: "success",
          title: "ผลการกู้คืน",
          text: `กู้คืนสำเร็จ ${ok}/${ids.length} รายการ`,
          onPassed: async () => {
            await fetchData();
            setSelectedRows([]);
          },
        });
      },
    });
  };

  const handleEdit = async (group) => {
    if (group.deleted_at) {
      AlertDiaLog({
        icon: "warning",
        title: "กลุ่มนี้ถูกลบแล้ว",
        text: "ต้องกู้คืนก่อนจึงจะแก้ไขได้ ต้องการกู้คืนตอนนี้หรือไม่?",
        onPassed: async (confirm) => {
          if (!confirm) return;
          const { status } = await restoreTagGroupApi(group.id);
          if (status === 200) {
            await fetchData();
            navigate(`/tags/groups/${group.id}/edit`, {
              state: {
                group: { ...group, deleted_at: null },
                flash: { type: "success", message: "กู้คืนสำเร็จ พร้อมให้แก้ไขได้" },
              },
            });
          }
        },
      });
      return;
    }
    navigate(`/tags/groups/${group.id}/edit`, { state: { group } });
  };

  const selectedGroups = filtered.filter((g) => selectedRows.includes(g.id));
  const hasActiveSelected = selectedGroups.some((g) => !g.deleted_at);
  const hasDeletedSelected = selectedGroups.some((g) => g.deleted_at);

  return (
    <Sheet sx={ChatPageStyle.Layout}>
      <Box component="main" sx={ChatPageStyle.MainContent}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <BreadcrumbsComponent list={BreadcrumbsPath} />
        </Box>

        {flash && (
          <Alert color={flash.type === "success" ? "success" : "danger"} sx={{ mb: 2 }} onClose={() => setFlash(null)}>
            {flash.message}
          </Alert>
        )}

        {/* Header */}
        <Box sx={[ChatPageStyle.BoxTable, { alignItems: "center", gap: 1 }]}>
          <Box sx={{ flex: 1 }}>
            <Typography level="h2" component="h1">
              จัดการ Tag Groups
            </Typography>
            <Typography level="body-sm" sx={{ color: "neutral.500" }}>
              ทั้งหมด {groups.length} รายการ • แสดง {filtered.length} รายการหลังกรอง
            </Typography>
          </Box>
          <IconButton variant="outlined" color="neutral" onClick={fetchData}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* Filter Card (แบบเดียวกับ TagPage) */}
        <Sheet
          variant="outlined"
          sx={{
            mb: 1.5,
            p: 0,
            borderRadius: "lg",
            borderColor: "divider",
            overflow: "visible", // กัน dropdown ถูกคลิป
            position: "relative",
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
            <FilterIcon />
            <Typography level="title-sm" sx={{ flex: 1 }}>
              ตัวกรอง
            </Typography>
            <IconButton
              variant="plain"
              color="neutral"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-label={filtersOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
            >
              {filtersOpen ? <KeyboardArrowUpRounded sx={{ color: "primary.main" }} /> : <KeyboardArrowDownRounded sx={{ color: "primary.main" }} />}
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ display: filtersOpen ? "block" : "none", px: 1.5, py: 1.5 }}>
            {/* Grid: label,input,label,input */}
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
                ค้นหาชื่อกลุ่ม / คำอธิบาย
              </Typography>
              <Input
                size="sm"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="เช่น สแปม, ประกัน, FAQ"
                startDecorator={<SearchIcon />}
                sx={{ minHeight: 32 }}
              />

              <Typography level="body-sm" sx={{ fontWeight: 600, textAlign: { md: "right" } }}>
                Group ID
              </Typography>
              <Input
                size="sm"
                value={filterGroupId}
                onChange={(e) => setFilterGroupId(e.target.value)}
                placeholder="เช่น A, B, PROD"
                sx={{ minHeight: 32 }}
              />

              {/* แถว 2 */}
              <Typography level="body-sm" sx={{ fontWeight: 600, textAlign: { md: "right" } }}>
                Created By
              </Typography>
              <Input
                size="sm"
                value={filterCreatedBy}
                onChange={(e) => setFilterCreatedBy(e.target.value)}
                placeholder="รหัส/ชื่อผู้สร้าง"
                sx={{ minHeight: 32 }}
              />

              <Typography level="body-sm" sx={{ fontWeight: 600, textAlign: { md: "right" } }}>
                Updated By
              </Typography>
              <Input
                size="sm"
                value={filterUpdatedBy}
                onChange={(e) => setFilterUpdatedBy(e.target.value)}
                placeholder="รหัส/ชื่อผู้แก้ไข"
                sx={{ minHeight: 32 }}
              />

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

              {/* ปุ่ม (เต็มแถว) */}
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
                  startDecorator={<ClearAllIcon />}
                  onClick={() => {
                    setFilterName("");
                    setFilterGroupId("");
                    setFilterCreatedBy("");
                    setFilterUpdatedBy("");
                    setFilterStatus("");
                    fetchData();
                  }}
                  sx={{ minHeight: 32, whiteSpace: "nowrap" }}
                >
                  ล้างตัวกรอง
                </Button>
                <Button
                  size="sm"
                  startDecorator={<RefreshIcon />}
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
            <Button variant="solid" color="primary" startDecorator={<AddIcon />} onClick={() => navigate("/tags/groups/create")}>
              สร้าง Group
            </Button>
            <Button
              variant="soft"
              color="warning"
              startDecorator={<EditIcon />}
              disabled={selectedRows.length !== 1}
              onClick={() => {
                const group = filtered.find((r) => r.id === selectedRows[0]);
                if (!group) return;
                handleEdit(group);
              }}
            >
              แก้ไข
            </Button>
            <Button
              variant="solid"
              color="danger"
              startDecorator={<DeleteIcon />}
              disabled={selectedRows.length === 0 || !hasActiveSelected}
              onClick={() =>
                onDelete(
                  selectedRows.filter((id) => {
                    const g = filtered.find((x) => x.id === id);
                    return g && !g.deleted_at;
                  })
                )
              }
            >
              ลบ
            </Button>
            <Button
              variant="solid"
              color="success"
              startDecorator={<RestoreIcon />}
              disabled={selectedRows.length === 0 || !hasDeletedSelected}
              onClick={() =>
                onRestore(
                  selectedRows.filter((id) => {
                    const g = filtered.find((x) => x.id === id);
                    return g && g.deleted_at;
                  })
                )
              }
            >
              กู้คืน
            </Button>
            <Button
              variant="solid"
              color="danger"
              startDecorator={<DeleteForeverIcon />}
              disabled={selectedRows.length === 0 || !hasDeletedSelected}
              onClick={() =>
                onDelete(
                  selectedRows.filter((id) => {
                    const g = filtered.find((x) => x.id === id);
                    return g && g.deleted_at;
                  }),
                  true
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
                minWidth: "100%",       
                tableLayout: "auto",    
                "& thead th": {
                  bgcolor: "background.level1",
                  whiteSpace: "nowrap", 
                },
              }}
            >
              <thead>
                <tr>
                  <th>
                    <Checkbox
                      checked={filtered.length > 0 && selectedRows.length === filtered.length}
                      indeterminate={selectedRows.length > 0 && selectedRows.length < filtered.length}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th>ID</th>
                  <th>Group ID</th>
                  <th>Group Name</th>
                  <th>Description</th>
                  <th>สถานะ</th>
                  <th>Created By</th>
                  <th>Updated By</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((group) => (
                  <tr
                    key={group.id}
                    onDoubleClick={() => handleEdit(group)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <Checkbox
                        checked={selectedRows.includes(group.id)}
                        onChange={(e) => toggleSelect(group.id, e.target.checked)}
                      />
                    </td>
                    <td>{group.id}</td>
                    <td>
                      <Typography fontFamily="monospace" fontWeight="bold" color="primary">
                        {group.group_id}
                      </Typography>
                    </td>
                    <td style={{ fontWeight: 700 }}>{group.group_name}</td>
                    <td>
                      <Typography
                        color="neutral"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 300, 
                        }}
                      >
                        {group.group_description || "-"}
                      </Typography>
                    </td>
                    <td>
                      <StatusChip deleted_at={group.deleted_at} />
                    </td>
                    <td>{group.created_by_user_id || "-"}</td>
                    <td>{group.updated_by_user_id || "-"}</td>
                    <td>{group.created_at ? convertFullDate(group.created_at) : "-"}</td>
                    <td>{group.updated_at ? convertFullDate(group.updated_at) : "-"}</td>
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