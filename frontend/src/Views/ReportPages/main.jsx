import { Box, Sheet } from "@mui/joy";
import { ChatPageStyle } from "../../styles/ChatPageStyle";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import { Grid2 } from "@mui/material";
import StatisticsCase from "../HomePages/StatisticsCase/index.jsx";
export default function ReportPage() {
    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box sx={
                ChatPageStyle.MainContent

            }>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BreadcrumbsComponent list={[{ name: 'หน้ารายงาน' }, { name: 'รายละอียด' }]} />
                </Box>
                <Sheet variant="outlined" sx={{
                    display: { sm: 'initial' }, width: '100%', border: "none",
                    flexShrink: 1, overflow: 'auto', minHeight: '300px', maxHeight: 'calc(100vh - 100px)',
                }}>
                    <Grid2 sx={{ mt: 2 }} >
                        <StatisticsCase />
                    </Grid2>
                </Sheet>
            </Box>
        </Sheet>
    );
}