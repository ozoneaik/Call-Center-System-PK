import { useState } from 'react';
import {
    Box, Button, FormControl, FormLabel, Input, Stack,
    Textarea, Typography, Divider, IconButton,
    Avatar
} from "@mui/joy";
import {Visibility, VisibilityOff } from '@mui/icons-material';
import { CloudUpload,Save } from '@mui/icons-material';
import { styled } from '@mui/joy';
import { Grid2 } from '@mui/material';

const VisuallyHiddenInput = styled('input')`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  white-space: nowrap;
  width: 1px;
`;

export default function EditProfileForm({ userData, onSubmitSuccess }) {
    const [formData, setFormData] = useState({
        name: userData.name || '',
        description: userData.description || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [avatarPreview, setAvatarPreview] = useState(userData.avatar || '');

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field when user types
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPassword(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'กรุณากรอกชื่อ';
        }

        // ตรวจสอบการกรอกรหัสผ่าน (เฉพาะกรณีที่ต้องการเปลี่ยนรหัสผ่าน)
        if (formData.newPassword || formData.confirmPassword || formData.currentPassword) {
            if (!formData.currentPassword) {
                newErrors.currentPassword = 'กรุณากรอกรหัสผ่านปัจจุบัน';
            }

            if (formData.newPassword && formData.newPassword.length < 8) {
                newErrors.newPassword = 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร';
            }

            if (formData.newPassword !== formData.confirmPassword) {
                newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleUploadFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    avatar: reader.result
                }));
            };
            reader.readAsDataURL(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            // สมมติว่าการอัปเดตสำเร็จ
            onSubmitSuccess(formData);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ overflow: 'auto' }}>
            <Stack spacing={3}>
                <Grid2 container spacing={2}>
                    <Grid2 size={{ xs: 12, md: 6 }} sx={{ borderRight: { xs: 'none', md: '1px solid' } }}>
                        <FormControl error={!!errors.avatar}>
                            <Stack justifyContent='center' direction='column' alignItems='center'>
                                <Avatar src={avatarPreview} sx={{ mb: 2, height: { xs: 100, lg: 300 }, width: { xs: 100, lg: 300 } }} />
                                <Button component='label' role={undefined} tabIndex={-1} variant='outlined' color='neutral'
                                    startDecorator={<CloudUpload />}
                                >
                                    Upload a file
                                    <VisuallyHiddenInput type='file' name='avatar' onChange={(e) => handleUploadFile(e)} />
                                </Button>
                            </Stack>
                        </FormControl>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 6 }}>
                        <Stack direction='column' spacing={2}>
                            <FormControl error={!!errors.name}>
                                <FormLabel>ชื่อ</FormLabel>
                                <Input
                                    name="name" value={formData.name}
                                    onChange={handleChange}
                                    placeholder="กรอกชื่อ"
                                />
                                {errors.name && (
                                    <Typography level="body-xs" color="danger">
                                        {errors.name}
                                    </Typography>
                                )}
                            </FormControl>

                            <FormControl>
                                <FormLabel>คำอธิบาย</FormLabel>
                                <Textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    minRows={3}
                                    placeholder="เพิ่มคำอธิบายเกี่ยวกับตัวคุณ"
                                />
                            </FormControl>

                            <Divider />

                            <Typography level="title-md">เปลี่ยนรหัสผ่าน</Typography>
                            <Typography level="body-sm" color="neutral">
                                หากคุณไม่ต้องการเปลี่ยนรหัสผ่าน ให้เว้นช่องเหล่านี้ว่างไว้
                            </Typography>

                            <FormControl error={!!errors.currentPassword}>
                                <FormLabel>รหัสผ่านปัจจุบัน</FormLabel>
                                <Input
                                    name="currentPassword"
                                    type={showPassword.current ? 'text' : 'password'}
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    placeholder="กรอกรหัสผ่านปัจจุบัน"
                                    endDecorator={
                                        <IconButton
                                            onClick={() => togglePasswordVisibility('current')}
                                            edge="end"
                                        >
                                            {showPassword.current ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    }
                                />
                                {errors.currentPassword && (
                                    <Typography level="body-xs" color="danger">
                                        {errors.currentPassword}
                                    </Typography>
                                )}
                            </FormControl>

                            <FormControl error={!!errors.newPassword}>
                                <FormLabel>รหัสผ่านใหม่</FormLabel>
                                <Input
                                    name="newPassword"
                                    type={showPassword.new ? 'text' : 'password'}
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    placeholder="กรอกรหัสผ่านใหม่"
                                    endDecorator={
                                        <IconButton
                                            onClick={() => togglePasswordVisibility('new')}
                                            edge="end"
                                        >
                                            {showPassword.new ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    }
                                />
                                {errors.newPassword && (
                                    <Typography level="body-xs" color="danger">
                                        {errors.newPassword}
                                    </Typography>
                                )}
                            </FormControl>

                            <FormControl error={!!errors.confirmPassword}>
                                <FormLabel>ยืนยันรหัสผ่านใหม่</FormLabel>
                                <Input
                                    name="confirmPassword"
                                    type={showPassword.confirm ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                                    endDecorator={
                                        <IconButton
                                            onClick={() => togglePasswordVisibility('confirm')}
                                            edge="end"
                                        >
                                            {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    }
                                />
                                {errors.confirmPassword && (
                                    <Typography level="body-xs" color="danger">
                                        {errors.confirmPassword}
                                    </Typography>
                                )}
                            </FormControl>
                        </Stack>

                    </Grid2>
                    <Grid2 size={12}>
                        <Divider />
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                            <Button type="submit" variant="solid" color="primary" startDecorator={<Save/>}>
                                บันทึก
                            </Button>
                        </Box>
                    </Grid2>
                </Grid2>
            </Stack>
        </Box>
    );
}