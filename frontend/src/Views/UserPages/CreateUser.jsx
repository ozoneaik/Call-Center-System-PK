import { FormLabel, Input, Checkbox, Sheet, Select, Option, Box, Button, Card } from "@mui/joy";
import { Grid2 } from "@mui/material";
import { useState } from "react";
import { storeUserApi } from "../../Api/User.js";
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import { useChatRooms } from "../../context/ChatRoomContext.jsx";
import {Save} from '@mui/icons-material';

export const CreateUser = (props) => {
    const { Refresh } = props;
    const { chatRoomsContext } = useChatRooms();
    const [user, setUser] = useState({
        empCode: '',
        email: '',
        name: '',
        real_name: '',
        description: '',
        role: 'user',
        roomId: 'ROOM01',
        password: '',
        password_confirmation: ''
    });

    const [selected, setSelected] = useState({
        list: []
    });
    const handleChangeRole = (event, newValue) => {
        console.log(newValue, 'Role');
        setUser({ ...user, role: newValue });
    }

    const handleCheckboxChange = (roomId) => {
        setSelected((prevSelected) => {
            const newList = prevSelected.list.includes(roomId)
                ? prevSelected.list.filter(id => id !== roomId) // เอา roomId ออกจาก list ถ้ามีอยู่แล้ว
                : [...prevSelected.list, roomId]; // เพิ่ม roomId เข้าไปถ้ายังไม่มี
            setUser({
                ...user,
                list: newList
            })
            return { ...prevSelected, list: newList };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('user >> ', user);
        if (user.password !== user.password_confirmation) {
            alert('รหัสผ่านไม่ตรงกัน');
            return;
        }
        const { data, status } = await storeUserApi(user);
        AlertDiaLog({
            title: data.message,
            text: data.detail,
            icon: status === 200 && 'success',
            onPassed: () => {
                status === 200 && Refresh()
            }
        });
    };

    return (
        <Sheet variant="outlined" sx={[ChatPageStyle.BoxSheet, { border: 'none' }]}>
            <Card color="primary" variant="solid" invertedColors>
                <form onSubmit={handleSubmit}>
                    <Grid2 container spacing={1} mb={1}>
                        <Grid2 size={{ xs: 12, md: 2 }}>
                            <FormLabel>รหัสพนักงาน</FormLabel>
                            <Input required value={user.empCode} type={'text'} placeholder={'ex.7001x'}
                                onChange={(e) => setUser({
                                    ...user,
                                    empCode: e.target.value,
                                    email: e.target.value + '@mail.local'
                                })}
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 2 }}>
                            <FormLabel>ชื่อ-นามสกุล (สำหรับการแสดง)</FormLabel>
                            <Input required value={user.name} type={'text'} placeholder={'ex.นายสมศรี บันลือ'}
                                onChange={(e) => setUser({ ...user, name: e.target.value })}
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 4 }}>
                            <FormLabel>ชื่อ-นามสกุล (จริง)</FormLabel>
                            <Input required value={user.real_name} type={'text'} placeholder={'ex.นายสมศรี บันลือ'}
                                onChange={(e) => setUser({ ...user, real_name: e.target.value })}
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 4 }}>
                            <FormLabel>คำอธิบาย (แผนก)</FormLabel>
                            <Input required value={user.description} type={'text'} placeholder={'ex.xxxxxxx'}
                                onChange={(e) => setUser({ ...user, description: e.target.value })}
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 4 }}>
                            <FormLabel>สิทธิ์</FormLabel>
                            <Select required value={user.role} onChange={handleChangeRole}>
                                <Option value={'admin'}>ผู้ดูแลระบบ</Option>
                                <Option value={'user'}>ผู้ใช้ทั่วไป</Option>
                            </Select>
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 4 }}>
                            <FormLabel>รหัสผ่าน</FormLabel>
                            <Input required value={user.password} type={'password'} placeholder={'*********'}
                                onChange={(e) => setUser({ ...user, password: e.target.value })}
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 4 }}>
                            <FormLabel>ยืนยันรหัสผ่าน</FormLabel>
                            <Input required value={user.password_confirmation} type={'password'}
                                placeholder={'*********'}
                                onChange={(e) => setUser({ ...user, password_confirmation: e.target.value })}
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 12 }}>
                            <FormLabel>ห้องแชท</FormLabel>
                            {chatRoomsContext.map((room, index) => (
                                <Checkbox
                                    key={index}
                                    value={room.roomId}
                                    label={room.roomName}
                                    color="primary"
                                    onChange={() => handleCheckboxChange(room.roomId)}
                                    sx={{ mr: 2 }}
                                />
                            ))}
                        </Grid2>
                    </Grid2>
                    <Button startDecorator={<Save/>} type={'submit'}>บันทึก</Button>
                </form>
            </Card>

        </Sheet>
    );
};
