import Sheet from "@mui/joy/Sheet";
import Table from "@mui/joy/Table";
import {users} from "../../Components/data.jsx";
import Typography from "@mui/joy/Typography";
import Box from "@mui/joy/Box";
import Avatar from "@mui/joy/Avatar";
import Button from "@mui/joy/Button";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import DeleteIcon from "@mui/icons-material/Delete";


function UserTable() {
    return (
        <>
            <Sheet
                className="SearchAndFilters-mobile"
                sx={{display: {xs: 'flex', sm: 'none'}, my: 1, gap: 1}}
            >
            </Sheet>

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
                    {users.map((row, index) => (
                        <tr key={row.id}>
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
                    ))}
                    </tbody>
                </Table>
            </Sheet>
        </>

    );
}

export default UserTable;