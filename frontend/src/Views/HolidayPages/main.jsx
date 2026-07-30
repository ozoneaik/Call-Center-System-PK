import { useEffect, useState } from "react";
import {
    Avatar, Box, Button, Card, Chip, Divider, FormControl, FormLabel, Input,
    Modal, ModalClose, ModalDialog, Sheet, Stack, Switch, Textarea, Typography
} from "@mui/joy";
import { Grid2 } from "@mui/material";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { ChatPageStyle } from "../../styles/ChatPageStyle";
import BreadcrumbsComponent from "../../Components/Breadcrumbs";
import { AlertDiaLog } from "../../Dialogs/Alert";
import { HolidayListApi, createHolidayApi, updateHolidayApi, deleteHolidayApi } from "../../Api/Holiday";

function MessagePreview({ message }) {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%", gap: 1 }}>
            <Typography level="body-xs" sx={{ opacity: 0.6, textTransform: "uppercase", letterSpacing: 1 }}>
                ตัวอย่างข้อความที่ลูกค้าได้รับ
            </Typography>
            <Box
                sx={{
                    flex: 1,
                    borderRadius: "md",
                    border: "1px dashed",
                    borderColor: "divider",
                    bgcolor: "background.level1",
                    p: 1.5,
                    minHeight: 160,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                }}
            >
                {message ? (
                    <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                        <Avatar size="sm" color="primary" variant="solid">
                            <SmartToyIcon fontSize="small" />
                        </Avatar>
                        <Box>
                            <Box
                                sx={{
                                    bgcolor: "background.surface",
                                    border: "1px solid",
                                    borderColor: "divider",
                                    borderRadius: "0 12px 12px 12px",
                                    px: 1.5,
                                    py: 1,
                                    maxWidth: 340,
                                    boxShadow: "sm",
                                }}
                            >
                                <Typography level="body-sm" sx={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>
                                    {message}
                                </Typography>
                            </Box>
                            <Typography level="body-xs" sx={{ opacity: 0.5, mt: 0.5, ml: 0.5 }}>
                                Pumpkin Bot
                            </Typography>
                        </Box>
                    </Box>
                ) : (
                    <Typography level="body-sm" sx={{ opacity: 0.4, m: "auto", textAlign: "center" }}>
                        พิมพ์ข้อความด้านซ้าย<br />เพื่อดูตัวอย่าง
                    </Typography>
                )}
            </Box>
        </Box>
    );
}

const BreadcrumbsPath = [{ name: "ตั้งค่า" }, { name: "จัดการวันหยุด" }];

const emptyForm = { holiday_name: "", message: "", start_date: "", end_date: "", is_active: true };

