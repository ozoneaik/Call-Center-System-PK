import {
    DialogContent,
    DialogTitle,
    Modal,
    ModalDialog,
    Stack,
    FormControl,
    FormLabel,
    Input,
    Button,
    Select,
    Option,
    Switch,
} from "@mui/joy";
import { useEffect, useState } from "react";
import { convertFullDate } from "../../../Components/Options.jsx";
import { AlertDiaLog } from "../../../Dialogs/Alert.js";
import { storeTagsApi, updateTagsApi } from "../../../Api/Tags.js";

export const FormTag = (props) => {
    const { show, setShow, selected = {}, setSelected, setTags } = props;

    // ฟิลด์หลัก
    const [tagName, setTagName] = useState(selected.tagName || "");
    const [groupId, setGroupId] = useState(selected.group_id || "");
    const [requireNote, setRequireNote] = useState(!!selected.require_note);

    // หมายเหตุ: ถ้าระบบของคุณ set ผู้ใช้งานฝั่ง backend อยู่แล้ว
    // ฟิลด์ด้านล่างอาจจะ readOnly หรือซ่อนได้
    const [createdBy, setCreatedBy] = useState(selected.created_by_user_id || "");
    const [updatedBy, setUpdatedBy] = useState(selected.updated_by_user_id || "");

    useEffect(() => {
        setTagName(selected.tagName || "");
        setGroupId(selected.group_id || "");
        setRequireNote(!!selected.require_note);
        setCreatedBy(selected.created_by_user_id || "");
        setUpdatedBy(selected.updated_by_user_id || "");
    }, [selected]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setShow(false);
        AlertDiaLog({
            icon: "question",
            title: selected?.id ? "ยืนยันการอัพเดท" : "ยืนยันการสร้าง",
            text: "กดตกลงเพื่อดำเนินการ",
            onPassed: async (confirm) => {
                if (!confirm) return;

                let data, status;
                const payload = {
                    tagName,
                    group_id: groupId || null,
                    require_note: !!requireNote,
                    created_by_user_id: createdBy || null,
                    updated_by_user_id: updatedBy || null,
                };

                if (selected?.id) {
                    ({ data, status } = await updateTagsApi({ ...payload, id: selected.id }));
                    if (status === 200) {
                        setTags((prev) =>
                            prev.map((t) => (t.id === data.tag.id ? { ...t, ...data.tag } : t))
                        );
                    }
                } else {
                    ({ data, status } = await storeTagsApi(payload));
                    if (status === 200) {
                        setTags((prev) => [...prev, data.tag]);
                    }
                }

                AlertDiaLog({
                    icon: status === 200 && "success",
                    title: data?.message || "สำเร็จ",
                    text: data?.detail || "",
                    onPassed: () => {
                        setSelected({});
                    },
                });
            },
        });
    };

    return (
        <Modal
            open={show}
            onClose={() => {
                setShow(false);
                setSelected({});
            }}
        >
            <ModalDialog>
                <DialogTitle>{selected?.id ? "แก้ไขแท็ก" : "สร้างแท็ก"}</DialogTitle>
                {selected?.tagName && <DialogContent>{selected.tagName}</DialogContent>}
                <form onSubmit={handleSubmit}>
                    <Stack spacing={2}>
                        <FormControl required>
                            <FormLabel>Tag Name</FormLabel>
                            <Input
                                autoFocus
                                value={tagName}
                                onChange={(e) => setTagName(e.target.value)}
                                type="text"
                                placeholder="เช่น แจ้งปัญหา, สอบถามข้อมูล"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Group</FormLabel>
                            {/* ถ้ามีรายการกลุ่ม ให้เปลี่ยนเป็น Select ได้ */}
                            <Input
                                value={groupId}
                                onChange={(e) => setGroupId(e.target.value)}
                                placeholder="รหัสกลุ่ม เช่น A"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Require Note</FormLabel>
                            <Switch
                                checked={requireNote}
                                onChange={(e) => setRequireNote(e.target.checked)}
                            />
                        </FormControl>

                        {/* ฟิลด์ผู้ใช้: ปรับให้ readOnly หรือซ่อนตามระบบจริง */}
                        <FormControl>
                            <FormLabel>Created By User</FormLabel>
                            <Input
                                value={createdBy}
                                onChange={(e) => setCreatedBy(e.target.value)}
                                placeholder="เช่น Sompong"
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel>Updated By User</FormLabel>
                            <Input
                                value={updatedBy}
                                onChange={(e) => setUpdatedBy(e.target.value)}
                                placeholder="เช่น Sompong"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Created at</FormLabel>
                            <Input
                                disabled
                                value={selected.created_at ? convertFullDate(selected.created_at) : "-"}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel>Updated at</FormLabel>
                            <Input
                                disabled
                                value={selected.updated_at ? convertFullDate(selected.updated_at) : "-"}
                            />
                        </FormControl>

                        <Button type="submit">{selected?.id ? "อัพเดท" : "สร้าง"}</Button>
                    </Stack>
                </form>
            </ModalDialog>
        </Modal>
    );
};
