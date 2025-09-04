import { Alert, Button, CircularProgress, Modal, ModalClose, ModalDialog, Sheet, Stack, Typography } from "@mui/joy"
import { Warning } from "@mui/icons-material"
import { useEffect, useState } from "react"
import axiosClient from "../../Axios";
import { Grid2 } from "@mui/material";
import { AlertDiaLog } from "../../Dialogs/Alert";
import { useNavigate } from "react-router-dom";

export default function CreateCase({ open, setOpen, custId }) {
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

    const handleSelectRoom = (roomId, roomName) => {
        setSelecRoom({
            roomId: roomId,
            roomName: roomName
        });
    }

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const { data, status } = await axiosClient.get('/chatRooms/list');
            console.log(data, status);
            setRooms(data.chatRooms);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

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

            <Sheet variant="outlined" sx={{ maxWidth: 700, borderRadius: 'md', p: 3, boxShadow: 'lg' }}>
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
                    <Grid2 container spacing={1} mt={2}>
                        {rooms.map((room, index) => (
                            <Grid2 key={index} size={{ xs: 12, md: 4 }}>
                                <Button
                                    fullWidth onClick={() => handleSelectRoom(room.roomId, room.roomName)}
                                    variant={selectRoom.roomId === room.roomId ? 'solid' : 'outlined'}
                                >
                                    {room.roomName}
                                </Button>
                            </Grid2>
                        ))}
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