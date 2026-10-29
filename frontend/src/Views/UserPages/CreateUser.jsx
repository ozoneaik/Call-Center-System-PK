import {
    FormControl, FormLabel, FormHelperText, Input, Select, Option, Box, Button, Modal, ModalDialog, ModalClose,
    Typography, Divider, Stack, IconButton,
} from "@mui/joy";
import { Grid2 } from "@mui/material";
import { useState } from "react";
import { storeUserApi } from "../../Api/User.js";
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import { useChatRooms } from "../../context/ChatRoomContext.jsx";
import { Save, Visibility, VisibilityOff } from '@mui/icons-material';
import RoomPicker from "./RoomPicker.jsx";
import MenuPicker from "./MenuPicker.jsx";

const emptyUser = {
    empCode: '',
    email: '',
    name: '',
    real_name: '',
    description: '',
    role: 'user',
    roomId: 'ROOM01',
    password: '',
    password_confirmation: '',
    list: [],
    admin_menus: [],
    token_platforms: [],
};

export const CreateUser = ({ open, setOpen, Refresh }) => {
    const { chatRoomsContext } = useChatRooms();
    const [user, setUser] = useState(emptyUser);
    const [showPassword, setShowPassword] = useState(false);
    const [saving, setSaving] = useState(false);

    const set = (patch) => setUser((u) => ({ ...u, ...patch }));
    const mismatch = user.password_confirmation !== '' && user.password !== user.password_confirmation;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (user.password !== user.password_confirmation) return;
        setSaving(true);
        const { data, status } = await storeUserApi(user);
        setSaving(false);
        AlertDiaLog({
            title: data.message,
            text: data.detail,
            icon: status === 200 && 'success',
            onPassed: () => {
                if (status === 200) {
                    setOpen(false);
                    Refresh();
                }
            },
        });
    };

    const passwordToggle = (
        <IconButton size="sm" variant="plain" onClick={() => setShowPassword((v) => !v)} aria-label="แสดงรหัสผ่าน">
            {showPassword ? <VisibilityOff /> : <Visibility />}
        </IconButton>
    );

    return (
        <Modal open={open} onClose={() => setOpen(false)}>
            <ModalDialog sx={{ width: { xs: '100%', md: 860 }, maxWidth: '100%', maxHeight: '95dvh', overflowY: 'auto' }}>
                <ModalClose />
                <Typography level="title-lg">เพิ่มผู้ใช้</Typography>
                <form onSubmit={handleSubmit}>
                    <Typography level="title-sm" mt={1} mb={1}>ข้อมูลพนักงาน</Typography>
                    <Grid2 container spacing={1.5}>
                        <Grid2 size={{ xs: 12, sm: 4 }}>
                            <FormControl required>
                                <FormLabel>รหัสพนักงาน</FormLabel>
                                <Input value={user.empCode} placeholder="ex.7001x" autoFocus
                                    onChange={(e) => set({ empCode: e.target.value, email: e.target.value + '@mail.local' })} />
                                <FormHelperText>ใช้เป็นชื่อเข้าสู่ระบบ</FormHelperText>
                            </FormControl>
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 4 }}>
                            <FormControl required>
                                <FormLabel>ชื่อที่ใช้แสดง</FormLabel>
                                <Input value={user.name} placeholder="ex.น้องสมศรี"
                                    onChange={(e) => set({ name: e.target.value })} />
                                <FormHelperText>ลูกค้าเห็นชื่อนี้ในแชท</FormHelperText>
                            </FormControl>
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 4 }}>
                            <FormControl required>
                                <FormLabel>ชื่อ-นามสกุลจริง</FormLabel>
                                <Input value={user.real_name} placeholder="ex.นายสมศรี บันลือ"
                                    onChange={(e) => set({ real_name: e.target.value })} />
                            </FormControl>
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 8 }}>
                            <FormControl required>
                                <FormLabel>คำอธิบาย (แผนก)</FormLabel>
                                <Input value={user.description} placeholder="ex.ฝ่ายบริการหลังการขาย"
                                    onChange={(e) => set({ description: e.target.value })} />
                            </FormControl>
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 4 }}>
                            <FormControl required>
                                <FormLabel>สิทธิ์</FormLabel>
                                <Select value={user.role} onChange={(_, v) => set({ role: v })}>
                                    <Option value="user">ผู้ใช้ทั่วไป</Option>
                                    <Option value="admin">ผู้ดูแลระบบ</Option>
                                </Select>
                            </FormControl>
                        </Grid2>
                    </Grid2>

                    <Divider sx={{ my: 2 }} />
                    <Typography level="title-sm" mb={1}>รหัสผ่าน</Typography>
                    <Grid2 container spacing={1.5}>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                            <FormControl required>
                                <FormLabel>รหัสผ่าน</FormLabel>
                                <Input value={user.password} type={showPassword ? 'text' : 'password'}
                                    endDecorator={passwordToggle} autoComplete="new-password"
                                    onChange={(e) => set({ password: e.target.value })} />
                            </FormControl>
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                            <FormControl required error={mismatch}>
                                <FormLabel>ยืนยันรหัสผ่าน</FormLabel>
                                <Input value={user.password_confirmation} type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    onChange={(e) => set({ password_confirmation: e.target.value })} />
                                {mismatch && <FormHelperText>รหัสผ่านไม่ตรงกัน</FormHelperText>}
                            </FormControl>
                        </Grid2>
                    </Grid2>

                    <Divider sx={{ my: 2 }} />
                    <Typography level="title-sm" mb={1}>ห้องแชทที่เข้าถึงได้</Typography>
                    <RoomPicker rooms={chatRoomsContext} value={user.list} onChange={(list) => set({ list })} />

                    {user.role === 'user' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography level="title-sm" mb={1}>เมนูผู้ดูแลระบบที่อนุญาต</Typography>
                            <MenuPicker
                                value={user.admin_menus} onChange={(admin_menus) => set({ admin_menus })}
                                tokenPlatforms={user.token_platforms} onTokenPlatformsChange={(token_platforms) => set({ token_platforms })}
                            />
                        </>
                    )}

                    <Stack direction="row" spacing={1} justifyContent="flex-end" mt={2}>
                        <Button variant="plain" color="neutral" onClick={() => setOpen(false)}>ยกเลิก</Button>
                        <Button startDecorator={<Save />} type="submit" loading={saving} disabled={mismatch}>บันทึก</Button>
                    </Stack>
                </form>
            </ModalDialog>
        </Modal>
    );
};
