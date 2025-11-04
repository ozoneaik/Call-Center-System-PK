// import * as React from 'react';
// import Avatar from '@mui/joy/Avatar';
// import Box from '@mui/joy/Box';
// import Button from '@mui/joy/Button';
// import Chip from '@mui/joy/Chip';
// import Divider from '@mui/joy/Divider';
// import FormControl from '@mui/joy/FormControl';
// import FormLabel from '@mui/joy/FormLabel';
// import Input from '@mui/joy/Input';
// import Modal from '@mui/joy/Modal';
// import ModalDialog from '@mui/joy/ModalDialog';
// import ModalClose from '@mui/joy/ModalClose';
// import Select from '@mui/joy/Select';
// import Option from '@mui/joy/Option';
// import Table from '@mui/joy/Table';
// import Sheet from '@mui/joy/Sheet';
// import IconButton from '@mui/joy/IconButton';
// import Typography from '@mui/joy/Typography';
// import FilterAltIcon from '@mui/icons-material/FilterAlt';
// import SearchIcon from '@mui/icons-material/Search';
// import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
// import BlockIcon from '@mui/icons-material/Block';
// import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
// import { AccessAlarm, DateRange, History, MessageSharp, Send } from '@mui/icons-material';
// import { Badge, Stack } from '@mui/joy';
// import { ChatPageStyle } from '../../styles/ChatPageStyle';
// import { convertFullDate, differentDate } from '../../Components/Options';
// import { Link, useLocation, useNavigate } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
// import { AlertDiaLog } from '../../Dialogs/Alert';
// import { endTalkAllProgressApi } from '../../Api/Messages';



// function descendingComparator(a, b, orderBy) {
//     if (b[orderBy] < a[orderBy]) {
//         return -1;
//     }
//     if (b[orderBy] > a[orderBy]) {
//         return 1;
//     }
//     return 0;
// }

// export default function ProgressTable({ roomId,
//     progress,
//     filterProgress,
//     setFilterProgress,
//     showMyCasesOnly,
//     setShowMyCasesOnly, }) {
//     console.log(filterProgress);

//     const [order, setOrder] = React.useState('desc');
//     const [selected, setSelected] = React.useState([]);
//     const [open, setOpen] = React.useState(false);
//     const navigate = useNavigate();
//     const location = useLocation();
//     const { user } = useAuth();

//     const TimeDisplay = ({ startTime }) => {
//         const [timeDiff, setTimeDiff] = React.useState(() => differentDate(startTime));

//         React.useEffect(() => {
//             const interval = setInterval(() => {
//                 setTimeDiff(differentDate(startTime));
//             }, 1000);
//             return () => clearInterval(interval);
//         }, [startTime]);

//         return (
//             <Chip color="primary" variant="soft" startDecorator={<AccessAlarm />}>
//                 <Typography>
//                     เวลาที่สนทนา : {startTime ? timeDiff : "ยังไม่เริ่มสนทนา"}
//                 </Typography>
//             </Chip>
//         );
//     };

//     const handleChat = (rateId, activeId, custId) => {
//         setFilterProgress((prev) =>
//             prev.map((item) =>
//                 item.custId === custId ? { ...item, isUnread: false } : item
//             )
//         );

//         let unreadIds = JSON.parse(localStorage.getItem("unreadCustIds") || "[]");
//         unreadIds = unreadIds.filter((id) => id !== custId);
//         localStorage.setItem("unreadCustIds", JSON.stringify(unreadIds));

//         const params = `${rateId}/${activeId}/${custId}`;
//         navigate(`/select/message/${params}/1`, {
//             state: { from: location },
//         });
//     };

//     const handleMyCasesFilter = (checked) => {
//         if (checked) {
//             const myCases = progress.filter(
//                 (data) => data.empCode === user.empCode || data.empId === user.id
//             );
//             setFilterProgress(myCases);
//         } else {
//             setFilterProgress(progress);
//         }
//     };

