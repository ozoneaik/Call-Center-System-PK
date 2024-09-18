import React, {useCallback, useEffect, useState} from 'react';
import Table from '@mui/joy/Table';
import Typography from '@mui/joy/Typography';
import Box from '@mui/joy/Box';
import Sheet from '@mui/joy/Sheet';
import {listCustNewDmAPi} from "../../Api/Customer.js";
import Avatar from "@mui/joy/Avatar";
import Button from "@mui/joy/Button";
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import {convertDate} from "../../Components/Options.jsx";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import DialogTitle from "@mui/joy/DialogTitle";
import Divider from "@mui/joy/Divider";
import DialogContent from "@mui/joy/DialogContent";
import DialogActions from "@mui/joy/DialogActions";
import TextsmsIcon from "@mui/icons-material/Textsms";
import {changeRoomApi} from "../../Api/chatRooms.js";
import {toggleMessagesPane} from "../../Components/utils.js";

const tableStyle = {
    '--TableCell-headBackground': 'var(--joy-palette-background-level1)',
    '--Table-headerUnderlineThickness': '1px',
    '--TableRow-hoverBackground': 'var(--joy-palette-background-level1)',
}

const OrderTableContainer = {
    display: {sm: 'initial'}, width: '100%', maxHeight: 400, borderRadius: 'sm',
    flexShrink: 1, overflow: 'auto', minHeight: 0,
}

const HeaderComponentStyle = {
    display: 'flex', gap: 1, flexWrap: 'wrap', flexDirection: {xs: 'column', sm: 'row'},
    alignItems: {xs: 'start', sm: 'center'}, justifyContent: 'space-between',
}



const NewCustDmPage = ({chatRooms,setSelectedChat}) => {
    const [pending, setPending] = useState([]);
    const [progress, setProgress] = useState([]);
    const [open, setOpen] = useState(false);
    const [select, setSelected] = useState({});

    // ใช้ useCallback เพื่อป้องกันการสร้างฟังก์ชันใหม่ในทุกการเรนเดอร์
    const getCustDm = useCallback(async () => {
        try {
            const {data, status} = await listCustNewDmAPi();
            console.log(data,status)
            if (status === 200) {
                setPending(data.pending);
                setProgress(data.progress);
            }
        } catch (error) {
            console.error("Error fetching data", error);
        }
    }, []);

    useEffect(() => {
        getCustDm(); // เรียกใช้ฟังก์ชันเพียงครั้งเดียวเมื่อคอมโพเนนต์โหลด
    }, [getCustDm]);

    const handleChangeRoom = async (roomId, custId) => {
        const {data, status} = await changeRoomApi(roomId, custId);
        if (status === 200) {
            alert(data.message)
            location.reload()
        } else {
            alert('unSuccess')
        }
    }

    const TimeComponent = ({createdAt}) => {
        const [time, setTime] = useState(new Date(createdAt));
        useEffect(() => {
            const interval = setInterval(() => {
                setTime(prevTime => new Date(prevTime.getTime() + 1000));
            }, 1000);
            return () => clearInterval(interval);
        }, []);

        return <td>{convertDate(time)}</td>;
    };

    const HeaderComponent = ({title}) => (
        <Box sx={HeaderComponentStyle}>
            <Typography level="h2">{title}</Typography>
        </Box>
    );

    const ContentTableComponent = ({data, isPending = false}) => (
        <>
            <Modal open={open} onClose={() => setOpen(false)}>
                <ModalDialog variant="outlined" role="alertdialog">
                    <DialogTitle>รายละเอียด</DialogTitle>
                    <Divider/>
                    <DialogContent>
                        <Box>
                            <Avatar src={select.avatar}/>
                            <p><span style={{fontWeight: "bold"}}>ชื่อลูกค้า :</span> {select.name}</p>
                            <p><span style={{fontWeight: "bold"}}>รายละเอียด :</span> {select.description}</p>
                            <p><span style={{fontWeight: "bold"}}>จาก :</span> Line</p>
                        </Box>
                        <Divider/>
                        <Box>
                            <Typography level="title-sm">ย้ายไปยังห้อง</Typography>
                            {chatRooms.length > 0 ? (
                                chatRooms.map((chatRoom, index) => (
                                    <Button
                                        onClick={() => handleChangeRoom(chatRoom.id, select.custId)}
                                        disabled={chatRoom.id === select.roomId}
                                        sx={{mr: 1}} key={index} size='sm' variant='outlined'
                                    >
                                        {chatRoom.name}
                                    </Button>
                                ))
                            ) : (
                                <>ไม่พบรายการ</>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button variant="solid" color="primary"
                                onClick={() => {
                                    setOpen(false);
                                    toggleMessagesPane();
                                    setSelectedChat({id : select.custId, sender : select});
                                    localStorage.setItem('selectChat', '1');
                                }}
                        >
                            <TextsmsIcon/>
                        </Button>
                        <Button variant="solid" color="neutral" onClick={() => setOpen(false)}>
                            จัดการข้อมูล
                        </Button>
                    </DialogActions>
                </ModalDialog>
            </Modal>

            <Sheet className="OrderTableContainer" variant="outlined" sx={OrderTableContainer}>
                <Table stickyHeader hoverRow sx={tableStyle}>
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
                                <td>{row.userReply ? row.userReply : '-'} (ห้องแชท {row.roomId})</td>
                                <td>{convertDate(row.created_at)}</td>
                                {
                                    !isPending ?
                                        <TimeComponent createdAt={row.created_at}/> :
                                        <td> - </td>
                                }
                                <td style={{textAlign: "center"}}>
                                    <Button
                                        onClick={() => {setOpen(true);setSelected(row);}}
                                        size='sm' variant='outlined' color="warning"
                                    >
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
        </>
    );

    return (
        <>
            <HeaderComponent title="กำลังสนทนา"/>
            <ContentTableComponent data={progress}/>
            <HeaderComponent title="รอดำเนินการ"/>
            <ContentTableComponent data={pending} isPending={true}/>
        </>
    );
};

export default NewCustDmPage;