export default function HolidayPage() {
    const [holidays, setHolidays] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editModal, setEditModal] = useState(false);
    const [editForm, setEditForm] = useState(emptyForm);
    const [editId, setEditId] = useState(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        const { data, status } = await HolidayListApi();
        if (status === 200) setHolidays(data.holidays);
    };

    const handleCreate = async () => {
        const { data, status } = await createHolidayApi(form);
        AlertDiaLog({
            title: status === 200 ? "สำเร็จ" : "ไม่สำเร็จ",
            text: data.message,
            icon: status === 200 ? "success" : "error",
            onPassed: () => {
                if (status === 200) {
                    setHolidays(prev => [...prev, data.holiday].sort((a, b) => a.start_date?.localeCompare(b.start_date)));
                    setForm(emptyForm);
                }
            },
        });
    };

    const openEdit = (holiday) => {
        setEditId(holiday.id);
        setEditForm({
            holiday_name: holiday.holiday_name,
            message: holiday.message || "",
            start_date: holiday.start_date || "",
            end_date: holiday.end_date || "",
            is_active: holiday.is_active,
        });
        setEditModal(true);
    };

    const handleUpdate = async () => {
        const { data, status } = await updateHolidayApi(editId, editForm);
        setEditModal(false);
        if (status === 200) {
            setHolidays(prev => prev.map(h => h.id === editId ? data.holiday : h));
        }
        AlertDiaLog({
            title: status === 200 ? "สำเร็จ" : "ไม่สำเร็จ",
            text: data.message,
            icon: status === 200 ? "success" : "error",
        });
    };

    const handleDelete = (id) => {
        AlertDiaLog({
            icon: "question",
            title: "ยืนยันการลบ",
            text: "คุณต้องการลบวันหยุดนี้ใช่หรือไม่",
            onPassed: async (confirm) => {
                if (!confirm) return;
                const { data, status } = await deleteHolidayApi(id);
                AlertDiaLog({
                    title: status === 200 ? "สำเร็จ" : "ไม่สำเร็จ",
                    text: data.message,
                    icon: status === 200 ? "success" : "error",
                    onPassed: () => status === 200 && setHolidays(prev => prev.filter(h => h.id !== id)),
                });
            },
        });
    };

    const canSubmit = (f) => f.holiday_name && f.start_date && f.end_date && f.message;

    return (
        <Sheet sx={ChatPageStyle.Layout}>
            {/* Modal แก้ไข */}
            <Modal open={editModal} onClose={() => setEditModal(false)}>
                <ModalDialog minWidth={520}>
                    <ModalClose />
                    <Typography level="h4">แก้ไขวันหยุด</Typography>
                    <Stack spacing={1.5} mt={1}>
                        <FormControl>
                            <FormLabel>ชื่อวันหยุด</FormLabel>
                            <Input value={editForm.holiday_name} onChange={e => setEditForm({ ...editForm, holiday_name: e.target.value })} />
                        </FormControl>
                        <Grid2 container spacing={1.5}>
                            <Grid2 size={6}>
                                <FormControl>
                                    <FormLabel>วันที่เริ่ม</FormLabel>
                                    <Input type="date" value={editForm.start_date} onChange={e => setEditForm({ ...editForm, start_date: e.target.value })} />
                                </FormControl>
                            </Grid2>
                            <Grid2 size={6}>
                                <FormControl>
                                    <FormLabel>วันที่สิ้นสุด</FormLabel>
                                    <Input type="date" value={editForm.end_date} onChange={e => setEditForm({ ...editForm, end_date: e.target.value })} />
                                </FormControl>
                            </Grid2>
                        </Grid2>
                        <FormControl>
                            <FormLabel>ข้อความที่ส่งให้ลูกค้า</FormLabel>
                            <Textarea minRows={5} value={editForm.message} onChange={e => setEditForm({ ...editForm, message: e.target.value })} />
                        </FormControl>
                        {editForm.message && (
                            <>
                                <Divider />
                                <MessagePreview message={editForm.message} />
                            </>
                        )}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Switch checked={!!editForm.is_active} onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })} />
                            <Typography level="body-sm">{editForm.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}</Typography>
                        </Box>
                        <Button onClick={handleUpdate} disabled={!canSubmit(editForm)}>
                            บันทึก
                        </Button>
                    </Stack>
                </ModalDialog>
            </Modal>

            <Box sx={ChatPageStyle.MainContent}>
                <BreadcrumbsComponent list={BreadcrumbsPath} />

                {/* Form เพิ่มวันหยุดใหม่ */}
                <Card variant="outlined" sx={{ mb: 3 }}>
                    <Typography level="title-md" startDecorator={<EventBusyIcon />}>
                        เพิ่มวันหยุดใหม่
                    </Typography>
                    <Grid2 container spacing={2} mt={0.5}>
                        <Grid2 size={{ xs: 12, md: 4 }}>
                            <FormControl>
                                <FormLabel>ชื่อวันหยุด</FormLabel>
                                <Input
                                    placeholder="เช่น วันหยุดสงกรานต์"
                                    value={form.holiday_name}
                                    onChange={e => setForm({ ...form, holiday_name: e.target.value })}
                                />
                            </FormControl>
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 4 }}>
                            <FormControl>
                                <FormLabel>วันที่เริ่ม</FormLabel>
                                <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                            </FormControl>
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 4 }}>
                            <FormControl>
                                <FormLabel>วันที่สิ้นสุด</FormLabel>
                                <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                            </FormControl>
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 6 }}>
                            <FormControl sx={{ height: "100%" }}>
                                <FormLabel>ข้อความที่ส่งให้ลูกค้า</FormLabel>
                                <Textarea
                                    minRows={7}
                                    placeholder={"พิมพ์ข้อความที่จะส่งให้ลูกค้าอัตโนมัติเมื่อเป็นวันหยุด..."}
                                    value={form.message}
                                    onChange={e => setForm({ ...form, message: e.target.value })}
                                    sx={{ flex: 1 }}
                                />
                            </FormControl>
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 6 }}>
                            <MessagePreview message={form.message} />
                        </Grid2>
                        <Grid2 size={12}>
                            <Button onClick={handleCreate} disabled={!canSubmit(form)}>
                                บันทึก
                            </Button>
                        </Grid2>
                    </Grid2>
                </Card>

                {/* รายการวันหยุด */}
                <Typography level="title-md" mb={2}>
                    รายการวันหยุดทั้งหมด ({holidays.length})
                </Typography>
                <Grid2 container spacing={2}>
                    {holidays.map(item => (
                        <Grid2 size={{ xs: 12, md: 6, lg: 4 }} key={item.id}>
                            <Card variant="soft" color={item.is_active ? "primary" : "neutral"} sx={{ height: "100%" }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                                    <Typography level="title-md">{item.holiday_name}</Typography>
                                    <Chip size="sm" color={item.is_active ? "success" : "neutral"} variant="solid">
                                        {item.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                                    </Chip>
                                </Box>
                                <Typography level="body-sm">
                                    {item.start_date} — {item.end_date}
                                </Typography>
                                <Typography
                                    level="body-xs"
                                    sx={{ whiteSpace: "pre-line", opacity: 0.75, maxHeight: 90, overflow: "hidden" }}
                                >
                                    {item.message}
                                </Typography>
                                <Stack direction="row" spacing={1} mt="auto" pt={1}>
                                    <Button size="sm" color="warning" fullWidth startDecorator={<EditIcon fontSize="small" />} onClick={() => openEdit(item)}>
                                        แก้ไข
                                    </Button>
                                    <Button size="sm" color="danger" onClick={() => handleDelete(item.id)}>
                                        <DeleteIcon fontSize="small" />
                                    </Button>
                                </Stack>
                            </Card>
                        </Grid2>
                    ))}
                    {holidays.length === 0 && (
                        <Grid2 size={12}>
                            <Typography level="body-md" sx={{ textAlign: "center", opacity: 0.5, py: 6 }}>
                                ยังไม่มีวันหยุดในระบบ กรุณาเพิ่มวันหยุดด้านบน
                            </Typography>
                        </Grid2>
                    )}
                </Grid2>
            </Box>
        </Sheet>
    );
}
