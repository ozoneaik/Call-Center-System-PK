import FormLabel from "@mui/joy/FormLabel";
import Input from "@mui/joy/Input";
import {Checkbox, Sheet} from "@mui/joy";
import Grid from '@mui/material/Grid2';
import Select from "@mui/joy/Select";
import Option from '@mui/joy/Option';
import Button from "@mui/joy/Button";
import Box from '@mui/material/Box';
import {useState} from "react";
import {storeUserApi} from "../../Api/User.js";
import {AlertDiaLog} from "../../Dialogs/Alert.js";
import {ChatPageStyle} from "../../styles/ChatPageStyle.js";
import {useChatRooms} from "../../context/ChatRoomContext.jsx";

export const CreateUser = (props) => {
    const {Refresh} = props;
    const {chatRoomsContext} = useChatRooms();
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
        setUser({...user, role: newValue});
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
            return {...prevSelected, list: newList};
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('user >> ', user);
        if (user.password !== user.password_confirmation) {
            alert('รหัสผ่านไม่ตรงกัน');
            return;
        }
        const {data, status} = await storeUserApi(user);
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
                            <FormLabel>ชื่อ-นามสกุล (สำหรับการแสดง)</FormLabel>
                            <Input required value={user.name} type={'text'} placeholder={'ex.นายสมศรี บันลือ'}
                                   onChange={(e) => setUser({...user, name: e.target.value})}
                            />
                        </Grid>
                        <Grid size={{xs: 12, md: 3}}>
                            <FormLabel>ชื่อ-นามสกุล (จริง)</FormLabel>
                            <Input required value={user.real_name} type={'text'} placeholder={'ex.นายสมศรี บันลือ'}
                                   onChange={(e) => setUser({...user, real_name: e.target.value})}
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
                            {chatRoomsContext.map((room, index) => (
                                <Checkbox
                                    key={index}
                                    value={room.roomId}
                                    label={room.roomName}
                                    color="primary"
                                    onChange={() => handleCheckboxChange(room.roomId)}
                                    sx={{mr: 2}}
                                />
                            ))}
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
