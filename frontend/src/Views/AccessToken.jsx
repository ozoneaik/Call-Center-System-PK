import {ChatPageStyle} from "../styles/ChatPageStyle.js";
import {Box, Sheet, Table} from "@mui/joy";
import BreadcrumbsComponent from "../Components/Breadcrumbs.jsx";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";

const BreadcrumbsPath = [{name : 'จัดการ Token'},{name : 'รายละเอียด'}];

export default function AccessToken () {
    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <BreadcrumbsComponent list={BreadcrumbsPath}/>
                </Box>
                <Box sx={ChatPageStyle.BoxTable}>
                    <Typography level="h2" component="h1">จัดการ Token</Typography>
                    <Button size='sm'>+ เพิ่มผู้ใช้</Button>
                </Box>
                <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
                    <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
                        <thead>
                        <tr>
                            <th style={{width: 200}}>รหัสผู้ใช้</th>
                            <th style={{width: 200}}>ชื่อ</th>
                            <th style={{width: 200}}>สิทธิ์ (ประจำอยู่ห้อง)</th>
                            <th style={{width: 200}}>สร้างเมื่อ</th>
                            <th style={{width: 200}}>จัดการ</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td colSpan={5}>ไม่มีข้อมูล</td>
                        </tr>
                        </tbody>
                    </Table>
                </Sheet>
            </Box>
        </Sheet>
    )
}