//     const handleCheckboxChange = (event, value) => {
//         const isChecked = value;
//         setShowMyCasesOnly(isChecked);
//         handleMyCasesFilter(isChecked);
//     };

//     const handleEndTalkAll = () => {
//         AlertDiaLog({
//             title: "จบการสนทนาทั้งหมด",
//             text: "คุณต้องการจบการสนทนาทั้งหมดที่กำลังดำเนินการอยู่หรือไม่ ?",
//             icon: "question",
//             onPassed: async (confirm) => {
//                 if (confirm) {
//                     const { data, status } = await endTalkAllProgressApi({
//                         roomId,
//                         list: progress,
//                     });
//                     AlertDiaLog({
//                         title: data.message,
//                         text: data.detail,
//                         icon: status === 200 ? "success" : "error",
//                         onPassed: () => status === 200 && window.location.reload(),
//                     });
//                 }
//             },
//         });
//     };


//     const renderFilters = () => (
//         <React.Fragment>
//             <FormControl size="sm">
//                 <FormLabel>เคสที่แสดง</FormLabel>
//                 <Select
//                     defaultValue={showMyCasesOnly}
//                     size="sm" onChange={(e, newValue) => handleCheckboxChange(e, newValue)}
//                     placeholder="Filter by status"
//                     slotProps={{ button: { sx: { whiteSpace: 'nowrap' } } }}
//                 >
//                     <Option value={true}>เคสของฉัน</Option>
//                     <Option value={false}>เคสทั้งหมด</Option>
//                 </Select>
//             </FormControl>
//             <FormControl size="sm">
//                 <FormLabel sx={{ visibility: 'hidden' }}>จบการสนทนาทั้งหมด</FormLabel>
//                 <Button
//                     onClick={handleEndTalkAll} color='warning'
//                     startDecorator={<Send />} size='sm'
//                 >
//                     จบการสนทนาทั้งหมด
//                 </Button>
//             </FormControl>
//             <FormControl size="sm">
//                 <FormLabel sx={{ visibility: 'hidden' }}>ประวัติแชททั้งหมด</FormLabel>
//                 <Button
//                     component={Link}
//                     to={"/chatHistory"}
//                     color='neutral' startDecorator={<History />} size='sm'
//                 >
//                     ประวัติแชททั้งหมด
//                 </Button>
//             </FormControl>

