import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import Button from "@mui/joy/Button";
import Tooltip from '@mui/joy/Tooltip';
import React, { act, useState } from "react";
import Modal from '@mui/joy/Modal';
import Sheet from '@mui/joy/Sheet';
import { Alert, ModalClose } from "@mui/joy";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import { pauseTalkApi } from "../../../Api/Messages.js";
import { AlertDiaLog } from "../../../Dialogs/Alert.js";
import { useNavigate } from "react-router-dom";
import { MessageStyle } from "../../../styles/MessageStyle.js";
import { use } from "react";
import { useMediaQuery } from "@mui/material";


export const PauseTalk = ({ activeId, rateId, disable }) => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const pauseTalkHandler = async () => {
        try {
            setLoading(true);
            const { data, status } = await pauseTalkApi({ activeConversationId: activeId, rateId });
            console.log(data, status);
            AlertDiaLog({
                icon: status === 200 ? 'success' : 'error',
                title: data.message,
                text: data.detail,
                onPassed: (confirm) => {
                    console.log(confirm);
                    status === 200 && navigate(-1);
                }
            })
        } finally {
            setLoading(false);
            setOpen(false);
        }
    }

    return (
        <>

            <Tooltip title="ขณะนี้อยู่ในขั้นตอนพัฒนา" color='primary' variant="solid" size='lg'>
                <Button
                    fullWidth={useMediaQuery('(max-width: 1000px)')}
                    onClick={() => setOpen(true)}
                    variant="solid" size="sm"
                    color='neutral' startDecorator={<PauseCircleIcon />}
                >
                    {!useMediaQuery('(max-width: 1000px)') && 'พักการสนทนาชั่วคราว'}
                    
                </Button>
            </Tooltip>
            <Modal
                aria-labelledby="modal-title"
                aria-describedby="modal-desc"
                open={open}
                onClose={() => setOpen(false)}
                sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}

            >
                <Sheet
                    variant="outlined"
                    sx={{ maxWidth: 700, borderRadius: 'md', p: 3, boxShadow: 'lg' }}
                >
                    <ModalClose variant="plain" sx={{ m: 1 }} />
                    <Typography
                        component="h2"
                        id="modal-title"
                        level="h4"
                        textColor="inherit"
                        sx={{ fontWeight: 'lg', mb: 1 }}
                    >
                        พักการสนทนาชั่วคราว
                    </Typography>
                    <Alert color='warning' size='lg'>
                        ระบบจะแก้ไขสถานะเคสนี้เป็น 'รอรับเรื่อง' และจัดให้เป็นคิวท้ายสุด
                        <br />เพื่อให้คุณสามารถกลับมาจัดการได้ในวันถัดไปหรือภายหลัง
                    </Alert>
                    <Stack spacing={2} mt={2}>
                        <Button loading={loading} onClick={() => pauseTalkHandler()}>ยืนยันที่จะพักการสนทนา</Button>
                    </Stack>
                </Sheet>
            </Modal>
        </>
    )
}