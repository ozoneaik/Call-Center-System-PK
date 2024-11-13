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
import { FilterChatHistory } from "./FilterChatHistory.jsx";


const BreadcrumbsPath = [{ name: 'ห้องแชทล่าสุด' }];
export default function ChatHistory() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [list, setList] = useState([]);
    const [filter, setFilter] = useState([]);
    const fetchData = async () => {
        setLoading(true);
        const { data, status } = await chatHistoryApi();
        console.log(data, status)
        if(status === 200) {
            setFilter(data.list);
            setList(data.list);
        }
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
                <FilterChatHistory setFilter={setFilter} Filter={filter} list={list}/>
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
                            {!loading ? filter.length > 0 && filter.map((item, index) => (
                                <tr key={index}>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <Avatar src={item.avatar} sx={{ mr: 1 }} />
                                            {item.custName}
                                        </div>
                                    </td>
                                    <td>{item.description}</td>
                                    <td>{convertFullDate(item.created_at)}</td>
                                    <td>{item.name}</td>
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
            </Box>
        </Sheet>
    )
}

