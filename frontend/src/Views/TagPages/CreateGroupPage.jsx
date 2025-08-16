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
} from "@mui/joy";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { storeTagGroupApi } from "../../Api/TagGroups.js";
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import { profileApi } from "../../Api/Auth.js";

const pickName = (o) =>
    o?.real_name || o?.name || o?.empCode || o?.user?.name || o?.user?.empCode || "-";

export default function CreateGroupPage() {
    const navigate = useNavigate();

    // form
    const [group_id, setGroupId] = useState("");
    const [group_name, setGroupName] = useState("");
    const [group_description, setGroupDescription] = useState("");

    // display
    const [createdByDisplay, setCreatedByDisplay] = useState("-");

    // loading
    const [saving, setSaving] = useState(false);

    // load profile for "Created By"
    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                const { data, status } = await profileApi();
                if (!ignore && status === 200) {
                    setCreatedByDisplay(pickName(data));
                }
            } catch {
                /* ignore */
            }
        })();
        return () => {
            ignore = true;
        };
    }, []);

    const onBack = () => navigate(-1);

    const onSave = async () => {
        if (!group_id.trim()) {
            return AlertDiaLog({ icon: "error", title: "กรอก Group ID", text: "" });
        }
        if (!group_name.trim()) {
            return AlertDiaLog({ icon: "error", title: "กรอกชื่อกลุ่ม", text: "" });
        }

        setSaving(true);
        const payload = {
            group_id: group_id.trim(),
            group_name: group_name.trim(),
            group_description: group_description?.trim() || null,
        };
        const { status, data } = await storeTagGroupApi(payload);
        setSaving(false);

        const ok = status === 200 || status === 201;
        AlertDiaLog({
            icon: ok ? "success" : "error",
            title: data?.message || (ok ? "บันทึกสำเร็จ" : "บันทึกล้มเหลว"),
            text: data?.detail || "",
            onPassed: () => {
                if (ok) onBack();
            },
        });
    };

    return (
        <Sheet sx={{ maxWidth: 920, mx: "auto", p: { xs: 2, md: 3 } }}>
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Typography level="h2" component="h1" sx={{ flex: 1 }}>
                    สร้าง Group การสนทนา
                </Typography>
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
                <Button variant="solid" onClick={onSave} loading={saving}>
                    Save
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
                            onChange={(e) => setGroupId(e.target.value)}
                            placeholder="เช่น A, B, PROD"
                        />
                    </FormControl>

                    <FormControl required>
                        <FormLabel sx={{ fontSize: 16 }}>ชื่อกลุ่ม</FormLabel>
                        <Input
                            value={group_name}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="เช่น สแปม, ประกัน, FAQ"
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel sx={{ fontSize: 16 }}>คำอธิบาย</FormLabel>
                        <Textarea
                            minRows={3}
                            value={group_description}
                            onChange={(e) => setGroupDescription(e.target.value)}
                            placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                        />
                    </FormControl>

                    <Divider />

                    {/* Created By (display only) */}
                    <FormControl>
                        <FormLabel sx={{ fontSize: 16 }}>Created By</FormLabel>
                        <Input value={createdByDisplay || "-"} disabled variant="plain" />
                    </FormControl>
                </Stack>
            </Sheet>
        </Sheet>
    );
}
