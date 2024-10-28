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
import {useEffect, useState} from "react";
import {AlertDiaLog} from "../Dialogs/Alert.js";
import {updateUserApi} from "../Api/User.js";
import {customerUpdateApi} from "../Api/Customer.js";

export default function ModalDialog(props) {

    const {open, setOpen, event, chatRooms, Refresh} = props;
    const [selected, setSelected] = useState({});
    useEffect(() => {
        setSelected(props.selected);
    }, [])


    const handleChangeRole = (event, newValue) => {
        console.log(newValue, 'Role');
        setSelected({...selected, role: newValue});
    }

    const handleChangeRoomId = (event, newValue) => {
        console.log(newValue, 'RoomId');
        setSelected({...selected, roomId: newValue});
    }


    const handleSubmitUser = async (e) => {
        e.preventDefault();
        setOpen(false);
        const {data, status} = await updateUserApi({empCode: selected.empCode, user: selected});
        AlertDiaLog({
            title: data.message,
            text: data.detail,
            icon: status === 200 && 'success',
            onPassed: () => status === 200 && Refresh()
        });
    }

    const handleSubmitCustomer = async (e) => {
        e.preventDefault();
        setOpen(false);
        const {data, status} = await customerUpdateApi(selected);
        AlertDiaLog({
            title: data.message,
            text: data.detail,
            icon: status === 200 && 'success',
            onPassed: () => status === 200 && Refresh()
        });
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
                    {event === 'customer' ? (
                        <>
                            <Typography level="body-sm" fontWeight="bold" mb={1}>รหัสลูกค้า</Typography>
                            <Input disabled value={selected.custId} sx={{mb: 2}} fullWidth/>
                        </>
                    ) : (
                        <>
                            <Typography level="body-sm" fontWeight="bold" mb={1}>รหัสพนักงาน</Typography>
                            <Input disabled value={selected.empCode} sx={{mb: 2}} fullWidth/>
                        </>
                    )}
                    <Typography level="body-sm" fontWeight="bold" mb={1}>ชื่อ</Typography>
                    <Input
                        value={selected.custName || selected.name || ''}
                        onChange={(e) => {
                            setSelected({
                                ...selected,
                                custName: e.target.value,
                                name: e.target.value
                            })
                        }}
                        sx={{mb: 2}} fullWidth
                    />
                    <Typography level="body-sm" fontWeight="bold" mb={1}>คำอธิบาย</Typography>
                    <Textarea
                        value={selected.description} sx={{mb: 2}}
                        onChange={(e) => setSelected({...selected, description: e.target.value})}
                    />
                    {event === 'user' && (
                        <>
                            <Typography level="body-sm" fontWeight="bold" mb={1}>สิทธิ์</Typography>
                            <Select
                                name={'role'}
                                value={selected.role || ''}
                                onChange={handleChangeRole}
                                sx={{minWidth: '13rem', mb: 2}}
                                slotProps={{listbox: {sx: {width: '100%',},},}}
                            >
                                <Option value="admin">ผู้ดูแลระบบ</Option>
                                <Option value="user">ผู้ใช้ทั่วไป</Option>
                            </Select>
                            <Typography level="body-sm" fontWeight="bold" mb={1}>ห้องแชท</Typography>
                            <Select
                                name={'roomId'}
                                value={selected.roomId || ''}
                                onChange={handleChangeRoomId}
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
                            <Input onChange={(e) => setSelected({...selected, password: e.target.value})}
                                   type='password' sx={{mb: 2}} fullWidth/>
                        </>
                    )}
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