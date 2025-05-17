import { Box, Button, Card, Chip, CircularProgress, Divider, Grid, Input, MenuItem, Option, Select, Sheet, Stack } from "@mui/joy";
import { ChatPageStyle } from "../../styles/ChatPageStyle";
import BreadcrumbsComponent from "../../Components/Breadcrumbs";
import { useEffect, useState } from "react";
import axiosClient from "../../Axios";
import { Grid2 } from "@mui/material";
import { AlertDiaLog } from "../../Dialogs/Alert";
import { Delete, Edit } from "@mui/icons-material";

export default function StickerList() {
    const [loading, setLoading] = useState(true);
    const [stickers, setStickers] = useState([]);
    const [formData, setFormData] = useState({
        path: '',
        is_active: true,
    });
    useEffect(() => {
        fetchData().finally(() => setLoading(false));
    }, []);

    const fetchData = async () => {
        try {
            const { data, status } = await axiosClient.get('/sticker/list');
            console.log(data, status);
            setStickers(data.list);
        } catch (error) {
        }
    }

    const handleDelete = async (id) => {
        try {
            const { data, status } = await axiosClient.delete(`/sticker/delete/${id}`);
            console.log(data, status);
            if (status === 200) {
                setStickers((prev) => prev.filter((sticker) => sticker.id !== id));
            }
        } catch (error) {
            console.error('Error deleting sticker:', error);
        }
    }

    const handleChangeIsActive = (e, newValue) => {
        const { value } = e.target;
        setFormData((prev) => ({
            ...prev,
            is_active: newValue
        }))
    }

    const handleAddSticker = async (e) => {
        e.preventDefault();
        try {
            const { data, status } = await axiosClient.post('/sticker/store', formData);
            setStickers((prev) => [...prev, data.sticker]);
        } catch (error) {
            AlertDiaLog({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error.response.data.message
            });
        }
    }
    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BreadcrumbsComponent list={[{ name: 'sticker' }, { name: 'รายการ' }]} />
                </Box>
                <form onSubmit={handleAddSticker}>
                    <Stack direction='row' spacing={2}>
                        <Input onChange={(e) => setFormData((prev) => ({ ...prev, path: e.target.value }))} fullWidth type="text" />
                        <Select value={formData.is_active} onChange={(e, newValue) => handleChangeIsActive(e, newValue)}>
                            <Option value={true}>active</Option>
                            <Option value={false}>no active</Option>
                        </Select>
                        <Button type="submit">เพิ่ม</Button>
                    </Stack>
                </form>
                {loading ? (<CircularProgress />) : (
                    <>
                        {stickers.length <= 0 ? (
                            <>รายการเป็น 0</>
                        ) : <Grid2 container spacing={2} sx={{ overflow: 'auto' }}>
                            {stickers.map((sticker, index) => (
                                <Grid2 key={index} size={{ xs: 6, sm: 4, md: 2 }} >
                                    <Card>
                                        <img src={sticker.path} alt="" />
                                        <Divider />
                                        <Chip color={sticker.is_active ? 'success' : 'danger'} variant="solid">
                                            {sticker.is_active ? 'active' : 'no active'}
                                        </Chip>
                                        <Stack direction='row' spacing={1}>
                                            <Button fullWidth size="sm" startDecorator={<Delete />} color="danger" onClick={() => handleDelete(sticker.id)}>
                                                ลบ
                                            </Button>
                                            <Button fullWidth size="sm" startDecorator={<Edit />} color="warning">
                                                แก้ไข
                                            </Button>
                                        </Stack>
                                    </Card>
                                </Grid2>
                            ))}
                        </Grid2>}
                    </>
                )}
            </Box>
        </Sheet>
    )
}