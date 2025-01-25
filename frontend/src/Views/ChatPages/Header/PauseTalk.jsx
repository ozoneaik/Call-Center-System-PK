import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import Button from "@mui/joy/Button";
import Tooltip from '@mui/joy/Tooltip';
import React, {act, useState} from "react";
import Modal from '@mui/joy/Modal';
import Sheet from '@mui/joy/Sheet';
import {Alert, ModalClose} from "@mui/joy";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import {pauseTalkApi} from "../../../Api/Messages.js";
import {AlertDiaLog} from "../../../Dialogs/Alert.js";
import { useNavigate } from "react-router-dom";
import {MessageStyle} from "../../../styles/MessageStyle.js";


export const PauseTalk = ({activeId,rateId,disable}) => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const pauseTalkHandler = async () => {
        const {data, status} = await pauseTalkApi({activeConversationId : activeId, rateId});
        console.log(data,status);
        AlertDiaLog({
            icon: status === 200 ? 'success' : 'error',
            title: data.message,
            text: data.detail,
            onPassed: (confirm) => {
                console.log(confirm);
                status === 200 && navigate(-1);
            }
        })
        setOpen(false);
    }

    return (
        <>

            <Tooltip title="ขณะนี้อยู่ในขั้นตอนพัฒนา" color='primary' variant="solid" size='lg'>
                <Button
                    onClick={() => setOpen(true)}
                    variant="outlined" size="sm"
                    color='neutral'
                >
                    <PauseCircleIcon/>
                    <Typography color={disable ? '' : 'neutral'} fontSize='small' sx={MessageStyle.PaneHeader.BtnText}>
                        พักการสนทนาชั่วคราว
                    </Typography>
                </Button>
            </Tooltip>
            <Modal
                aria-labelledby="modal-title"
                aria-describedby="modal-desc"
                open={open}
                onClose={() => setOpen(false)}
                sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}

            >
                <Sheet
                    variant="outlined"
                    sx={{maxWidth: 700, borderRadius: 'md', p: 3, boxShadow: 'lg'}}
                >
                    <ModalClose variant="plain" sx={{m: 1}}/>
                    <Typography
                        component="h2"
                        id="modal-title"
                        level="h4"
                        textColor="inherit"
                        sx={{fontWeight: 'lg', mb: 1}}
                    >
                        พักการสนทนาชั่วคราว
                    </Typography>
                    <Alert color='warning' size='lg'>
                        ระบบจะแก้ไขสถานะเคสนี้เป็น 'รอรับเรื่อง' และจัดให้เป็นคิวท้ายสุด
                        <br/>เพื่อให้คุณสามารถกลับมาจัดการได้ในวันถัดไปหรือภายหลัง
                    </Alert>
                    <Stack spacing={2} mt={2}>
                        <Button onClick={()=>pauseTalkHandler()}>ยืนยันที่จะพักการสนทนา</Button>
                    </Stack>
                </Sheet>
            </Modal>
        </>
    )
}