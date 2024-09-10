import Avatar from '@mui/joy/Avatar';
import Box from '@mui/joy/Box';
import Chip from '@mui/joy/Chip';
import Table from '@mui/joy/Table';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import Button from "@mui/joy/Button";
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import {useEffect, useState} from "react";
import {listCustApi} from "../../Api/Customer.js";
import {AlertWithConfirm} from "../../Dialogs/Alert.js";
import {CircularProgress} from "@mui/joy";
import {Link} from "react-router-dom";

export default function CustomerListTable() {
    const [customers, setCustomers] = useState([]);
    const [show, setShow] = useState(false);
    useEffect(() => {
        CustomerList().then((r) => console.log(r));
    }, []);
    const CustomerList = async () => {
        setShow(true);
        const {data, status} = await listCustApi();
        console.log(data, status)
        if (status === 200) {
            setCustomers(data.customers);
        } else {
            AlertWithConfirm({text: data.message})
        }
        setShow(false);
    }

    return (
        <>
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
                        <th>ชื่อ</th>
                        <th>คำอธิบาย</th>
                        <th>แพลตฟอร์ม</th>
                        <th style={{textAlign: "center"}}>#</th>
                    </tr>
                    </thead>
                    <tbody>
                    {show ? (
                        <tr>
                            <td colSpan={4} style={{textAlign: "center"}}>
                                <CircularProgress color="primary" size="sm"/>
                            </td>
                        </tr>
                    ) : (
                        customers.map((row, index) => (
                            <tr key={index}>
                                <td>
                                    <Typography>{index + 1}</Typography>
                                </td>
                                <td>
                                    <Box sx={{display: 'flex', gap: 2, alignItems: 'center'}}>
                                        <Avatar src={row.avatar} size="sm"/>
                                        <Typography>{row.name}</Typography>
                                    </Box>
                                </td>
                                <td>
                                    <Chip>
                                        <Typography>@&nbsp;{row.description}</Typography>
                                    </Chip>
                                </td>
                                <td>
                                    <Chip color={row.platform === 'line' ? 'success' : 'danger'}>
                                        <Typography>{row.platform}</Typography>
                                    </Chip>
                                </td>
                                <td style={{textAlign: "center"}}>
                                    <Link to={`/customer/detail/${row.custId}`}>
                                        <Button size='sm' variant='outlined'>
                                            <ManageAccountsIcon/>
                                        </Button>
                                    </Link>
                                </td>
                            </tr>
                        ))
                    )}
                    < /tbody>
                </Table>
            </Sheet>

        </>
    );
}