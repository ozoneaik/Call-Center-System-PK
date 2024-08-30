import Avatar from '@mui/joy/Avatar';
import Button from '@mui/joy/Button';
import Chip from '@mui/joy/Chip';
import IconButton from '@mui/joy/IconButton';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import CircleIcon from '@mui/icons-material/Circle';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import {toggleMessagesPane} from "../../Components/utils.js";
import {useState} from "react";
import Modal from "@mui/joy/Modal";
import DialogTitle from "@mui/joy/DialogTitle";
import ModalDialog from "@mui/joy/ModalDialog";
import Divider from "@mui/joy/Divider";
import DialogContent from "@mui/joy/DialogContent";
import OpenInNew from '@mui/icons-material/OpenInNew';
import Box from "@mui/joy/Box";
import {Grid} from "@mui/joy";


export default function MessagesPaneHeader(props) {
    const [open, setOpen] = useState(false);
    const [sendToEmp, setSendToEmp] = useState(false);
    const {sender} = props;
    return (
        <>
            <Modal open={open} onClose={() => setOpen(false)}>
                <ModalDialog variant="outlined" role="alertdialog">
                    <DialogTitle>ตัวช่วยตอบ</DialogTitle>
                    <Divider/>
                    <DialogContent>
                        <Box component="section" sx={{p: 1,}}>
                            <Grid container spacing={1} sx={{flexGrow: 1}}>
                            {
                                [1, 2, 3, 4, 5, 23].map((item, index) => (
                                    <Grid size={4}>
                                        <Button key={index} startDecorator={<OpenInNew/>}>มีอะไรให้ฉันช่วยใหม่</Button>
                                    </Grid>
                                ))
                            }
                            </Grid>
                        </Box>
                    </DialogContent>
                </ModalDialog>
            </Modal>

            <Modal open={sendToEmp} onClose={() => setSendToEmp(false)}>
                <ModalDialog variant="outlined" role="alertdialog">
                    <DialogTitle>ส่งต่อไปยัง</DialogTitle>
                    <Divider/>
                    <DialogContent>
                        <Box component="section" sx={{p: 1,}}>
                            <Grid container spacing={1} sx={{flexGrow: 1}}>
                                {
                                    [1, 2, 3, 4, 5, 23].map((item, index) => (
                                        <Grid size={4}>
                                            <Button key={index} startDecorator={<OpenInNew/>}>8001{index}</Button>
                                        </Grid>
                                    ))
                                }
                            </Grid>
                        </Box>
                    </DialogContent>
                </ModalDialog>
            </Modal>


            <Stack
                direction="row"
                sx={{
                    justifyContent: 'space-between', py: {xs: 2, md: 2}, px: {xs: 1, md: 2},
                    borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.body',
                }}
            >
                <Stack direction="row" spacing={{xs: 1, md: 2}} sx={{alignItems: 'center'}}>
                    <IconButton
                        variant="plain" color="neutral"
                        size="sm" sx={{display: {xs: 'inline-flex', sm: 'none'}}}
                        onClick={() => toggleMessagesPane()}
                    >
                        <ArrowBackIosNewRoundedIcon/>
                    </IconButton>
                    <Avatar size="lg" src={sender.avatar}/>
                    <div>
                        <Typography
                            component="h2" noWrap
                            endDecorator={
                                sender.online ? (
                                    <Chip
                                        variant="outlined" size="sm" color="neutral" sx={{borderRadius: 'sm'}}
                                        startDecorator={
                                            <CircleIcon sx={{fontSize: 8}} color="success"/>
                                        }
                                        slotProps={{root: {component: 'span'}}}
                                    >
                                        Online
                                    </Chip>
                                ) : undefined
                            }
                            sx={{fontWeight: 'lg', fontSize: 'lg'}}
                        >
                            {sender.name}
                        </Typography>
                        <Typography level="body-sm">{sender.username}</Typography>
                    </div>
                </Stack>
                <Stack spacing={1} direction="row" sx={{alignItems: 'center'}}>
                    <Button variant="outlined" color="neutral" onClick={() => setSendToEmp(true)}>ส่งต่อ</Button>
                    <Button variant="outlined" color="neutral" onClick={() => setOpen(true)}>ช่วยตอบ</Button>
                </Stack>
            </Stack>
        </>
    );
}