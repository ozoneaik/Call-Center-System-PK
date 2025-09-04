import {
  Box,
  Sheet,
  Typography,
  Button,
  Stack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Divider,
  Chip,
  FormHelperText,
} from "@mui/joy";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import { profileApi } from "../../Api/Auth.js";
import { getTagGroupApi, restoreTagGroupApi, updateTagGroupApi } from "../../Api/TagGroups.js";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import { listTagGroupsApi } from "../../Api/TagGroups.js";

const BreadcrumbsPath = [
  { name: "จัดการกลุ่ม Tag การสนทนา" },
  { name: "Tags Groups" },
  { name: "Edit Group" },
];

const pick = (...vals) => {
  for (const v of vals) if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
  return "";
};
const pickName = (o) =>
  o?.real_name || o?.name || o?.empCode || o?.user?.name || o?.user?.empCode || "-";

function extractApiError(errData) {
  // รองรับโครงสร้าง error ทั่วไปของ Laravel Validator
  if (errData?.errors && typeof errData.errors === "object") {
    const firstKey = Object.keys(errData.errors)[0];
    if (firstKey) {
      const val = errData.errors[firstKey];
      if (Array.isArray(val) && val.length) return val[0];
      if (typeof val === "string") return val;
    }
  }
  return errData?.detail || errData?.message || "เกิดข้อผิดพลาด";
}

