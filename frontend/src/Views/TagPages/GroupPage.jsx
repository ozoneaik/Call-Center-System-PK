import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Sheet,
  Typography,
  Stack,
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
  Modal,
  ModalDialog,
  ModalClose,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Checkbox
} from "@mui/joy";
import Grid from "@mui/material/Grid2";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
  DeleteForever as DeleteForeverIcon,
  Refresh as RefreshIcon,
  FilterAlt as FilterIcon,
  ClearAll as ClearAllIcon
} from "@mui/icons-material";
import {
  listTagGroupsApi,
  deleteTagGroupApi,
  restoreTagGroupApi,
  forceDeleteTagGroupApi
} from "../../Api/TagGroups.js";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import { convertFullDate } from "../../Components/Options.jsx";
import { AlertDiaLog } from "../../Dialogs/Alert.js";

const BreadcrumbsPath = [
  { name: "หน้าหลัก" },
  { name: "Tags" },
  { name: "Groups" }
];

// Small UI helpers
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

  // Flash message from navigation state
  const [flash, setFlash] = useState(location.state?.flash || null);

  // Data states
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection states
  const [selectedRows, setSelectedRows] = useState([]);

  // Filter states
  const [filterName, setFilterName] = useState("");
  const [filterGroupId, setFilterGroupId] = useState("");
  const [filterCreatedBy, setFilterCreatedBy] = useState("");
  const [filterUpdatedBy, setFilterUpdatedBy] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // '', 'active', 'deleted'

  // Modal states
  const [deleteModal, setDeleteModal] = useState({ open: false, groups: [], force: false });
  const [restoreModal, setRestoreModal] = useState({ open: false, groups: [] });

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
    // Clear flash message after showing
    if (flash) {
      const timer = setTimeout(() => setFlash(null), 5000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const { status, data } = await listTagGroupsApi({ with_trashed: 1 });
      if (status === 200 && data) {
        setGroups(Array.isArray(data.data) ? data.data : []);
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error('Fetch data error:', error);
      setGroups([]);
    }
  };

  // Client-side filter
  const filtered = useMemo(() => {
    return (groups || []).filter((group) => {
      const byName = filterName
        ? (group.group_name || "").toLowerCase().includes(filterName.toLowerCase())
        : true;

      const byGroupId = filterGroupId
        ? (group.group_id || "").toLowerCase().includes(filterGroupId.toLowerCase())
        : true;

      const createdDisplay = String(group.created_by_user_id || "").toLowerCase();
      const updatedDisplay = String(group.updated_by_user_id || "").toLowerCase();

      const byCreated = filterCreatedBy
        ? createdDisplay.includes(filterCreatedBy.toLowerCase())
        : true;

      const byUpdated = filterUpdatedBy
        ? updatedDisplay.includes(filterUpdatedBy.toLowerCase())
        : true;

      const byStatus = filterStatus === ""
        ? true
        : filterStatus === "active"
          ? !group.deleted_at
          : !!group.deleted_at;

      return byName && byGroupId && byCreated && byUpdated && byStatus;
    });
  }, [groups, filterName, filterGroupId, filterCreatedBy, filterUpdatedBy, filterStatus]);

  const toggleSelectAll = (checked) => {
    setSelectedRows(checked ? filtered.map((r) => r.id) : []);
  };

  const toggleSelect = (id, checked) => {
    setSelectedRows((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)
    );
  };

  // Handle delete actions
  const onDelete = (ids, force = false) => {
    if (!ids?.length) return;
    const selectedGroups = filtered.filter(g => ids.includes(g.id));

    AlertDiaLog({
      icon: "question",
      title: force ? "ยืนยันการลบถาวร" : "ยืนยันการลบ Tag Groups",
      text: force
        ? `ต้องการลบถาวร ${ids.length} รายการหรือไม่? การดำเนินการนี้ไม่สามารถกู้คืนได้`
        : `ต้องการลบ ${ids.length} รายการหรือไม่? สามารถกู้คืนได้ภายหลัง`,
      onPassed: async (confirm) => {
        if (!confirm) return;
        let okCount = 0;
        const api = force ? forceDeleteTagGroupApi : deleteTagGroupApi;

        for (const id of ids) {
          const { status } = await api(id);
          if (status === 200) okCount++;
        }

        AlertDiaLog({
          icon: "success",
          title: "ผลการลบ",
          text: `ลบสำเร็จ ${okCount}/${ids.length} รายการ`,
          onPassed: async () => {
            await fetchData(); // Refresh data
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
        let okCount = 0;

        for (const id of ids) {
          const { status } = await restoreTagGroupApi(id);
          if (status === 200) okCount++;
        }

        AlertDiaLog({
          icon: "success",
          title: "ผลการกู้คืน",
          text: `กู้คืนสำเร็จ ${okCount}/${ids.length} รายการ`,
          onPassed: async () => {
            await fetchData(); // Refresh data
            setSelectedRows([]);
          },
        });
      },
    });
  };

  // Handle navigation
  const handleEdit = (group) => {
    navigate(`/tags/groups/${group.id}/edit`, { state: { group } });
  };

  // Get selected groups for action buttons
  const selectedGroups = filtered.filter(g => selectedRows.includes(g.id));
  const hasActiveSelected = selectedGroups.some(g => !g.deleted_at);
  const hasDeletedSelected = selectedGroups.some(g => g.deleted_at);

  return (
    <Sheet sx={ChatPageStyle.Layout}>
      <Box component="main" sx={ChatPageStyle.MainContent}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <BreadcrumbsComponent list={BreadcrumbsPath} />
        </Box>

        {/* Flash Message */}
        {flash && (
          <Alert
            color={flash.type === "success" ? "success" : "danger"}
            sx={{ mb: 2 }}
            onClose={() => setFlash(null)}
          >
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

        {/* Filter Card */}
        <Sheet
          variant="outlined"
          sx={{ mb: 1.5, p: 0, borderRadius: "lg", borderColor: "divider", overflow: "hidden" }}
        >
          <Box
            sx={{
              px: 2, py: 1.1,
              bgcolor: "neutral.softBg",
              borderBottom: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <FilterIcon />
            <Typography level="title-sm">ตัวกรอง</Typography>
          </Box>

          <Box sx={{ px: 1.5, py: 1, overflowX: "auto" }}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "nowrap",      // ❗️ไม่ตัดบรรทัด
                alignItems: "end",
                gap: 1,
                minWidth: 1060,          // ปรับตามจำนวนฟิลด์
              }}
            >
              <FormControl sx={{ minWidth: 260, flexShrink: 0 }}>
                <FormLabel>ค้นหาชื่อกลุ่ม / คำอธิบาย</FormLabel>
                <Input
                  size="sm"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="เช่น สแปม, ประกัน, FAQ"
                  startDecorator={<SearchIcon />}
                />
              </FormControl>

              <FormControl sx={{ minWidth: 200, flexShrink: 0 }}>
                <FormLabel>Group ID</FormLabel>
                <Input
                  size="sm"
                  value={filterGroupId}
                  onChange={(e) => setFilterGroupId(e.target.value)}
                  placeholder="เช่น A, B, PROD"
                />
              </FormControl>

              <FormControl sx={{ minWidth: 200, flexShrink: 0 }}>
                <FormLabel>Created By</FormLabel>
                <Input
                  size="sm"
                  value={filterCreatedBy}
                  onChange={(e) => setFilterCreatedBy(e.target.value)}
                  placeholder="รหัส/ชื่อผู้สร้าง"
                />
              </FormControl>

              <FormControl sx={{ minWidth: 200, flexShrink: 0 }}>
                <FormLabel>Updated By</FormLabel>
                <Input
                  size="sm"
                  value={filterUpdatedBy}
                  onChange={(e) => setFilterUpdatedBy(e.target.value)}
                  placeholder="รหัส/ชื่อผู้แก้ไข"
                />
              </FormControl>

              <FormControl sx={{ minWidth: 160, flexShrink: 0 }}>
                <FormLabel>สถานะ</FormLabel>
                <Select
                  size="sm"
                  value={filterStatus}
                  onChange={(_, v) => setFilterStatus(v ?? "")}
                >
                  <Option value="">ทั้งหมด</Option>
                  <Option value="active">ใช้งาน</Option>
                  <Option value="deleted">ลบแล้ว</Option>
                </Select>
              </FormControl>

              {/* ตัวดันซ้าย-ขวาให้ปุ่มไปชิดขวา */}
              <Box sx={{ flex: 1 }} />

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
                  fetchData(); // โหลดใหม่แบบค่าเริ่มต้น
                }}
                sx={{ flexShrink: 0 }}
              >
                ล้างตัวกรอง
              </Button>

              <Button
                size="sm"
                startDecorator={<RefreshIcon />}
                onClick={fetchData}
                sx={{ flexShrink: 0 }}
              >
                รีเฟรช
              </Button>
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
              startDecorator={<AddIcon />}
              onClick={() => navigate("/tags/groups/create")}
            >
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
              onClick={() => onDelete(selectedRows.filter(id => {
                const group = filtered.find(g => g.id === id);
                return group && !group.deleted_at;
              }))}
            >
              ลบ
            </Button>

            <Button
              variant="solid"
              color="success"
              startDecorator={<RestoreIcon />}
              disabled={selectedRows.length === 0 || !hasDeletedSelected}
              onClick={() => onRestore(selectedRows.filter(id => {
                const group = filtered.find(g => g.id === id);
                return group && group.deleted_at;
              }))}
            >
              กู้คืน
            </Button>

            <Button
              variant="solid"
              color="danger"
              startDecorator={<DeleteForeverIcon />}
              disabled={selectedRows.length === 0 || !hasDeletedSelected}
              onClick={() => onDelete(selectedRows.filter(id => {
                const group = filtered.find(g => g.id === id);
                return group && group.deleted_at;
              }), true)}
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
                      checked={filtered.length > 0 && selectedRows.length === filtered.length}
                      indeterminate={selectedRows.length > 0 && selectedRows.length < filtered.length}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th style={{ width: 70 }}>ID</th>
                  <th style={{ width: 120 }}>Group ID</th>
                  <th style={{ width: 200 }}>Group Name</th>
                  <th style={{ width: 300 }}>Description</th>
                  <th style={{ width: 120 }}>สถานะ</th>
                  <th style={{ width: 180 }}>Created By</th>
                  <th style={{ width: 180 }}>Updated By</th>
                  <th style={{ width: 150 }}>Created At</th>
                  <th style={{ width: 150 }}>Updated At</th>
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
                      <Typography color="neutral" sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 280
                      }}>
                        {group.group_description || "-"}
                      </Typography>
                    </td>
                    <td><StatusChip deleted_at={group.deleted_at} /></td>
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
      </Box >
    </Sheet >
  );
}