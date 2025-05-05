import { useState } from 'react';
import {
    Box, Typography, Avatar, Button, Card, CardContent, Divider,
    Stack, Chip, Modal, ModalDialog, ModalClose
} from "@mui/joy";
import { useAuth } from "../../context/AuthContext";
import { Edit, InsertInvitation, EditCalendar } from '@mui/icons-material';
import EditProfileForm from "./EditProfileForm";
import { Grid2 } from '@mui/material';
import axiosClient from '../../Axios';

const LabelDetail = ({ headTitle, bodyTitle }) => (
    <Box>
        <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
            {headTitle}
        </Typography>
        <Typography level="body-md">
            {bodyTitle}
        </Typography>
    </Box>
);

const DateDetail = ({ headTitle, bodyTitle }) => (
    <Grid2 size={{ xs: 12, sm: 6 }}>
        <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
            {headTitle}
        </Typography>
        <Chip
            startDecorator={headTitle === 'วันที่สร้าง' ? <InsertInvitation /> : <EditCalendar />} variant='solid'
            color={headTitle === 'วันที่สร้าง' ? 'primary' : 'warning'}
        >
            {new Date(bodyTitle).toLocaleString('th-Th')}
        </Chip>

    </Grid2>
)

export default function ProfilePage() {
    const { user } = useAuth();
    const [openEditModal, setOpenEditModal] = useState(false);
    const profileData = { ...user };

    const handleEdit = async (formDetail) => {
        setOpenEditModal(false);
        console.log('Submitting form data:', formDetail);
        const formData = new FormData();
        formData.append('name',formDetail.name);
        formDetail.avatar && formData.append('avatar', formDetail.avatar);
        formData.append('description', formDetail.description);
        formData.append('currentPassword', formDetail.currentPassword);
        formData.append('newPassword', formDetail.newPassword);
        formData.append('confirmPassword', formDetail.confirmPassword);
        formData.append('empCode', user.empCode);
        try {
            const { data, status } = await axiosClient.post('/users/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            console.log(data, status);
            window.location.reload();
        } catch (error) {
            console.log(error);
        }
    }
    return (
        <>
            <Card variant="outlined" sx={{ mb: 4 }}>
                <CardContent>
                    <Grid2 container spacing={3} sx={{ alignItems: 'center' }}>
                        <Grid2 size={{ xs: 12, md: 3 }} sx={{ borderRight: { xs: 'none', md: '1px solid' } }}>
                            <Stack direction='column' spacing={2} justifyContent='center' alignItems='center'>
                                <Avatar
                                    src={profileData.avatar}
                                    alt={profileData.name}
                                    sx={{ width: 100, height: 100, mb: 2 }}
                                />
                                <Typography level="title-lg" sx={{ mb: 1 }}>
                                    {profileData.name}
                                </Typography>
                                <Chip color="primary" variant="soft" size="sm">
                                    {profileData.role}
                                </Chip>
                            </Stack>
                        </Grid2>

                        <Grid2 size={{ xs: 12, md: 9 }}>
                            <Box sx={{ p: 2 }}>
                                <Stack spacing={2}>
                                    <LabelDetail headTitle="รหัสพนักงาน" bodyTitle={profileData.empCode} />
                                    <LabelDetail headTitle="อีเมล" bodyTitle={profileData.email} />
                                    <LabelDetail headTitle="คำอธิบาย" bodyTitle={profileData.description} />
                                    <Grid2 container spacing={2}>
                                        <DateDetail headTitle={'วันที่สร้าง'} bodyTitle={profileData.created_at} />
                                        <DateDetail headTitle={'อัปเดตล่าสุด'} bodyTitle={profileData.updated_at} />
                                    </Grid2>
                                </Stack>
                            </Box>
                        </Grid2>
                    </Grid2>
                </CardContent>

                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                    <Button
                        startDecorator={<Edit />} size='sm' variant="solid"
                        onClick={() => setOpenEditModal(true)}
                    >
                        แก้ไขโปรไฟล์
                    </Button>
                </Box>
            </Card>

            {/* Modal สำหรับแก้ไขโปรไฟล์ */}
            <Modal open={openEditModal} onClose={() => setOpenEditModal(false)}>
                <ModalDialog aria-labelledby="edit-profile-modal" size="lg" sx={{ maxWidth: 500 }} >
                    <ModalClose />
                    <Typography id="edit-profile-modal" level="h4" sx={{ mb: 3 }}>
                        แก้ไขโปรไฟล์
                    </Typography>
                    <EditProfileForm
                        userData={profileData}
                        onSubmitSuccess={(formData) => handleEdit(formData)}
                    />
                </ModalDialog>
            </Modal>
        </>
    );
}