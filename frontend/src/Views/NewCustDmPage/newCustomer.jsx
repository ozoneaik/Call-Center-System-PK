import React, { useEffect, useState } from 'react';
import Table from '@mui/joy/Table';
import Typography from '@mui/joy/Typography';
import Box from '@mui/joy/Box';
import Sheet from '@mui/joy/Sheet';
import {listCustApi} from "../../Api/Customer.js";
import Avatar from "@mui/joy/Avatar";
import Button from "@mui/joy/Button";
import ChatIcon from '@mui/icons-material/Chat';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';

const formatTime = (date) => {
    const D = new Date(date);
    if (!(D instanceof Date) || isNaN(D.getTime())) {
        console.error('Invalid date:', date);
        return 'Invalid date';
    }
    const hours = String(D.getUTCHours()).padStart(2, '0');
    const minutes = String(D.getUTCMinutes()).padStart(2, '0');
    const seconds = String(D.getUTCSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

const HeaderComponent = ({ title }) => (
    <Box
        sx={{
            display: 'flex', gap: 1, flexWrap: 'wrap', flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'start', sm: 'center' }, justifyContent: 'space-between',
        }}
    >
        <Typography level="h2">{title}</Typography>
    </Box>
);

const ContentTableComponent = ({ data, clock }) => (
    <Sheet
        className="OrderTableContainer"
        variant="outlined"
        sx={{
            display: { sm: 'initial' }, width: '100%', maxHeight: 400, borderRadius: 'sm',
            flexShrink: 1, overflow: 'auto', minHeight: 0,
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
                <th>ชื่อลูกค้า</th>
                <th>พนักงานรับเรื่อง</th>
                <th>เวลาเริ่ม</th>
                <th>เวลาที่สนทนา</th>
                <th style={{textAlign: "center"}}>จัดการ</th>
            </tr>
            </thead>
            <tbody>
            {data.length > 0 ? (
                data.map((row, index) => (
                    <tr key={index}>
                        <td>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Avatar src={row.avatar} size="sm"/>
                                <Typography>{row.name}</Typography>
                            </Box>
                        </td>
                        <td>{row.userReply}</td>
                        <td>{formatTime(row.created_at)}</td>
                        <td>{new Date(row.created_at).toLocaleDateString()}</td>
                        <td style={{textAlign: "center"}}>
                            <Button size='sm' variant='outlined' sx={{mr: 1}}>
                                <ChatIcon/>
                            </Button>
                            <Button size='sm' variant='outlined' color="warning">
                                <ManageAccountsIcon/>
                            </Button>
                        </td>
                    </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={5} style={{ textAlign: 'center' }}>ไม่มีข้อมูล</td>
                </tr>
            )}
            </tbody>
        </Table>
    </Sheet>
);

const NewCustDmPage = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        getCustDm().then();
    }, []);

    const getCustDm = async () => {
        const {data,status} = await listCustApi();
        if (status === 200) {
            setData(data.customers)
        }
    }

    return (
        <>
            <HeaderComponent title="กำลังสนทนา" />
            <ContentTableComponent data={data}/>
            <HeaderComponent title="รอดำเนินการ" />
            <ContentTableComponent data={[]}/>
        </>
    );
};

export default NewCustDmPage;