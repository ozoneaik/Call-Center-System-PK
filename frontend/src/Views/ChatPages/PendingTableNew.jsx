import * as React from 'react';

import {
    Avatar, Box, Button, Chip, Divider, FormControl,
    FormLabel, Input, Modal, ModalDialog, ModalClose, Table, Sheet, IconButton,
    Typography
} from '@mui/joy';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SearchIcon from '@mui/icons-material/Search';
import { Stack } from '@mui/joy';
import { MessageOutlined, MessageSharp } from '@mui/icons-material';
import { convertFullDate, differentDate } from '../../Components/Options';
import { ChatPageStyle } from '../../styles/ChatPageStyle';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertDiaLog } from '../../Dialogs/Alert';
import { receiveApi } from '../../Api/Messages';
import { useAuth } from '../../context/AuthContext';

function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
}

export default function PendingTableNew({ setFilterPending, filterPending, disable, pending, roomId, roomName }) {
    const [order, setOrder] = React.useState('desc');
    const [selected, setSelected] = React.useState([]);
    const [open, setOpen] = React.useState(false);
    const [loadingStates, setLoadingStates] = React.useState({}); // เพิ่ม state สำหรับ loading
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const redirectChat = (select) => {
        const params = `${select.rateRef}/${select.id}/${select.custId}`;
        navigate(`/select/message/${params}/0`, {
            state: { from: location }
        });
    }

    const handleChat = ({ rateId, roomId, index }) => {
        const options = {
            title: 'ต้องการรับเรื่องหรือไม่',
            text: 'กด "ตกลง" เพื่อยืนยันรับเรื่อง',
            icon: 'info'
        };
        AlertDiaLog({
            ...options,
            onPassed: async (confirm) => {
                if (confirm) {
                    setLoadingStates(prev => ({ ...prev, [index]: true }));
                    try {
                        const { data, status } = await receiveApi(rateId, roomId);
                        if (status !== 200) {
                            AlertDiaLog({ title: data.message, text: data.detail });
                        }
                    } catch (error) {
                        AlertDiaLog({
                            title: 'เกิดข้อผิดพลาด',
                            text: 'ไม่สามารถรับเรื่องได้ กรุณาลองใหม่อีกครั้ง'
                        });
                    } finally {
                        setLoadingStates(prev => ({ ...prev, [index]: false }));
                    }
                } else { 
                    console.log('ไม่ได้ confirm');
                }
            }
        });
    };

    return (
        <React.Fragment>
            <Sheet
                className="SearchAndFilters-mobile"
                sx={{ display: { xs: 'flex', sm: 'none' }, my: 1, gap: 1 }}
            >
                <Input
                    size="sm"
                    placeholder="Search"
                    startDecorator={<SearchIcon />}
                    sx={{ flexGrow: 1 }}
                />
                <IconButton
                    size="sm"
                    variant="outlined"
                    color="neutral"
                    onClick={() => setOpen(true)}
                >
                    <FilterAltIcon />
                </IconButton>
                <Modal open={open} onClose={() => setOpen(false)}>
                    <ModalDialog aria-labelledby="filter-modal" layout="fullscreen">
                        <ModalClose />
                        <Typography id="filter-modal" level="h2">
                            Filters
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Sheet sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Button color="primary" onClick={() => setOpen(false)}>
                                Submit
                            </Button>
                        </Sheet>
                    </ModalDialog>
                </Modal>
            </Sheet>
            <Box
                className="SearchAndFilters-tabletUp"
                sx={{
                    borderRadius: 'sm',
                    display: { xs: 'none', sm: 'flex' },
                    flexWrap: 'wrap', mb: 1,
                    gap: 1.5,
                    '& > *': {
                        minWidth: { xs: '120px', md: '160px' },
                    },
                }}
            >
                <FormControl sx={{ flex: 1 }} size="sm">
                    <FormLabel sx={{ fontSize: 20, fontWeight: 'bold' }}>
                        รอดำเนินการ {filterPending.length} รายการ
                    </FormLabel>
                    <Input size="sm" placeholder="ค้นหาชื่อลูกค้าที่นี่" startDecorator={<SearchIcon />} />
                </FormControl>
            </Box>
            <Sheet
                className="OrderTableContainer"
                variant="outlined"
                sx={{
                    width: '100%',
                    borderRadius: 'sm',
                    flexShrink: 1,
                    overflow: 'auto',
                    minHeight: 0,
                }}
            >
                <Table
                    aria-labelledby="tableTitle"
                    stickyHeader
                    hoverRow
                    sx={{
                        '--TableCell-headBackground': 'var(--joy-palette-background-level1)',
                        '--Table-headerUnderlineThickness': '1px',
                        '--TableRow-hoverBackground': 'var(--joy-palette-background-level1)',
                        '--TableCell-paddingY': '4px',
                        '--TableCell-paddingX': '8px',
                    }}
                >
                    <thead>
                        <tr>
                            <th style={{ width: 240, padding: '12px 6px' }}>ชื่อลูกค้า</th>
                            <th style={{ width: 240, padding: '12px 6px' }}>เวลา</th>
                            <th style={{ width: 140, padding: '12px 6px' }}>จากห้องแชท</th>
                            <th style={{ width: 80, padding: '12px 6px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filterPending.map((row, index) => (
                            <tr key={index}>
                                <td>
                                    <Stack spacing={1}>
                                        <Stack direction='row' spacing={1} alignItems='center'>
                                            <Avatar src={row.avatar} size="sm" />
                                            <Stack spacing={1}>
                                                <Typography level="body-xs">{row.custName}</Typography>
                                                <Chip color='success' size='sm'>{row.description}</Chip>
                                            </Stack>
                                        </Stack>
                                        <Chip color='primary' startDecorator={<MessageSharp />}>
                                            {row.latest_message.contentType === 'text' ? row.latest_message.content : 'ส่งรูปภาพหรือสติกเกอร์'}
                                        </Chip>
                                    </Stack>
                                </td>
                                <td>
                                    <Stack spacing={1}>
                                        <Chip size='sm'>
                                            เมื่อ : {convertFullDate(row.updated_at)}
                                        </Chip>
                                        <TimeDisplay startTime={row.created_at} />
                                    </Stack>
                                </td>
                                <td>
                                    <Box sx={{ display: 'block', gap: 2, alignItems: 'center' }}>
                                        <Typography level="body-xs">{row.roomName}</Typography>
                                        <Typography level="body-xs">(พนักงาน : {row.from_empCode})</Typography>
                                    </Box>
                                </td>
                                <td>
                                    <Stack spacing={1}>
                                        <Button
                                            variant='soft'
                                            onClick={() => handleChat({
                                                rateId: row.rateRef,
                                                roomId: row.roomId,
                                                index: index
                                            })}
                                            disabled={(index != 0 && user.role != 'admin') || loadingStates[index]}
                                            loading={loadingStates[index]}
                                        >
                                            {loadingStates[index] ? 'กำลังรับเรื่อง..' : 'รับเรื่อง'}
                                        </Button>
                                        <Button variant='soft' onClick={() => redirectChat(row)}>
                                            ดูข้อความ
                                        </Button>
                                    </Stack>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Sheet>
        </React.Fragment>
    );
}

const TimeDisplay = ({ startTime }) => {
    const [timeDiff, setTimeDiff] = React.useState(differentDate(startTime));

    React.useEffect(() => {
        const interval = setInterval(() => {
            setTimeDiff(differentDate(startTime));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <Chip color="primary" size='sm'>
            <Typography sx={ChatPageStyle.TableText}>
                ผ่านมาแล้ว : {startTime ? timeDiff : 'ยังไม่เริ่มสนทนา'}
            </Typography>
        </Chip>
    );
};