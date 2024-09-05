import Sheet from "@mui/joy/Sheet";
import Table from "@mui/joy/Table";
import Typography from "@mui/joy/Typography";
import Box from "@mui/joy/Box";
import Avatar from "@mui/joy/Avatar";
import Button from "@mui/joy/Button";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import DeleteIcon from "@mui/icons-material/Delete";
import {useEffect, useState} from "react";
import {userListApi} from "../../Api/User.js";
import {CircularProgress} from "@mui/joy";


function UserTable() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getUsers().then(()=>{});
    },[]);
    const getUsers = async () => {
        setLoading(true);
        const {data,status} = await userListApi();
        if (status === 200) {
            setUsers(data.users);
        }
        setLoading(false)
    }
    return (
        <>
            <Sheet
                className="OrderTableContainer"
                variant="outlined"
                sx={{
                    display: { sm: 'initial'}, width: '100%',
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
                        <th>ชื่อ</th>
                        <th style={{textAlign : "center"}}>#</th>
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
                                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                            <Avatar src={row.avatar} size="sm"/>
                                            <Typography>{row.name}</Typography>
                                        </Box>
                                    </td>
                                    <td  style={{textAlign : "center"}}>
                                        <Button size='sm' sx={{mr : 1}} variant='outlined'>
                                            <ManageAccountsIcon/>
                                        </Button>
                                        <Button size='sm' color='danger' variant='outlined'>
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