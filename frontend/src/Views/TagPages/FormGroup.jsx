import { useEffect, useState } from "react";
import { Modal, ModalDialog, ModalClose, Typography, Input, Button, Stack } from "@mui/joy";
import { storeTagGroupApi, updateTagGroupApi } from "../../Api/Tags.js";

export function FormGroup({ show, setShow, selected, setSelected, setGroups }) {
    const [groupName, setGroupName] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (selected && selected.id) {
            setGroupName(selected.group_name || "");
            setDescription(selected.group_description || "");
        } else {
            setGroupName("");
            setDescription("");
        }
    }, [selected]);

    const onSubmit = async () => {
        const payload = {
            group_name: groupName,
            group_description: description,
        };

        if (selected.id) {
            const { data, status } = await updateTagGroupApi({ ...payload, id: selected.id });
            if (status === 200) {
                setGroups((prev) =>
                    prev.map((item) => (item.id === selected.id ? data.group : item))
                );
                setShow(false);
                setSelected({});
            }
        } else {
            const { data, status } = await storeTagGroupApi(payload);
            if (status === 200) {
                setGroups((prev) => [data.group, ...prev]);
                setShow(false);
            }
        }
    };

    return (
        <Modal open={show} onClose={() => setShow(false)}>
            <ModalDialog>
                <ModalClose />
                <Typography level="h4" mb={1}>
                    {selected?.id ? "แก้ไข Group" : "สร้าง Group ใหม่"}
                </Typography>
                <Stack spacing={2}>
                    <Input
                        placeholder="ชื่อ Group"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                    />
                    <Input
                        placeholder="คำอธิบาย"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <Button onClick={onSubmit}>{selected?.id ? "อัปเดต" : "สร้าง"}</Button>
                </Stack>
            </ModalDialog>
        </Modal>
    );
}