//         </React.Fragment>
//     );
//     return (
//         <React.Fragment>
//             <Sheet
//                 className="SearchAndFilters-mobile"
//                 sx={{ display: { xs: 'flex', sm: 'none' }, my: 1, gap: 1 }}
//             >
//                 <Input
//                     size="sm"
//                     placeholder="Search"
//                     startDecorator={<SearchIcon />}
//                     sx={{ flexGrow: 1 }}
//                 />
//                 <IconButton
//                     size="sm"
//                     variant="outlined"
//                     color="neutral"
//                     onClick={() => setOpen(true)}
//                 >
//                     <FilterAltIcon />
//                 </IconButton>
//                 <Modal open={open} onClose={() => setOpen(false)}>
//                     <ModalDialog aria-labelledby="filter-modal" layout="fullscreen">
//                         <ModalClose />
//                         <Typography id="filter-modal" level="h2">
//                             Filters
//                         </Typography>
//                         <Divider sx={{ my: 2 }} />
//                         <Sheet sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
//                             {renderFilters()}
//                             <Button color="primary" onClick={() => setOpen(false)}>
//                                 Submit
//                             </Button>
//                         </Sheet>
//                     </ModalDialog>
//                 </Modal>
//             </Sheet>
//             <Box
//                 className="SearchAndFilters-tabletUp"
//                 sx={{
//                     borderRadius: 'sm',
//                     display: { xs: 'none', sm: 'flex' },
//                     flexWrap: 'wrap', mb: 1,
//                     gap: 1.5,
//                     '& > *': {
//                         minWidth: { xs: '120px', md: '160px' },
//                     },
//                 }}
//             >
//                 <FormControl sx={{ flex: 1 }} size="sm">
//                     <FormLabel sx={{ fontSize: 20, fontWeight: 'bold' }}>
//                         กำลังดำเนินการ {filterProgress.length} รายการ
//                     </FormLabel>
//                     <Input size="sm" placeholder="ค้นหาชื่อลูกค้าที่นี่" startDecorator={<SearchIcon />} />
//                 </FormControl>
//                 {renderFilters()}
//             </Box>
//             <Sheet
//                 className="OrderTableContainer"
//                 variant="outlined"
//                 sx={{
//                     width: '100%',
//                     borderRadius: 'sm',
//                     flexShrink: 1,
//                     overflow: 'auto',
//                     minHeight: 0,
//                 }}
//             >
//                 <Table
//                     aria-labelledby="tableTitle"
//                     stickyHeader
//                     hoverRow
//                     sx={{
//                         '--TableCell-headBackground': 'var(--joy-palette-background-level1)',
//                         '--Table-headerUnderlineThickness': '1px',
//                         '--TableRow-hoverBackground': 'var(--joy-palette-background-level1)',
//                         '--TableCell-paddingY': '4px',
//                         '--TableCell-paddingX': '8px',
//                     }}
//                 >
//                     <thead>
//                         <tr>
//                             <th style={{ width: 240, padding: '12px 6px' }}>ชื่อลูกค้า</th>
//                             <th style={{ width: 140, padding: '12px 6px' }}>พนักงานรับเรื่อง</th>
//                             <th style={{ width: 240, padding: '12px 6px' }}>วันที่รับเรื่อง</th>
//                             <th style={{ width: 240, padding: '12px 6px' }}>เวลา</th>
//                             <th style={{ width: 80, padding: '12px 6px' }}></th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {filterProgress.map((row, index) => (
//                             <tr key={index}>
//                                 <td>
//                                     <Stack spacing={1}>
//                                         <Stack direction='row' spacing={1} alignItems='center'>
//                                             {
//                                                 row.isUnread && row.latest_message.sender?.custId ? (
//                                                     <Badge
//                                                         color="success"
//                                                         variant="solid"
//                                                         size="md"
//                                                         anchorOrigin={{ vertical: "top", horizontal: "left" }}
//                                                         badgeInset="8%"
//                                                     >
//                                                         <Avatar size="md" sx={{ mr: 0 }} src={row.avatar || ""} />
//                                                     </Badge>
//                                                 ) : (
//                                                     <Avatar src={row.avatar} size="sm" />
//                                                 )
//                                             }
//                                             <Stack spacing={1}>
//                                                 <Box display='flex' justifyContent='flex-start' alignItems='center' gap={1}>
//                                                     <Typography level="body-xs">{row.custName}</Typography>|
//                                                     <Typography level="body-xs" color='primary'>ID : {row.pcust_id}</Typography>
//                                                 </Box>
//                                                 <Chip color='success' size='sm'>{row.description}</Chip>
//                                             </Stack>
//                                         </Stack>
//                                         <Chip color='primary' startDecorator={<MessageSharp />}>
//                                             {row.latest_message.contentType === 'text' ? row.latest_message.content : 'ส่งรูปภาพหรือสติกเกอร์'}
//                                         </Chip>
//                                     </Stack>
//                                 </td>
//                                 <td>
//                                     <Typography level="body-xs">{row.empName}</Typography>
//                                 </td>
//                                 <td>
//                                     <Chip
//                                         variant="soft"
//                                         color="success"
//                                         startDecorator={<DateRange />}
//                                     >
//                                         <Typography sx={ChatPageStyle.TableText}>
//                                             วันที่รับเรื่อง	:
//                                             {row.receiveAt
//                                                 ? convertFullDate(row.receiveAt)
//                                                 : "ยังไม่เริ่มสนทนา"}
//                                         </Typography>
//                                     </Chip>
//                                 </td>
//                                 <td>
//                                     <Stack spacing={1}>
//                                         <Chip
//                                             variant="soft"
//                                             color="warning"
//                                             startDecorator={<DateRange />}
//                                         >
//                                             <Typography sx={ChatPageStyle.TableText}>
//                                                 เวลาเรื่ม :{" "}
//                                                 {row.startTime
//                                                     ? convertFullDate(row.startTime)
//                                                     : "ยังไม่เริ่มสนทนา"}
//                                             </Typography>
//                                         </Chip>
//                                         <TimeDisplay startTime={row.startTime} />
//                                     </Stack>
//                                 </td>
//                                 <td>
//                                     <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
//                                         <Button onClick={() => handleChat(row.rateRef, row.id, row.custId)}>
//                                             ดูข้อความ
//                                         </Button>
//                                     </Box>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </Table>
//             </Sheet>
//         </React.Fragment>
//     );
// }

