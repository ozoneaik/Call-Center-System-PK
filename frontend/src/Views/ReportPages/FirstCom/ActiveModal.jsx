import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import DialogTitle from '@mui/joy/DialogTitle';
import Stack from '@mui/joy/Stack';
import { Box, Table, Typography } from '@mui/joy';
import { P } from '../ChartCom/P,';

export const Content = ({ title, label,totalChat }) => {
    return (
        <>
            <div style={{ marginBottom: 10 }}>
                <Typography level="title-md">
                    {title} : <Typography sx={{ color: '#fa4801' }}>{label}{totalChat && `/${totalChat}`}</Typography>
                </Typography>
            </div>
        </>
    )
}

export const ActiveModal = ({ showModal, setShowModal, selected,totalChat }) => {
    return (
        <>
            <Modal open={showModal} onClose={() => setShowModal(false)}>
                <ModalDialog>
                    <DialogTitle>รายละเอียด</DialogTitle>

                    <Stack direction='row' justifyContent='space-between' gap={{ lg: 20, md: 10 }}>
                        <Box>
                            <Content title='รหัสอ้างอิง' label={selected.id} />
                            <Content title='ห้องแชท' label={selected.roomName} />
                            <Content title='พนักงานรับเรื่อง' label={selected.empCode} />
                            <Content title='วันที่รับเรื่อง' label={selected.receiveAt} />
                            <Content title='เวลาเริ่มสนทนา' label={selected.startTime} />
                            <Content title='เวลาจบสนทนา' label={selected.totalTime} />
                            <Content title='เวลาสนทนารวม' label={selected.totalTime} />
                            <Content title='รับเรื่องจากห้อง' label={selected.from_roomId} />
                            <Content title='จำนวนแชท' label={selected.amount_chat} totalChat={totalChat}/>
                        </Box>
                        <Box>
                            <P totalChat={totalChat} amount_chat={selected.amount_chat}/>
                        </Box>
                    </Stack>


                </ModalDialog>
            </Modal>
        </>
    )
}