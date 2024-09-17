import React, {useEffect, useState} from 'react';
import Table from '@mui/joy/Table';
import Typography from '@mui/joy/Typography';
import Box from '@mui/joy/Box';
import Sheet from '@mui/joy/Sheet';
import {listCustNewDmAPi} from "../../Api/Customer.js";
import Avatar from "@mui/joy/Avatar";
import Button from "@mui/joy/Button";
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import {convertDate} from "../../Components/Options.jsx";


const NewCustDmPage = () => {
    const [pending, setPending] = useState([]);
    const [progress, setProgress] = useState([]);

    useEffect(() => {
        const getCustDm = async () => {
            console.log('getCustDm')
            const {data, status} = await listCustNewDmAPi();
            console.log(data, status)
            if (status === 200) {
                setPending(data.pending);
                setProgress(data.progress)
            }
        }
        getCustDm().then();
    }, []);

    const TimeComponent = ({createdAt}) => {
        const [time, setTime] = useState(new Date(createdAt));

        useEffect(() => {
            const interval = setInterval(() => {
                setTime(prevTime => new Date(prevTime.getTime() + 1000));
            }, 1000);
            return () => clearInterval(interval);
        }, []);

        return (
            <td>{convertDate(time)}</td>
        );
    };

    const HeaderComponent = ({title}) => (
        <Box
            sx={{
                display: 'flex', gap: 1, flexWrap: 'wrap', flexDirection: {xs: 'column', sm: 'row'},
                alignItems: {xs: 'start', sm: 'center'}, justifyContent: 'space-between',
            }}
        >
            <Typography level="h2">{title}</Typography>
        </Box>
    );

    const ContentTableComponent = ({data, pending = false}) => {
        return (
            <Sheet
                className="OrderTableContainer" variant="outlined"
                sx={{
                    display: {sm: 'initial'}, width: '100%', maxHeight: 400, borderRadius: 'sm',
                    flexShrink: 1, overflow: 'auto', minHeight: 0,
                }}
            >
                <Table
                    stickyHeader hoverRow
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
                        <th>เวลาเริ่ม (H:M:S)</th>
                        <th>เวลาที่สนทนา (H:M:S)</th>
                        <th style={{textAlign: "center"}}>จัดการ</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data.length > 0 ? (
                        data.map((row, index) => (
                            <tr key={index}>
                                <td>
                                    <Box sx={{display: 'flex', gap: 2, alignItems: 'center'}}>
                                        <Avatar src={row.avatar} size="sm"/>
                                        <Typography>{row.name}</Typography>
                                    </Box>
                                </td>
                                <td>{row.userReply ? row.userReply : '-'}</td>
                                <td>{convertDate(row.created_at)}</td>
                                {
                                    !pending ?
                                        <TimeComponent createdAt={row.created_at}/> :
                                        <td> - </td>
                                }
                                <td style={{textAlign: "center"}}>
                                    <Button size='sm' variant='outlined' color="warning">
                                        <ManageAccountsIcon/>
                                    </Button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} style={{textAlign: 'center'}}>ไม่มีข้อมูล</td>
                        </tr>
                    )}
                    </tbody>
                </Table>
            </Sheet>
        );
    }
    return (
        <>
            <HeaderComponent title="กำลังสนทนา"/>
            <ContentTableComponent data={progress}/>
            <HeaderComponent title="รอดำเนินการ"/>
            <ContentTableComponent data={pending} pending={true}/>
        </>
    );
};

export default NewCustDmPage;