import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { CircularProgress, Table } from "@mui/joy";
import { useEffect, useState } from "react";
import { chatHistoryApi } from "../../Api/Messages.js";
import { convertFullDate } from "../../Components/Options.jsx";
import Button from "@mui/joy/Button";
import Avatar from "@mui/joy/Avatar";
import HistoryIcon from "@mui/icons-material/History";
import { useNavigate } from "react-router-dom";
import BreadcrumbsComponent from "../../components/Breadcrumbs.jsx";
import IconButton, { iconButtonClasses } from '@mui/joy/IconButton';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import { FilterChatHistory } from "./FilterChatHistory.jsx";


const BreadcrumbsPath = [{ name: 'ห้องแชทล่าสุด' }];
export default function ChatHistory() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [list, setList] = useState([])
    const fetchData = async () => {
        setLoading(true);
        const { data, status } = await chatHistoryApi();
        console.log(data, status)
        status === 200 && setList(data.list);
    }
    useEffect(() => {
        fetchData().finally(() => setLoading(false));
    }, []);

    const redirectChat = (select) => {
        const params = `${select.rateRef}/${select.id}/${select.custId}`;
        navigate(`/select/message/${params}/0`);
        // const path = `${window.location.origin}/select/message/${params}`;
        // const win = window.open(path, '_blank','width=900,height=800');
        // win && win.focus();
    }
    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                </Box>
                <Box sx={ChatPageStyle.BoxTable}>
                    <Typography level="h2" component="h1">ประวัติการสนทนาทั้งหมด</Typography>
                </Box>
                <FilterChatHistory/>
                <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
                    <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
                        <thead>
                            <tr>
                                <th>ชื่อลูกค้า</th>
                                <th>คำอธิบาย</th>
                                <th>ทักครั้งแรกเมื่อ</th>
                                <th>พนักงานที่คุยล่าสุด</th>
                                <th>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading ? list.length > 0 && list.map((item, index) => (
                                <tr key={index}>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <Avatar src={item.avatar} sx={{ mr: 1 }} />
                                            {item.custName}
                                        </div>
                                    </td>
                                    <td>{item.description}</td>
                                    <td>{convertFullDate(item.created_at)}</td>
                                    <td>ระหว่างพัฒนา</td>
                                    <td>
                                        <Button size='sm' onClick={() => redirectChat(item)}>
                                            <HistoryIcon />
                                        </Button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4}>
                                        <CircularProgress />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>

                </Sheet>
                <Box
                    className="Pagination-laptopUp"
                    sx={{
                        pt: 2, gap: 1,
                        [`& .${iconButtonClasses.root}`]: { borderRadius: '50%' },
                        display: {
                            xs: 'none', md: 'flex',
                        }
                    }}
                >
                    <Button size="sm" variant="outlined" color="neutral" startDecorator={<KeyboardArrowLeftIcon />}>
                        ก่อนหน้า
                    </Button>

                    <Box sx={{ flex: 1 }} />
                    {['1', '2', '3', '…', '8', '9', '10'].map((page) => (
                        <IconButton
                            key={page}
                            size="sm"
                            variant={Number(page) ? 'outlined' : 'plain'}
                            color="neutral"
                        >
                            {page}
                        </IconButton>
                    ))}
                    <Box sx={{ flex: 1 }} />
                    <Button
                        size="sm"
                        variant="outlined"
                        color="neutral"
                        endDecorator={<KeyboardArrowRightIcon />}
                    >
                        ถัดไป
                    </Button>
                </Box>
            </Box>
        </Sheet>
    )
}