//------------------------------New Version----------------------------------
import * as React from 'react';
import Avatar from '@mui/joy/Avatar';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Chip from '@mui/joy/Chip';
import Divider from '@mui/joy/Divider';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Table from '@mui/joy/Table';
import Sheet from '@mui/joy/Sheet';
import IconButton from '@mui/joy/IconButton';
import Typography from '@mui/joy/Typography';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SearchIcon from '@mui/icons-material/Search';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import BlockIcon from '@mui/icons-material/Block';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import { AccessAlarm, DateRange, History, MessageSharp, Send } from '@mui/icons-material';
import { Badge, Stack } from '@mui/joy';
import { ChatPageStyle } from '../../styles/ChatPageStyle';
import { convertFullDate, differentDate } from '../../Components/Options';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertDiaLog } from '../../Dialogs/Alert';
import { endTalkAllProgressApi } from '../../Api/Messages';



function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
}

export default function ProgressTable({ roomId,
    progress,
    filterProgress,
    setFilterProgress,
    showMyCasesOnly,
    setShowMyCasesOnly, }) {
    console.log(filterProgress);

    const [order, setOrder] = React.useState('desc');
    const [selected, setSelected] = React.useState([]);
    const [open, setOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    React.useEffect(() => {
        if (!searchTerm) {
            setFilterProgress(showMyCasesOnly
                ? progress.filter(
                    (data) => data.empCode === user.empCode || data.empId === user.id
                )
                : progress
            );
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = progress.filter((row) =>
            row.custName?.toLowerCase().includes(term)
        );

        const finalFiltered = showMyCasesOnly
            ? filtered.filter(
                (data) => data.empCode === user.empCode || data.empId === user.id
            )
            : filtered;

        setFilterProgress(finalFiltered);
    }, [searchTerm, showMyCasesOnly, progress]);

    const TimeDisplay = ({ startTime }) => {
        const [timeDiff, setTimeDiff] = React.useState(() => differentDate(startTime));

        React.useEffect(() => {
            const interval = setInterval(() => {
                setTimeDiff(differentDate(startTime));
            }, 1000);
            return () => clearInterval(interval);
        }, [startTime]);

        return (
            <Chip color="primary" variant="soft" startDecorator={<AccessAlarm />}>
                <Typography>
                    เวลาที่สนทนา : {startTime ? timeDiff : "ยังไม่เริ่มสนทนา"}
                </Typography>
            </Chip>
        );
    };

    const handleChat = (rateId, activeId, custId) => {
        setFilterProgress((prev) =>
            prev.map((item) =>
                item.custId === custId ? { ...item, isUnread: false } : item
            )
        );

        let unreadIds = JSON.parse(localStorage.getItem("unreadCustIds") || "[]");
        unreadIds = unreadIds.filter((id) => id !== custId);
        localStorage.setItem("unreadCustIds", JSON.stringify(unreadIds));

        const params = `${rateId}/${activeId}/${custId}`;
        navigate(`/select/message/${params}/1`, {
            state: { from: location },
        });
    };

    const handleMyCasesFilter = (checked) => {
        if (checked) {
            const myCases = progress.filter(
                (data) => data.empCode === user.empCode || data.empId === user.id
            );
            setFilterProgress(myCases);
        } else {
            setFilterProgress(progress);
        }
    };

    const handleCheckboxChange = (event, value) => {
        const isChecked = value;
        setShowMyCasesOnly(isChecked);
        handleMyCasesFilter(isChecked);
    };

    const handleEndTalkAll = () => {
        AlertDiaLog({
            title: "จบการสนทนาทั้งหมด",
            text: "คุณต้องการจบการสนทนาทั้งหมดที่กำลังดำเนินการอยู่หรือไม่ ?",
            icon: "question",
            onPassed: async (confirm) => {
                if (confirm) {
                    const { data, status } = await endTalkAllProgressApi({
                        roomId,
                        list: progress,
                    });
                    AlertDiaLog({
                        title: data.message,
                        text: data.detail,
                        icon: status === 200 ? "success" : "error",
                        onPassed: () => status === 200 && window.location.reload(),
                    });
                }
            },
        });
    };


    const renderFilters = () => (
        <React.Fragment>
            <FormControl size="sm">
                <FormLabel>เคสที่แสดง</FormLabel>
                <Select
                    value={showMyCasesOnly}
                    size="sm" onChange={(e, newValue) => handleCheckboxChange(e, newValue)}
                    placeholder="Filter by status"
                    slotProps={{ button: { sx: { whiteSpace: 'nowrap' } } }}
                >
                    <Option value={true}>เคสของฉัน</Option>
                    <Option value={false}>เคสทั้งหมด</Option>
                </Select>
            </FormControl>
            <FormControl size="sm">
                <FormLabel sx={{ visibility: 'hidden' }}>จบการสนทนาทั้งหมด</FormLabel>
                <Button
                    onClick={handleEndTalkAll} color='warning'
                    startDecorator={<Send />} size='sm'
                >
                    จบการสนทนาทั้งหมด
                </Button>
            </FormControl>
            <FormControl size="sm">
                <FormLabel sx={{ visibility: 'hidden' }}>ประวัติแชททั้งหมด</FormLabel>
                <Button
                    component={Link}
                    to={"/chatHistory"}
                    color='neutral' startDecorator={<History />} size='sm'
                >
                    ประวัติแชททั้งหมด
                </Button>
            </FormControl>

        </React.Fragment>
    );
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
                            {renderFilters()}
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
                    py: 2,
                    px: 2,
                    bgcolor: 'background.surface',
                    display: { xs: 'none', sm: 'flex' },
                    flexWrap: 'wrap',
                    mb: 2,
                    gap: 2,
                    alignItems: 'flex-end',
                    boxShadow: 'sm',
                }}
            >
                <FormControl sx={{ flex: 1, minWidth: '250px' }} size="sm">
                    <FormLabel sx={{ fontSize: 18, fontWeight: 'bold', mb: 1 }}>
                        กำลังดำเนินการ
                        <Chip
                            size="sm"
                            color="primary"
                            variant="solid"
                            sx={{ ml: 1 }}
                        >
                            {filterProgress.length}
                        </Chip>
                        รายการ
                    </FormLabel>
                    {/* <Input
                        size="sm"
                        placeholder="ค้นหาชื่อลูกค้าที่นี่"
                        startDecorator={<SearchIcon />}
                        sx={{
                            '--Input-focusedThickness': '2px',
                        }}
                    /> */}
                    <Input
                        size="sm"
                        placeholder="ค้นหาชื่อลูกค้าที่นี่"
                        startDecorator={<SearchIcon />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </FormControl>
                {renderFilters()}
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
                    boxShadow: 'sm',
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
                        '--TableCell-paddingY': '12px',
                        '--TableCell-paddingX': '16px',
                    }}
                >
                    <thead>
                        <tr>
                            <th style={{ width: 280, padding: '16px', textAlign: 'left' }}>
                                <Typography level="title-sm" fontWeight="bold">
                                    ชื่อลูกค้า
                                </Typography>
                            </th>
                            <th style={{ width: 160, padding: '16px', textAlign: 'left' }}>
                                <Typography level="title-sm" fontWeight="bold">
                                    พนักงานรับเรื่อง
                                </Typography>
                            </th>
                            <th style={{ width: 240, padding: '16px', textAlign: 'left' }}>
                                <Typography level="title-sm" fontWeight="bold">
                                    วันที่รับเรื่อง
                                </Typography>
                            </th>
                            <th style={{ width: 280, padding: '16px', textAlign: 'left' }}>
                                <Typography level="title-sm" fontWeight="bold">
                                    เวลา
                                </Typography>
                            </th>
                            <th style={{ width: 120, padding: '16px', textAlign: 'center' }}>
                                <Typography level="title-sm" fontWeight="bold">
                                    การดำเนินการ
                                </Typography>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filterProgress.map((row, index) => (
                            <tr key={index}>
                                <td>
                                    <Stack spacing={1}>
                                        <Stack direction='row' spacing={1} alignItems='center'>
                                            {
                                                row.isUnread && row.latest_message.sender?.custId ? (
                                                    <Badge
                                                        color="success"
                                                        variant="solid"
                                                        size="md"
                                                        anchorOrigin={{ vertical: "top", horizontal: "left" }}
                                                        badgeInset="8%"
                                                    >
                                                        <Avatar size="md" sx={{ mr: 0 }} src={row.avatar || ""} />
                                                    </Badge>
                                                ) : (
                                                    <Avatar src={row.avatar} size="sm" />
                                                )
                                            }
                                            <Stack spacing={1}>
                                                <Box display='flex' justifyContent='flex-start' alignItems='center' gap={1}>
                                                    <Typography level="body-xs">{row.custName}</Typography>|
                                                    <Typography level="body-xs" color='primary'>ID : {row.pcust_id}</Typography>
                                                </Box>
                                                <Chip color='success' size='sm'>{row.description}</Chip>
                                            </Stack>
                                        </Stack>
                                        <Chip color='primary' startDecorator={<MessageSharp />}>
                                            {row.latest_message.contentType === 'text' ? row.latest_message.content : 'ส่งรูปภาพหรือสติกเกอร์'}
                                        </Chip>
                                    </Stack>
                                </td>
                                <td>
                                    <Typography level="body-xs">{row.empName}</Typography>
                                </td>
                                <td>
                                    <Chip
                                        variant="soft"
                                        color="success"
                                        startDecorator={<DateRange />}
                                    >
                                        <Typography sx={ChatPageStyle.TableText}>
                                            วันที่รับเรื่อง	:
                                            {row.receiveAt
                                                ? convertFullDate(row.receiveAt)
                                                : "ยังไม่เริ่มสนทนา"}
                                        </Typography>
                                    </Chip>
                                </td>
                                <td>
                                    <Stack spacing={1}>
                                        <Chip
                                            variant="soft"
                                            color="warning"
                                            startDecorator={<DateRange />}
                                        >
                                            <Typography sx={ChatPageStyle.TableText}>
                                                เวลาเรื่ม :{" "}
                                                {row.startTime
                                                    ? convertFullDate(row.startTime)
                                                    : "ยังไม่เริ่มสนทนา"}
                                            </Typography>
                                        </Chip>
                                        <TimeDisplay startTime={row.startTime} />
                                    </Stack>
                                </td>
                                <td>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
                                        <Button onClick={() => handleChat(row.rateRef, row.id, row.custId)}>
                                            ดูข้อความ
                                        </Button>
                                    </Box>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Sheet>
        </React.Fragment>
    );
}