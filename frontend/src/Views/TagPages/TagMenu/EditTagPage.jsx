import {
    Box,
    Sheet,
    Typography,
    Button,
    Stack,
    FormControl,
    FormLabel,
    Input,
    Select,
    Option,
    Chip,
    Divider,
} from "@mui/joy";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertDiaLog } from "../../../Dialogs/Alert.js";
import { profileApi } from "../../../Api/Auth.js";
import {
    updateTagsApi,
    deleteTagApi,
    listTagsApi,
    listTagGroupOptionsApi, // ⬅️ NEW
} from "../../../Api/Tags.js";

const toBool = (v) => v === true || v === "true" || v === 1 || v === "1";
const toStr = (v) => (v == null ? "" : String(v));
const pick = (...vals) => {
    for (const v of vals)
        if (v !== undefined && v !== null && String(v).trim() !== "")
            return String(v);
    return "";
};

const RequireNotePreviewChip = ({ value }) => {
    const isTrue = value === "true";
    return (
        <Chip
            size="sm"
            variant="soft"
            color={isTrue ? "danger" : "neutral"}
            startDecorator={isTrue ? "●" : "○"}
            sx={{ fontWeight: 600, minWidth: 110, justifyContent: "center" }}
        >
            {isTrue ? "ต้องมีบันทึก" : "ไม่ต้องมี"}
        </Chip>
    );
};

const RequireNoteSelector = ({ value, onChange, disabled }) => {
    const isTrue = value === "true";
    return (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
                variant={isTrue ? "solid" : "outlined"}
                color={isTrue ? "danger" : "neutral"}
                onClick={() => !disabled && onChange("true")}
            >
                ต้องมีบันทึก
            </Chip>
            <Chip
                variant={!isTrue ? "solid" : "outlined"}
                color={!isTrue ? "neutral" : "neutral"}
                onClick={() => !disabled && onChange("false")}
            >
                ไม่ต้องมี
            </Chip>
        </Box>
    );
};

