import Sheet from "@mui/joy/Sheet";
import Table from "@mui/joy/Table";
import Typography from "@mui/joy/Typography";
import Box from "@mui/joy/Box";
import Avatar from "@mui/joy/Avatar";
import Button from "@mui/joy/Button";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import DeleteIcon from "@mui/icons-material/Delete";
import {useEffect, useState} from "react";
import {deleteUserApi, userListApi} from "../../Api/User.js";
import {CircularProgress, ModalClose} from "@mui/joy";
import Modal from "@mui/joy/Modal";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Input from "@mui/joy/Input";
import Stack from "@mui/joy/Stack";
import SaveIcon from "@mui/icons-material/Save";
import ModalDialog from "@mui/joy/ModalDialog";
import {AlertStandard, AlertWithConfirm} from "../../Dialogs/Alert.js";
import Divider from "@mui/joy/Divider";


function UserTable() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [userSelected, setUserSelected] = useState({});

    useEffect(() => {
        getUsers().then();
    }, []);
    const getUsers = async () => {
        setLoading(true);
        const {data, status} = await userListApi();
        status === 200 && setUsers(data.users);
        setLoading(false)
    }

    const renderFormField = (label, value, setValue, disabled = false) => (
        <FormControl>
            <FormLabel>{label}</FormLabel>
            <Input value={value} onChange={e => setValue(e.target.value)} disabled={disabled}/>
        </FormControl>
    );

    const deleteUser = (code) => {
        AlertWithConfirm({
            text: `ต้องการลบผู้ใช้ ${code} หรือไม่`, onPassed: async (confirm) => {
                if (confirm) {
                    const {data, status} = await deleteUserApi(code);
                    AlertStandard({icon: status === 200 ? 'success' : 'error', text: data.message})
                    status === 200 && await getUsers();
                }
            }
        });
    }

    return (
        <>
            <Modal
                aria-labelledby="modal-title" aria-describedby="modal-desc"
                open={open} onClose={() => setOpen(false)}
                sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}
            >
                <ModalDialog>
                        <ModalClose variant="plain" sx={{m: 1}}/>
                        <Typography component="h2" id="modal-title" textColor="inherit" sx={{fontWeight: 'lg', mb: 1}}>
                            รายละเอียดผู้ใช้รหัส {userSelected.code}
                        </Typography>
                    <Sheet>
                        <div style={{display : 'flex', justifyContent : 'center', margin : 10}}>
                            <Avatar src={userSelected.avatar} size='lg'/>
                        </div>
                        <Divider/>
                        <Stack spacing={2} sx={{flexGrow: 1}}>
                            {renderFormField("ชื่อ", userSelected.name, (value) => setUserSelected({
                                ...userSelected, name: value
                            }))}
                            {renderFormField("คำอธิบาย", userSelected.description, (value) => setUserSelected({
                                ...userSelected, description: value
                            }))}
                            {renderFormField("เริ่มสนทนาเมื่อ", userSelected.created_at, '', true)}
                            {renderFormField("แก้ไขข้อมูลเมื่อ", userSelected.updated_at, '', true)}
                        </Stack>
                    </Sheet>
                    <Button startDecorator={<SaveIcon/>} size="sm" variant="solid">บันทึก</Button>
                </ModalDialog>

            </Modal>

            <Sheet
                className="OrderTableContainer"
                variant="outlined"
                sx={{
                    display: {sm: 'initial'}, width: '100%',
                    borderRadius: 'sm', flexShrink: 1, overflow: 'auto', minHeight: 0,
                }}
            >
                <Table
                    stickyHeader
                    hoverRow
                    sx={{
                        '--TableCell-headBackground': 'var(--joy-palette-background-level1)',
                        '--Table-headerUnderlineThickness': '1px',
                        '--TableRow-hoverBackground': 'var(--joy-palette-background-level1)',
                    }}
                >
                    <thead>
                    <tr>
                        <th>ลำดับ</th>
                        <th>รหัส</th>
                        <th>ชื่อ</th>
                        <th>สิทธิ์</th>
                        <th style={{textAlign: "center"}}>#</th>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        !loading ? (
                            users.map((row, index) => (
                                <tr key={index}>
                                    <td>
                                        <Typography>{index + 1}</Typography>
                                    </td>
                                    <td>
                                        <Typography>{row.code}</Typography>
                                    </td>
                                    <td>
                                        <Box sx={{display: 'flex', gap: 2, alignItems: 'center'}}>
                                            <Avatar src={row.avatar} size="sm"/>
                                            <Typography>{row.name}</Typography>
                                        </Box>
                                    </td>
                                    <td>
                                        <Typography>{row.role}</Typography>
                                    </td>
                                    <td style={{textAlign: "center"}}>
                                        <Button
                                            size='sm' sx={{mr: 1}} variant='outlined'
                                            onClick={() => {
                                                setUserSelected(row)
                                                setOpen(true);
                                            }}
                                        >
                                            <ManageAccountsIcon/>
                                        </Button>
                                        <Button size='sm' color='danger' variant='outlined'
                                                onClick={() => deleteUser(row.code)}>
                                            <DeleteIcon/>
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} style={{textAlign: "center"}}>
                                    <CircularProgress color="primary" size="sm"/>
                                </td>
                            </tr>
                        )
                    }
                    </tbody>
                </Table>
            </Sheet>
        </>
    );
}

export default UserTable;