import {
    Box, Button, Chip, Sheet, Stack, Table, Modal, ModalDialog, ModalClose, Typography,
    FormControl, FormLabel, Input, Textarea, Switch, Divider
} from "@mui/joy";
import BreadcrumbsComponent from "../../Components/Breadcrumbs";
import { ChatPageStyle } from "../../styles/ChatPageStyle";
import { Grid2 } from "@mui/material";
import { useEffect, useState } from "react";
import axiosClient from "../../Axios";
import { Delete, Done, Edit, OfflinePinOutlined, Add } from "@mui/icons-material";

export default function AnnouncesList() {
    const [announces, setAnnounces] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({
        detail_text: '',
        start_at: '',
        end_at: '',
        is_active: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data, status } = await axiosClient.get('/announces/list');
            console.log(data, status);
            setAnnounces(data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // Reset form data
    const resetForm = () => {
        setFormData({
            detail_text: '',
            start_at: '',
            end_at: '',
            is_active: true
        });
        setSelectedItem(null);
    };

    // Handle create button click
    const handleCreate = () => {
        resetForm();
        setModalMode('create');
        setOpenModal(true);
    };

    // Handle edit button click
    const handleEdit = (item) => {
        setSelectedItem(item);
        setFormData({
            detail_text: item.detail_text || '',
            start_at: item.start_at || '',
            end_at: item.end_at || '',
            is_active: item.is_active
        });
        setModalMode('edit');
        setOpenModal(true);
    };

    // Handle form input changes
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle form submission
    const handleSubmit = async () => {
        try {
            if (modalMode === 'create') {
                const response = await axiosClient.post('/announces', formData);
                console.log('Created:', response.data);
            } else {
                const response = await axiosClient.put(`/announces/${selectedItem.id}`, formData);
                console.log('Updated:', response.data);
            }

            // Refresh data and close modal
            await fetchData();
            setOpenModal(false);
            resetForm();
        } catch (error) {
            console.error('Error saving data:', error);
            // You might want to show an error message to the user here
        }
    };

    // Handle delete
    const handleDelete = async (item) => {
        if (window.confirm(`คุณต้องการลบการแจ้งเตือน "${item.detail_text}" หรือไม่?`)) {
            try {
                await axiosClient.delete(`/announces/${item.id}`);
                console.log('Deleted item:', item.id);
                // Refresh data
                await fetchData();
            } catch (error) {
                console.error('Error deleting item:', error);
                // You might want to show an error message to the user here
            }
        }
    };

    // Handle modal close
    const handleModalClose = () => {
        setOpenModal(false);
        resetForm();
    };

    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <BreadcrumbsComponent list={[{ name: 'แจ้งเตือน' }, { name: 'รายการ' }]} />
                    <Button
                        variant="solid"
                        color="primary"
                        startDecorator={<Add />}
                        onClick={handleCreate}
                    >
                        เพิ่มการแจ้งเตือน
                    </Button>
                </Box>

                <Grid2 container spacing={2}>
                    <Grid2 size={12}>
                        <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>การแจ้งเตือน</th>
                                    <th>แจ้งเตือนตั้งแต่</th>
                                    <th>แจ้งเตือนถึง</th>
                                    <th>สถานะการแจ้งเตือน</th>
                                    <th>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {announces.data && announces.data.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.id}</td>
                                        <td>{item.detail_text}</td>
                                        <td>{item.start_at}</td>
                                        <td>{item.end_at}</td>
                                        <td>
                                            <Chip
                                                startDecorator={item.is_active ? <Done /> : <OfflinePinOutlined />}
                                                variant="solid"
                                                color={item.is_active ? 'success' : 'neutral'}
                                            >
                                                {item.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                                            </Chip>
                                        </td>
                                        <td>
                                            <Stack direction='row' spacing={1}>
                                                <Button
                                                    size="sm"
                                                    color="warning"
                                                    startDecorator={<Edit />}
                                                    onClick={() => handleEdit(item)}
                                                >
                                                    แก้ไข
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    color="danger"
                                                    startDecorator={<Delete />}
                                                    onClick={() => handleDelete(item)}
                                                >
                                                    ลบ
                                                </Button>
                                            </Stack>
                                        </td>
                                    </tr>
                                ))}
                                {announces.data && announces.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
                                            ไม่มีข้อมูลการแจ้งเตือน
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Grid2>
                </Grid2>

                {/* Modal for Create/Edit */}
                <Modal open={openModal} onClose={handleModalClose}>
                    <ModalDialog variant="outlined" role="alertdialog" sx={{ minWidth: 400 }}>
                        <ModalClose />
                        <Typography component="h2" level="h3" sx={{ mb: 2 }}>
                            {modalMode === 'create' ? 'เพิ่มการแจ้งเตือนใหม่' : 'แก้ไขการแจ้งเตือน'}
                        </Typography>
                        <Divider />

                        <Stack spacing={2} sx={{ mt: 2 }}>
                            <FormControl>
                                <FormLabel>ข้อความแจ้งเตือน</FormLabel>
                                <Textarea
                                    placeholder="กรุณาระบุข้อความแจ้งเตือน"
                                    value={formData.detail_text}
                                    onChange={(e) => handleInputChange('detail_text', e.target.value)}
                                    minRows={3}
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>วันที่เริ่มแจ้งเตือน</FormLabel>
                                <Input
                                    type="datetime-local"
                                    value={formData.start_at}
                                    onChange={(e) => handleInputChange('start_at', e.target.value)}
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>วันที่สิ้นสุดการแจ้งเตือน</FormLabel>
                                <Input
                                    type="datetime-local"
                                    value={formData.end_at}
                                    onChange={(e) => handleInputChange('end_at', e.target.value)}
                                />
                            </FormControl>

                            <FormControl>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <FormLabel>สถานะการแจ้งเตือน</FormLabel>
                                    <Switch
                                        checked={formData.is_active}
                                        onChange={(e) => handleInputChange('is_active', e.target.checked)}
                                        startDecorator={formData.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                                        color={formData.is_active ? 'success' : 'neutral'}
                                    />
                                </Box>
                            </FormControl>
                        </Stack>

                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 2 }}>
                            <Button variant="plain" color="neutral" onClick={handleModalClose}>
                                ยกเลิก
                            </Button>
                            <Button variant="solid" color="primary" onClick={handleSubmit}>
                                {modalMode === 'create' ? 'เพิ่ม' : 'บันทึก'}
                            </Button>
                        </Box>
                    </ModalDialog>
                </Modal>
            </Box>
        </Sheet>
    );
}