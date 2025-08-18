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
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { storeTagsApi, listTagGroupOptionsApi } from "../../../Api/Tags.js";
import { AlertDiaLog } from "../../../Dialogs/Alert.js";
import { profileApi } from "../../../Api/Auth.js";
import BreadcrumbsComponent from "../../../Components/Breadcrumbs.jsx";
import { ChatPageStyle } from "../../../styles/ChatPageStyle.js";

const BreadcrumbsPath = [
    { name: "จัดการ Tag Menu การสนทนา" },
    { name: "Tags Menu" },
    { name: "Create Menu" },
];
const pickName = (o) =>
    o?.real_name || o?.name || o?.empCode || o?.user?.name || o?.user?.empCode || "";

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

const RequireNoteSelector = ({ value, onChange }) => {
    const isTrue = value === "true";
    return (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
                variant={isTrue ? "solid" : "outlined"}
                color={isTrue ? "danger" : "neutral"}
                onClick={() => onChange("true")}
            >
                ต้องมีบันทึก
            </Chip>
            <Chip
                variant={!isTrue ? "solid" : "outlined"}
                color={!isTrue ? "neutral" : "neutral"}
                onClick={() => onChange("false")}
            >
                ไม่ต้องมี
            </Chip>
        </Box>
    );
};

export default function CreateTagPage({
    groupOptions: groupOptionsProp,
    currentUserName: currentUserNameProp,
}) {
    const navigate = useNavigate();

    // form state
    const [tagName, setTagName] = useState("");
    const [requireNote, setRequireNote] = useState("false"); // 'true' | 'false' | ''
    const [groupId, setGroupId] = useState("");

    // current user
    const [currentUserName, setCurrentUserName] = useState(currentUserNameProp || "-");

    // groups
    const [groupOptions, setGroupOptions] = useState([]);
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
            } catch { }
        })();
        return () => {
            ignore = true;
        };
    }, [groupOptionsProp]);

    // load profile for Created By
    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                if (!currentUserNameProp) {
                    const { data, status } = await profileApi();
                    if (!ignore && status === 200) {
                        const name = pickName(data) || "-";
                        setCurrentUserName(name);
                    }
                }
            } catch {
                if (!ignore) setCurrentUserName(currentUserNameProp || "-");
            }
        })();
        return () => {
            ignore = true;
        };
    }, [currentUserNameProp]);

    const onBack = () => navigate(-1);

    const onSave = async () => {
        if (!tagName.trim()) {
            return AlertDiaLog({ icon: "error", title: "กรอก Tag Name", text: "" });
        }
        if (requireNote !== "true" && requireNote !== "false") {
            return AlertDiaLog({
                icon: "error",
                title: "เลือก Require Note (ต้องมี/ไม่ต้องมี)",
                text: "",
            });
        }
        const payload = {
            tagName: tagName.trim(),
            require_note: requireNote === "true",
            ...(groupId ? { group_id: groupId } : {}),
        };
        const { data, status } = await storeTagsApi(payload);
        AlertDiaLog({
            icon: status === 200 ? "success" : "error",
            title: data?.message || (status === 200 ? "บันทึกสำเร็จ" : "บันทึกล้มเหลว"),
            text: data?.detail || "",
            onPassed: () => {
                if (status === 200) onBack();
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
                        <Typography level="h2" component="h1" sx={{ flex: 1 }}>
                            สร้างแท็กการสนทนา
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <Button
                        variant="plain"
                        startDecorator={<ArrowBackIosNewIcon fontSize="sm" />}
                        onClick={onBack}
                        sx={{ px: 0 }}
                    >
                        กลับ
                    </Button>
                    <Button variant="solid" onClick={onSave}>
                        Save
                    </Button>
                </Box>
                <Sheet
                    variant="outlined"
                    sx={{
                        borderRadius: "sm",
                        p: { xs: 2, md: 3 },
                        borderColor: "neutral.outlinedBorder",
                    }}
                >
                    <Stack spacing={2.5} sx={{ maxWidth: 720, mx: { md: "auto" } }}>
                        {/* Tag Name */}
                        <FormControl required>
                            <FormLabel sx={{ fontSize: 16 }}>Tag Name</FormLabel>
                            <Input
                                value={tagName}
                                onChange={(e) => setTagName(e.target.value)}
                                placeholder="เช่น แจ้งปัญหา / สอบถามข้อมูล"
                            />
                        </FormControl>

                        {/* Require Note */}
                        <FormControl required>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <FormLabel sx={{ fontSize: 16 }}>Require Note</FormLabel>
                                <RequireNotePreviewChip value={requireNote || "false"} />
                            </Box>
                            <RequireNoteSelector value={requireNote} onChange={setRequireNote} />
                        </FormControl>
                        <FormControl>
                            <FormLabel sx={{ fontSize: 16 }}>Group</FormLabel>
                            <Select
                                placeholder="(ไม่มีกลุ่ม)"
                                value={groupId}
                                onChange={(_, v) => setGroupId(v ?? "")}
                            >
                                <Option value="">&nbsp;(ไม่มีกลุ่ม)</Option>
                                {groupOptions.map((g) => (
                                    <Option key={g.value} value={g.value}>
                                        {g.label}
                                    </Option>
                                ))}
                            </Select>
                        </FormControl>
                        <Divider />

                        {/* Created By (display only) */}
                        <FormControl>
                            <FormLabel sx={{ fontSize: 16 }}>Created By</FormLabel>
                            <Input value={currentUserName || "-"} disabled variant="plain" />
                        </FormControl>
                    </Stack>
                </Sheet>
            </Box>
        </Sheet>
    );
}