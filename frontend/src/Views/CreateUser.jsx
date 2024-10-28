import FormLabel from "@mui/joy/FormLabel";
import Input from "@mui/joy/Input";
import {Sheet} from "@mui/joy";
import Grid from '@mui/material/Grid2';
import {ChatPageStyle} from "../styles/ChatPageStyle.js";
import Select from "@mui/joy/Select";
import Option from '@mui/joy/Option';
import Button from "@mui/joy/Button";
import Box from '@mui/material/Box';
import {useChatRooms} from "../context/ChatRoomContext.jsx";
import {useState} from "react";
import {storeUserApi} from "../Api/User.js";
import {AlertDiaLog} from "../Dialogs/Alert.js";

export const CreateUser = (props) => {
    const {chatRoomsContext} = useChatRooms();
    const [user, setUser] = useState({
        empCode: '',
        email: '',
        name: '',
        description: '',
        role: 'user',
        roomId: 'ROOM01',
        password: '',
        password_confirmation: ''
    });

    const handleChangeRole = (event, newValue) => {
        console.log(newValue, 'Role');
        setUser({...user, role: newValue});
    }

    const handleChangeRoomId = (event, newValue) => {
        console.log(newValue, 'RoomId');
        setUser({...user, roomId: newValue});
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (user.password !== user.password_confirmation) {
            alert('รหัสผ่านไม่ตรงกัน');
            return;
        }

        const {data, status} = await storeUserApi(user);
        AlertDiaLog({
            title: status === 200 && 'สร้างผู้ใช้สำเร็จ',
            text: data.message,
            icon: status === 200 && 'success',
            onPassed: () => {
                status === 200 && Refresh()
            }
        });
    };

    return (
        <Sheet variant="outlined" sx={[ChatPageStyle.BoxSheet, {border: 'none'}]}>
            <form onSubmit={handleSubmit}>
                <Box sx={{flexGrow: 1}}>
                    <Grid container spacing={1} mb={1}>
                        <Grid size={{xs: 12, md: 3}}>
                            <FormLabel>รหัสพนักงาน</FormLabel>
                            <Input required value={user.empCode} type={'text'} placeholder={'ex.7001x'}
                                   onChange={(e) => setUser({
                                       ...user,
                                       empCode: e.target.value,
                                       email: e.target.value + '@mail.local'
                                   })}
                            />
                        </Grid>
                        <Grid size={{xs: 12, md: 3}}>
                            <FormLabel>ชื่อ-นามสกุล</FormLabel>
                            <Input required value={user.name} type={'text'} placeholder={'ex.นายสมศรี บันลือ'}
                                   onChange={(e) => setUser({...user, name: e.target.value})}
                            />
                        </Grid>
                        <Grid size={{xs: 12, md: 6}}>
                            <FormLabel>คำอธิบาย</FormLabel>
                            <Input required value={user.description} type={'text'} placeholder={'ex.xxxxxxx'}
                                   onChange={(e) => setUser({...user, description: e.target.value})}
                            />
                        </Grid>
                        <Grid size={{xs: 12, md: 3}}>
                            <FormLabel>สิทธิ์</FormLabel>
                            <Select required value={user.role} onChange={handleChangeRole}>
                                <Option value={'admin'}>ผู้ดูแลระบบ</Option>
                                <Option value={'user'}>ผู้ใช้ทั่วไป</Option>
                            </Select>
                        </Grid>
                        <Grid size={{xs: 12, md: 3}}>
                            <FormLabel>ห้องแชท</FormLabel>
                            <Select required value={user.roomId} onChange={handleChangeRoomId}>
                                {chatRoomsContext.map((chatRoom, index) => (
                                    <Option disabled={chatRoom.roomId === 'ROOM00'} key={index} value={chatRoom.roomId}>
                                        {chatRoom.roomName}
                                    </Option>
                                ))}
                            </Select>
                        </Grid>
                        <Grid size={{xs: 12, md: 3}}>
                            <FormLabel>รหัสผ่าน</FormLabel>
                            <Input required value={user.password} type={'password'} placeholder={'*********'}
                                   onChange={(e) => setUser({...user, password: e.target.value})}
                            />
                        </Grid>
                        <Grid size={{xs: 12, md: 3}}>
                            <FormLabel>ยืนยันรหัสผ่าน</FormLabel>
                            <Input required value={user.password_confirmation} type={'password'}
                                   placeholder={'*********'}
                                   onChange={(e) => setUser({...user, password_confirmation: e.target.value})}
                            />
                        </Grid>

                    </Grid>
                </Box>
                <Button type={'submit'}>บันทึก</Button>
            </form>
        </Sheet>
    );
};
