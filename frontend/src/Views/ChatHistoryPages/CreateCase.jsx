import { Alert, Button, Chip, CircularProgress, Modal, ModalClose, Sheet, Stack, Typography } from "@mui/joy"
import { Lock, Warning } from "@mui/icons-material"
import { useEffect, useState } from "react"
import axiosClient from "../../Axios";
import { Grid2 } from "@mui/material";
import { AlertDiaLog } from "../../Dialogs/Alert";
import { useNavigate } from "react-router-dom";
import { allowedRoomsApi } from "../../Api/PlatformRouting.js";

export default function CreateCase({ open, setOpen, custId, tokenId }) {
    const [selectRoom, setSelecRoom] = useState({
        roomId: null,
        roomName: null
    });
    const [loading, setLoading] = useState(false);
    const [rooms, setRooms] = useState([]);
    const navigate = useNavigate();
    useEffect(() => {
        fetchRooms().finally(() => setLoading(false));
    }, []);

    const handleSelectRoom = (roomId, roomName, isAllowed) => {
        if (!isAllowed) return;
        setSelecRoom({ roomId, roomName });
    };

    const fetchRooms = async () => {
        setLoading(true);
        try {
            if (tokenId) {
                const { data, status } = await allowedRoomsApi(tokenId);
                if (status === 200) {
                    setRooms(data.rooms);
                    return;
                }
            }
            // fallback: ดึงห้องทั้งหมดถ้าไม่มี tokenId
            const { data, status } = await axiosClient.get('/chatRooms/list');
            if (status === 200) {
                setRooms(data.chatRooms.map((r) => ({ ...r, is_allowed: true })));
            }
        } catch (error) {
            console.error("Error fetching rooms:", error);
        }
    };

    const handleCreateCase = async () => {
        console.log(selectRoom, 'selectRoom');
        let Status = 400;
        let Message = 'เกิดข้อผิดพลาด';
        try {
            const { data, status } = await axiosClient.post('/case/store', {
                custId,
                roomId: selectRoom.roomId,
                roomName: selectRoom.roomName
            });
            Status = status;
            Message = data.message;
        } catch (error) {
            Status = error.response.status;
            Message = error.response.data.message;
        } finally {
            AlertDiaLog({
                title: Status === 200 ? 'สร้างเคสใหม่สำเร็จ' : 'สร้างเคสใหม่ไม่สำเร็จ',
                text: Message,
                icon: Status === 200 ? 'success' : 'error',
                onPassed : () => Status === 200 && navigate(-1)
            })
            setOpen(false);
        }

    }
    return (
        <Modal
            aria-labelledby="modal-title"
            aria-describedby="modal-desc"
            open={open} onClose={() => setOpen(false)}
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >

            <Sheet variant="outlined" sx={{ minWidth: 500, maxWidth: 1200, borderRadius: 'md', p: 3, boxShadow: 'lg' }}>
                <ModalClose variant="plain" sx={{ m: 1 }} />
                <Typography
                    component="h2" id="modal-title" level="h4"
                    textColor="inherit" sx={{ fontWeight: 'lg', mb: 1 }}
                >
                    สร้างเคสใหม่
                </Typography>
                <Alert color="warning" variant="soft" startDecorator={<Warning />}>
                    การสร้างเคสใหม่จะทำให้ระบบสร้างเคสพร้อมสถานะ 'กำลังดำเนินการ' โดยเคสดังกล่าวจะถูกจัดเก็บไว้ในห้องที่คุณเลือก
                    <br />
                    กรุณาเลือกห้องจากรายการด้านล่างเพื่อดำเนินการสร้างเคสใหม่ในห้องที่ต้องการ
                </Alert>
                {loading ? (
                    <CircularProgress />
                ) : (
                    <Grid2 container spacing={2} mt={2}>
                        {rooms.map((room, index) => {
                            const isAllowed = room.is_allowed !== false;
                            const isSelected = selectRoom.roomId === room.roomId;
                            return (
                                <Grid2 key={index} size={{ xs: 12, md: 4 }}>
                                    <Button
                                        fullWidth
                                        onClick={() => handleSelectRoom(room.roomId, room.roomName, isAllowed)}
                                        variant={isSelected ? 'solid' : 'outlined'}
                                        color={!isAllowed ? 'neutral' : 'primary'}
                                        disabled={!isAllowed}
                                        startDecorator={!isAllowed ? <Lock fontSize="small" /> : null}
                                        endDecorator={!isAllowed
                                            ? <Chip size="sm" color="danger" variant="soft">No Permission</Chip>
                                            : null
                                        }
                                        sx={{ justifyContent: 'space-between' }}
                                    >
                                        {room.roomName}
                                    </Button>
                                </Grid2>
                            );
                        })}
                        <Grid2 size={12}>
                            <Stack direction='row-reverse' spacing={1}>
                                <Button variant="solid" disabled={!selectRoom.roomId} onClick={handleCreateCase}>ตกลง</Button>
                                <Button variant="solid" color="neutral" onClick={() => setOpen(false)}>ยกเลิก</Button>
                            </Stack>
                        </Grid2>
                    </Grid2>
                )}

            </Sheet>

        </Modal>
    )
}