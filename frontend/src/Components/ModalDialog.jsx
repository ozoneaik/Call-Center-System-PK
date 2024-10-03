import {CustomerStyle} from "../styles/CustomerStyle.js";
import {Box, Modal, Sheet, Textarea} from "@mui/joy";
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Typography from "@mui/joy/Typography";
import Avatar from "@mui/joy/Avatar";
import Input from "@mui/joy/Input";
import Divider from "@mui/joy/Divider";
import {convertFullDate} from "./Options.jsx";
import Button from "@mui/joy/Button";
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

export default function ModalDialog({open, setOpen, selected, event, chatRooms}) {
    let newData = {...selected};
    const handleChange = (event, newValue) => {
        newData = {...newData, role: newValue}
    }
    const handleSubmitUser = async (e) => {
        console.log(newData);
        e.preventDefault();
        setOpen(false);
    }
    const handleSubmitCustomer = async (e) => {
        console.log(newData);
        e.preventDefault();
        setOpen(false);
    }
    return (
        <Modal open={open} onClose={() => setOpen(false)} sx={CustomerStyle.Modal}>
            <Sheet variant="outlined" sx={CustomerStyle.ModalSheet}>
                <Typography level="h4" mb={2} textAlign="center" fontWeight="bold">
                    แก้ไขข้อมูลลูกค้า {event}
                </Typography>
                <Box sx={{display: 'flex', justifyContent: 'center', mb: 2}}>
                    <Avatar src={selected.avatar} sx={{width: 80, height: 80, boxShadow: 'md'}}/>
                </Box>
                <form onSubmit={event === 'user' ? handleSubmitUser : handleSubmitCustomer}>
                    {
                        event === 'customer' && (
                            <>
                                <Typography level="body-sm" fontWeight="bold" mb={1}>รหัสลูกค้า</Typography>
                                <Input disabled value={selected.custId} sx={{mb: 2}} fullWidth/>
                            </>
                        )
                    }

                    <Typography level="body-sm" fontWeight="bold" mb={1}>ชื่อ</Typography>
                    <Input value={selected.custName || selected.name} sx={{mb: 2}} fullWidth/>

                    <Typography level="body-sm" fontWeight="bold" mb={1}>คำอธิบาย</Typography>
                    <Textarea value={selected.description} sx={{mb: 2}}/>

                    {
                        event === 'user' && (
                            <>
                                <Typography level="body-sm" fontWeight="bold" mb={1}>สิทธิ์</Typography>
                                <Select
                                    defaultValue={selected.role}
                                    onChange={handleChange}
                                    sx={{minWidth: '13rem', mb: 2}}
                                    slotProps={{listbox: {sx: {width: '100%',},},}}
                                >
                                    <Option value="admin">ผู้ดูแลระบบ</Option>
                                    <Option value="user">ผู้ใช้ทั่วไป</Option>
                                </Select>
                                <Typography level="body-sm" fontWeight="bold" mb={1}>ห้องแชท</Typography>
                                <Select
                                    defaultValue={selected.roomId}
                                    onChange={handleChange}
                                    sx={{minWidth: '13rem', mb: 2}}
                                    slotProps={{listbox: {sx: {width: '100%'}}}}
                                >
                                    {
                                        chatRooms.map((room, index) => (
                                            <Option key={index} value={room.roomId}>
                                                {room.roomName}
                                            </Option>
                                        ))
                                    }
                                </Select>
                                <Typography level="body-sm" fontWeight="bold" mb={1}>รหัสผ่านใหม่</Typography>
                                <Input type='password' sx={{mb: 2}} fullWidth/>
                            </>
                        )
                    }

                    <Divider sx={{my: 2}}/>

                    <Typography level="body-sm" fontWeight="bold" mb={1}>สร้างเมื่อ</Typography>
                    <Input disabled value={convertFullDate(selected.created_at)} sx={{mb: 2}} fullWidth/>

                    <Typography level="body-sm" fontWeight="bold" mb={1}>อัพเดทเมื่อ</Typography>
                    <Input disabled value={convertFullDate(selected.updated_at)} sx={{mb: 3}} fullWidth/>

                    <Box sx={{display: 'flex', justifyContent: 'flex-end', gap: 1}}>
                        <Button startDecorator={<CloseIcon/>} variant="outlined" color="neutral"
                                onClick={() => setOpen(false)}>
                            ยกเลิก
                        </Button>
                        <Button type="submit" startDecorator={<SaveIcon/>}>
                            บันทึก
                        </Button>
                    </Box>
                </form>
            </Sheet>
        </Modal>
    )
}