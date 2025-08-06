import { Box, Sheet } from "@mui/joy";
import StatisticsCase from "../HomePages/StatisticsCase.jsx";
import { ChatPageStyle } from "../../styles/ChatPageStyle";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import { Grid2 } from "@mui/material";

export default function ReportPage() {
    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box sx={ChatPageStyle.MainContent}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BreadcrumbsComponent list={[]} />
                </Box>
                <Grid2 sx={{ mt: 2 }} >
                    <StatisticsCase />
                </Grid2>
            </Box>
        </Sheet>
    );
}