export default function EditTagPage({ groupOptions: groupOptionsProp }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { id: idParam } = useParams();

    const tagFromState = location.state?.tag || null;
    const idFromRoute = idParam ? Number(idParam) : tagFromState?.id ?? null;

    // state
    const [loading, setLoading] = useState(!tagFromState);
    const [tag, setTag] = useState(tagFromState || null);

    const [tagName, setTagName] = useState(toStr(tagFromState?.tagName));
    const [requireNote, setRequireNote] = useState(
        tagFromState ? (toBool(tagFromState.require_note) ? "true" : "false") : ""
    ); // 'true' | 'false' | ''
    const [groupId, setGroupId] = useState(toStr(tagFromState?.group_id));

    // display
    const [createdByDisplay, setCreatedByDisplay] = useState("-");
    const [updatedByDisplay, setUpdatedByDisplay] = useState("-");
    const [currentUserName, setCurrentUserName] = useState("");

    // groups (⬇️ ดึงจาก API จริง)
    const [groupOptions, setGroupOptions] = useState([]);
    const isGroupDeleted = !!(tag?.group?.deleted_at);

    const softDeleted = !!(tag?.group?.deleted_at);
    const permanentlyDeleted = !softDeleted && !tag?.group && !!tag?.group_id;
    const groupDeletedOrMissing = softDeleted || permanentlyDeleted;

    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                if (groupOptionsProp?.length) {
                    setGroupOptions(groupOptionsProp);
                } else {
                    const { data, status } = await listTagGroupOptionsApi();
                    if (!ignore && status === 200 && Array.isArray(data)) {
                        setGroupOptions(data);
                    }
                }
            } catch {
                /* ignore */
            }
        })();
        return () => {
            ignore = true;
        };
    }, [groupOptionsProp]);

    // profile (for updated-by fallback)
    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                const { data, status } = await profileApi();
                if (!ignore && status === 200) {
                    const name = pick(
                        data?.real_name,
                        data?.name,
                        data?.empCode,
                        data?.user?.name,
                        data?.user?.empCode
                    );
                    setCurrentUserName(name);
                    if (!updatedByDisplay || updatedByDisplay === "-") {
                        setUpdatedByDisplay(name || "-");
                    }
                }
            } catch {
                /* ignore */
            }
        })();
        return () => {
            ignore = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // load tag if not in state
    useEffect(() => {
        let ignore = false;
        (async () => {
            if (tagFromState || !idFromRoute) return setLoading(false);
            try {
                const { data, status } = await listTagsApi();
                if (!ignore && status === 200 && Array.isArray(data?.list)) {
                    const found = data.list.find(
                        (x) => Number(x.id) === Number(idFromRoute)
                    );
                    if (found) {
                        setTag(found);
                        setTagName(toStr(found.tagName));
                        setRequireNote(toBool(found.require_note) ? "true" : "false");
                        setGroupId(toStr(found.group_id));
                    }
                }
            } catch (e) {
                console.error("EditTagPage: load tag error", e);
            } finally {
                if (!ignore) setLoading(false);
            }
        })();
        return () => {
            ignore = true;
        };
    }, [tagFromState, idFromRoute]);

    // fill displays from tag
    useEffect(() => {
        if (!tag) return;
        setCreatedByDisplay(pick(tag.created_by_name, tag.created_by_user_id, "-"));
        const upd = pick(tag.updated_by_name, tag.updated_by_user_id, updatedByDisplay);
        setUpdatedByDisplay(upd || "-");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tag]);

    const onBack = () => navigate(-1);

    const onUpdate = async () => {
        const tagId = tag?.id || idFromRoute;
        if (!tagId) return AlertDiaLog({ icon: "error", title: "ไม่พบ ID ของแท็ก", text: "" });
        if (!tagName.trim()) return AlertDiaLog({ icon: "error", title: "กรอก Tag Name", text: "" });
        if (requireNote !== "true" && requireNote !== "false") {
            return AlertDiaLog({ icon: "error", title: "เลือก Require Note (ต้องมี/ไม่ต้องมี)", text: "" });
        }
        if (!groupId) return AlertDiaLog({ icon: "error", title: "เลือก Group", text: "" });

        const payload = {
            id: tagId,
            tagName: tagName.trim(),
            require_note: requireNote === "true",
            group_id: groupId,
        };

        const { data, status } = await updateTagsApi(payload);

        if (status === 200) {
            const updated = data?.tag || {};
            setUpdatedByDisplay(
                pick(
                    updated.updated_by_name,
                    updated.updated_by_user_id,
                    currentUserName,
                    updatedByDisplay
                )
            );
            setTag((prev) => ({ ...(prev || {}), ...updated }));
        }

        AlertDiaLog({
            icon: status === 200 ? "success" : "error",
            title: data?.message || (status === 200 ? "อัปเดตสำเร็จ" : "อัปเดตล้มเหลว"),
            text: data?.detail || "",
            onPassed: () => {
                if (status === 200) onBack();
            },
        });
    };

    const onDelete = async () => {
        const tagId = tag?.id || idFromRoute;
        if (!tagId) return AlertDiaLog({ icon: "error", title: "ไม่พบ ID ของแท็ก", text: "" });
        AlertDiaLog({
            icon: "question",
            title: "ยืนยันการลบ",
            text: "ต้องการลบแท็กนี้หรือไม่?",
            onPassed: async (confirm) => {
                if (!confirm) return;
                const { data, status } = await deleteTagApi({ id: tagId });
                AlertDiaLog({
                    icon: status === 200 ? "success" : "error",
                    title: data?.message || (status === 200 ? "ลบสำเร็จ" : "ลบไม่สำเร็จ"),
                    text: data?.detail || "",
                    onPassed: () => {
                        if (status === 200) onBack();
                    },
                });
            },
        });
    };

    return (
        <Sheet sx={{ maxWidth: 920, mx: "auto", p: { xs: 2, md: 3 } }}>
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Typography level="h2" component="h1" sx={{ flex: 1 }}>
                    แก้ไขแท็กการสนทนา
                </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
                <Button
                    variant="plain"
                    startDecorator={<ArrowBackIosNewIcon fontSize="sm" />}
                    onClick={onBack}
                    sx={{ px: 0 }}
                >
                    กลับ
                </Button>

                {groupDeletedOrMissing && (tag?.group?.name || tag?.group_id) && (
                    <Box
                        sx={{
                            px: 2,
                            py: 1,
                            borderRadius: "md",
                            border: "1px solid",
                            borderColor: "danger.solidBg",
                            bgcolor: "danger.softBg",
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            flexGrow: 1,
                            minWidth: 0,
                        }}
                    >
                        <Typography level="body-sm" sx={{ color: "neutral.700" }} noWrap>
                            {tag?.group?.name
                                ? `ชื่อกลุ่ม: ${tag.group.name} (${tag.group.group_id})`
                                : `รหัสกลุ่ม: ${tag.group_id}`}
                        </Typography>

                        <Typography level="body-sm" sx={{ color: "danger.solidBg", fontWeight: 600 }} noWrap>
                            {softDeleted ? "กลุ่มนี้ถูกลบชั่วคราว" : "กลุ่มนี้ถูกลบถาวร"} โปรดเลือกกรุ๊ปใหม่แล้วกดอัปเดต
                        </Typography>
                    </Box>
                )}

                <Button variant="soft" color="warning" onClick={onUpdate} disabled={loading}>
                    Update
                </Button>
                <Button variant="solid" color="danger" onClick={onDelete} disabled={loading}>
                    Delete
                </Button>
            </Box>

            <Sheet
                variant="outlined"
                sx={{ borderRadius: "sm", p: { xs: 2, md: 3 }, borderColor: "neutral.outlinedBorder" }}
            >
                <Stack spacing={2.5} sx={{ maxWidth: 720, mx: { md: "auto" } }}>
                    {/* Tag Name */}
                    <FormControl required>
                        <FormLabel sx={{ fontSize: 16 }}>Tag Name</FormLabel>
                        <Input
                            value={tagName}
                            onChange={(e) => setTagName(e.target.value)}
                            placeholder="เช่น แจ้งปัญหา / สอบถามข้อมูล"
                            disabled={loading}
                        />
                    </FormControl>

                    {/* Require Note as Chips + preview */}
                    <FormControl required>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <FormLabel sx={{ fontSize: 16 }}>Require Note</FormLabel>
                            <RequireNotePreviewChip value={requireNote || "false"} />
                        </Box>
                        <RequireNoteSelector value={requireNote} onChange={setRequireNote} disabled={loading} />
                    </FormControl>

                    {/* Group */}
                    <FormControl required>
                        <FormLabel sx={{ fontSize: 16 }}>Group</FormLabel>
                        <Select
                            color={(softDeleted || permanentlyDeleted) ? "danger" : "neutral"}
                            variant={(softDeleted || permanentlyDeleted) ? "outlined" : "soft"}
                            placeholder="เลือกกลุ่ม"
                            value={groupId}
                            onChange={(_, v) => setGroupId(v ?? "")}
                            disabled={loading}
                        >
                            {groupOptions.map((g) => (
                                <Option key={g.value} value={g.value}>
                                    {g.label}
                                </Option>
                            ))}
                        </Select>

                        {/* (ไม่บังคับ) Preview ชื่อกลุ่ม
                        {(tag?.group?.name || tag?.group_id) && (
                            <Typography level="body-sm" sx={{ color: "neutral.500", mt: 0.5 }}>
                                {tag?.group?.name
                                    ? `ชื่อกลุ่ม: ${tag.group.name} (${tag.group.group_id})`
                                    : `รหัสกลุ่ม: ${tag.group_id}`}
                            </Typography>
                        )} */}
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
        </Sheet >
    );
}
