import {ChatPageStyle} from "../../styles/ChatPageStyle.js";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import {Box, Sheet,Table} from "@mui/joy";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";

const BreadcrumbsPath = [{name: 'จัดการเมนูบอท'}, {name: 'รายละเอียด'}];
export default function BotPage() {
    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <BreadcrumbsComponent list={BreadcrumbsPath}/>
                </Box>
                <Box sx={ChatPageStyle.BoxTable}>
                    <Typography level="h2" component="h1">จัดการเมนูบอท</Typography>
                    <Button size='sm'>+ เพิ่มเมนูบอท</Button>
                </Box>
                <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
                    <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
                        <thead>
                        <tr>
                            <th>ลำดับ</th>
                            <th>ชื่อเมนู</th>
                            <th>ส่งไปยังห้อง</th>
                            <th>สร้างเมื่อ</th>
                            <th>อัพเดทเมื่อ</th>
                            <th>จัดการ</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>1</td>
                            <td>sljflas</td>
                            <td>sljflas</td>
                            <td>sljflas</td>
                            <td>sljflas</td>
                            <td>
                                <Box sx={{display: 'flex',gap : 1}}>
                                    <Button size='sm'>
                                        จัดการ
                                    </Button>
                                    <Button  size='sm'>
                                        ลบ
                                    </Button>
                                </Box>
                            </td>
                        </tr>
                        </tbody>
                    </Table>
                </Sheet>
            </Box>
        </Sheet>
    )
}