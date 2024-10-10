import {ChatPageStyle} from "../styles/ChatPageStyle.js";
import {Box, CircularProgress, Sheet, Table} from "@mui/joy";
import BreadcrumbsComponent from "../Components/Breadcrumbs.jsx";
import {useEffect, useState} from "react";
import {customersListApi} from "../Api/Messages.js";
import Avatar from "@mui/joy/Avatar";
import Typography from "@mui/joy/Typography";
import Chip from "@mui/joy/Chip";
import {convertFullDate, getRandomColor} from "../Components/Options.jsx";
import Button from "@mui/joy/Button";
import EditNoteIcon from '@mui/icons-material/EditNote';
import ModalDialog from "../Components/ModalDialog.jsx";

const BreadcrumbsPath = [{name: 'จัดการลูกค้า'}, {name: 'รายละเอียด'}];
const customersRef = {
    customers: [{
        id: 'int',
        custId: 'string',
        custName: 'string',
        description: 'string',
        created_at: 'dateTime'
    }]
};

export default function Customers() {
    const [customers, setCustomers] = useState([customersRef]);
    const [selected, setSelected] = useState({});
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    useEffect(() => {
        getCustomers().finally(() => setLoading(false));
    }, [])

    const getCustomers = async () => {
        setLoading(true);
        const {data, status} = await customersListApi();
        status === 200 && setCustomers(data.customers);
    }

    const handleEditClick = async (customer) => {
        setSelected(customer);
        setOpen(true);
        console.log('open:', open);

    };

    const refresh = () => {
        getCustomers().finally(() => setLoading(false));
    }

    return (
        <>
            {/* เงื่อนไขการแสดงข้อความ "test" */}
            {open && (<ModalDialog open={open} setOpen={setOpen} event={'customer'} selected={selected}
                                   Refresh={refresh}/>)}
            <Sheet sx={ChatPageStyle.Layout}>
                <Box component="main" sx={ChatPageStyle.MainContent}>
                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                        <BreadcrumbsComponent list={BreadcrumbsPath}/>
                    </Box>
                    <Box sx={ChatPageStyle.BoxTable}>
                        <Typography level="h2" component="h1">จัดการลูกค้า</Typography>
                    </Box>
                    <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
                        <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
                            <thead>
                            <tr>
                                <th style={{width: 200}}>ลำดับ</th>
                                <th style={{width: 200}}>ชื่อลูกค้า</th>
                                <th style={{width: 200}}>คำอธิบาย</th>
                                <th style={{width: 200}}>สร้างเมื่อ</th>
                                <th style={{width: 200}}>จัดการ</th>
                            </tr>
                            </thead>
                            <tbody>
                            {
                                !loading ? (
                                    customers.length > 0 ? (
                                        customers.map((customer, index) => (
                                            <tr key={index}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <div style={{display: "flex", alignItems: "center"}}>
                                                        <Avatar size='sm' sx={{mr: 1}} src={customer.avatar}/>
                                                        <Typography>{customer.custName}</Typography>
                                                    </div>
                                                </td>
                                                <td>
                                                    <Chip color={getRandomColor()}>
                                                        {customer.description}
                                                    </Chip>
                                                </td>
                                                <td>
                                                    <Chip color={getRandomColor()}>
                                                        {convertFullDate(customer.created_at)}
                                                    </Chip>
                                                </td>
                                                <td>
                                                    <Button size='sm' onClick={() => handleEditClick(customer)}>
                                                        <EditNoteIcon/>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : <tr>
                                        <td colSpan={5}>ไม่มีข้อมูล</td>
                                    </tr>
                                ) : <tr>
                                    <td colSpan={5}><CircularProgress/></td>
                                </tr>
                            }
                            </tbody>
                        </Table>

                    </Sheet>
                </Box>
            </Sheet>
        </>
    )
}