export default function EditGroupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  // may come from navigation state
  const fromState = location.state?.group || null;

  // entity state
  const [group, setGroup] = useState(fromState || null);
  const [group_id, setGroupId] = useState(fromState?.group_id || "");
  const [group_name, setGroupName] = useState(fromState?.group_name || "");
  const [group_description, setGroupDescription] = useState(fromState?.group_description || "");
  const [deleted_at, setDeletedAt] = useState(fromState?.deleted_at || null);

  // display-only
  const [createdByDisplay, setCreatedByDisplay] = useState("-");
  const [updatedByDisplay, setUpdatedByDisplay] = useState("-");
  const [currentUserName, setCurrentUserName] = useState("");

  // loading flags
  const [loading, setLoading] = useState(!fromState);
  const [saving, setSaving] = useState(false);

  const norm = (s) => (s || "").trim().toLowerCase();

  const [nameError, setNameError] = useState("");
  const [checkingName, setCheckingName] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const { data, status } = await profileApi();
        if (!ignore && status === 200) {
          const me = pickName(data);
          setCurrentUserName(me);
          if (!updatedByDisplay || updatedByDisplay === "-") {
            setUpdatedByDisplay(me || "-");
          }
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  //กันกรณีเข้าตรงด้วย URL: ถ้าข้อมูลถูกลบ ต้องกู้คืนก่อนจึงจะแก้ไขได้
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (fromState || !id) return setLoading(false);
      try {
        setLoading(true);
        const { status, data } = await getTagGroupApi(id);
        if (!ignore && status === 200 && data?.data) {
          const g = data.data;
          if (g.deleted_at) {
            AlertDiaLog({
              icon: "warning",
              title: "กลุ่มนี้ถูกลบแล้ว",
              text: "ต้องกู้คืนก่อนจึงจะแก้ไขได้ ต้องการกู้คืนตอนนี้หรือไม่?",
              onPassed: async (confirm) => {
                if (!confirm) {
                  navigate("/tags/groups", {
                    state: { flash: { type: "danger", message: "ไม่สามารถแก้ไขรายการที่ถูกลบได้" } },
                  });
                  return;
                }
                const { status: rs } = await restoreTagGroupApi(id);
                if (rs === 200) {
                  const { data: re } = await getTagGroupApi(id);
                  const ng = re?.data ?? g;
                  setGroup(ng);
                  setGroupId(ng.group_id || "");
                  setGroupName(ng.group_name || "");
                  setGroupDescription(ng.group_description || "");
                  setDeletedAt(null);
                } else {
                  navigate("/tags/groups", {
                    state: { flash: { type: "danger", message: "กู้คืนไม่สำเร็จ" } },
                  });
                }
              },
            });
          } else {
            setGroup(g);
            setGroupId(g.group_id || "");
            setGroupName(g.group_name || "");
            setGroupDescription(g.group_description || "");
            setDeletedAt(null);
          }
        }
      } catch {
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [fromState, id, navigate]);

  useEffect(() => {
    if (!group) return;
    setCreatedByDisplay(pick(group.created_by_name, group.created_by_user_id, "-"));
    setUpdatedByDisplay(pick(group.updated_by_name, group.updated_by_user_id, updatedByDisplay));
  }, [group]);

  const onBack = () => navigate(-1);

  const onUpdate = async () => {
    if (saving) return;
    if (!group_id.trim()) {
      return AlertDiaLog({ icon: "error", title: "กรอก Group ID", text: "" });
    }
    const q = group_name.trim();
    if (!q)
      return AlertDiaLog({ icon: "error", title: "กรอกชื่อกลุ่ม", text: "" });

    if (deleted_at) {
      AlertDiaLog({
        icon: "warning",
        title: "ไม่สามารถอัปเดตได้",
        text: "กลุ่มนี้ถูกลบอยู่ ต้องกู้คืนก่อนจึงจะแก้ไขได้",
      });
      return;
    }

    setCheckingName(true);
    const taken = await isGroupNameTaken(q, id);
    setCheckingName(false);
    if (taken) {
      setNameError("มีชื่อกลุ่มนี้อยู่แล้ว");
      return AlertDiaLog({ icon: "error", title: "ชื่อกลุ่มซ้ำ", text: "กรุณาใช้ชื่ออื่น" });
    }

    setSaving(true);
    const payload = {
      group_id: group_id.trim(),
      group_name: group_name.trim(),
      group_description: group_description?.trim() || null,
    };
    const { status, data } = await updateTagGroupApi(id, payload);
    setSaving(false);

    if (status === 200) {
      // รองรับทั้ง data.group (ตามที่เราปรับ Controller) และ data.data (กันพลาด)
      const updated = data?.group || data?.data || {};
      // refresh displays and local state
      setUpdatedByDisplay(
        pick(updated.updated_by_name, updated.updated_by_user_id, currentUserName, updatedByDisplay)
      );
      setGroup((prev) => ({ ...(prev || {}), ...updated }));

      // sync inputs ให้โชว์ค่าล่าสุดทันที
      if (Object.prototype.hasOwnProperty.call(updated, "group_id")) {
        setGroupId(updated.group_id ?? "");
      }
      if (Object.prototype.hasOwnProperty.call(updated, "group_name")) {
        setGroupName(updated.group_name ?? "");
      }
      if (Object.prototype.hasOwnProperty.call(updated, "group_description")) {
        setGroupDescription(updated.group_description ?? "");
      }
      if (Object.prototype.hasOwnProperty.call(updated, "deleted_at")) {
        setDeletedAt(updated.deleted_at ?? null);
      }
    }

    // แจ้งผล
    let text = data?.detail || "";
    if (status === 422) {
      text = extractApiError(data);
    }
    AlertDiaLog({
      icon: status === 200 ? "success" : "error",
      title: data?.message || (status === 200 ? "อัปเดตสำเร็จ" : "อัปเดตล้มเหลว"),
      text,
      onPassed: () => {
        if (status === 200) onBack();
      },
    });
  };

  const isGroupNameTaken = async (name, excludeId) => {
    const q = (name || "").trim();
    if (!q) return false;
    const { status, data } = await listTagGroupsApi({ q, with_trashed: 1, per_page: 100 });
    if (status !== 200) return false;
    const list = data?.data || data?.list || data || [];
    return list.some(
      (g) => norm(g.group_name) === norm(q) && String(g.id) !== String(excludeId || "")
    );
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
            <Typography level="h2" component="h1" sx={{ flex: 1 }}>
              แก้ไข Group การสนทนา
            </Typography>
            {deleted_at && <Chip color="danger" variant="soft" size="sm">ลบแล้ว</Chip>}
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Button
            variant="plain"
            startDecorator={<ArrowBackIosNewIcon fontSize="sm" />}
            onClick={onBack}
            sx={{ px: 0 }}
          >
            กลับ
          </Button>
          <Button
            variant="soft"
            color="warning"
            onClick={onUpdate}
            loading={saving || loading}
            disabled={!!deleted_at} // ✅ กันอัปเดตซ้ำระดับปุ่ม (เผื่อกรณีหลุด)
          >
            Update
          </Button>
        </Box>

        <Sheet
          variant="outlined"
          sx={{ borderRadius: "sm", p: { xs: 2, md: 3 }, borderColor: "neutral.outlinedBorder" }}
        >
          <Stack spacing={2.5} sx={{ maxWidth: 720, mx: { md: "auto" } }}>
            <FormControl required>
              <FormLabel sx={{ fontSize: 16 }}>Group ID</FormLabel>
              <Input
                value={group_id}
                placeholder="เช่น A, B, PROD"
                disabled
                variant="plain"
              />
            </FormControl>
            <FormControl required>
              <FormLabel sx={{ fontSize: 16 }}>ชื่อกลุ่ม</FormLabel>
              <Input
                value={group_name}
                onChange={(e) => {
                  setGroupName(e.target.value);
                  setNameError("");
                }}
                onBlur={async () => {
                  const q = group_name.trim();
                  if (!q) { setNameError("กรุณากรอกชื่อกลุ่ม"); return; }
                  setCheckingName(true);
                  const taken = await isGroupNameTaken(q, id);
                  setCheckingName(false);
                  setNameError(taken ? "มีชื่อกลุ่มนี้อยู่แล้ว" : "");
                }}
                placeholder="เช่น สแปม, ประกัน, FAQ"
                disabled={loading}
              />
              {nameError && <FormHelperText color="danger">{nameError}</FormHelperText>}
            </FormControl>

            <FormControl>
              <FormLabel sx={{ fontSize: 16 }}>คำอธิบาย</FormLabel>
              <Textarea
                minRows={3}
                value={group_description}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                disabled={loading || !!deleted_at}
              />
            </FormControl>
            <Divider />
            {/* Display-only */}
            <FormControl>
              <FormLabel sx={{ fontSize: 16 }}>Created By</FormLabel>
              <Input value={createdByDisplay || "-"} disabled variant="plain" />
            </FormControl>
            <FormControl>
              <FormLabel sx={{ fontSize: 16 }}>Updated By</FormLabel>
              <Input value={updatedByDisplay || "-"} disabled variant="plain" />
            </FormControl>
          </Stack>
        </Sheet>
      </Box>
    </Sheet>
  );
}