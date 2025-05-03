import { Box, Sheet } from "@mui/joy";
import { ChatPageStyle } from "../../styles/ChatPageStyle";
import BreadcrumbsComponent from "../../Components/Breadcrumbs";
import { Grid2 } from "@mui/material";

const BreadcrumbsPath = [
    { name: 'Home', path: '/หน้าหลัก' },
]
export default function HomeNew() {
    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                </Box>
                <Grid2 container spacing={2}>
                    <Grid2 size={8}>
                        <Grid2 container spacing={2}>
                            <Grid2 size={12}>
                                จำนวนแชทล่าสุด 7 วัน
                            </Grid2>
                            <Grid2 size={12}>
                                จำนวนข้อความที่ค้าง
                            </Grid2>
                        </Grid2>
                    </Grid2>
                    <Grid2 size={4}>
                        <Grid2 container spacing={2}>
                            <Grid2 size={12}>
                                ผู้ติดต่อใหม่ ผู้ติดต่อทั้งหมด
                            </Grid2>
                            <Grid2 size={12}>
                                3 อันดับพนักงานที่รับเคสเยอะที่สุด (in development)
                            </Grid2>
                            <Grid2 size={12}>
                                จำนวนการกด like un
                            </Grid2>
                        </Grid2>

                    </Grid2>

                </Grid2>
            </Box>
        </Sheet>
    )
}