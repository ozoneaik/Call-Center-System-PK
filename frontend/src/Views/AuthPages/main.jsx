import { Box, Sheet } from "@mui/joy";
import { useAuth } from "../../context/AuthContext"
import { Grid2 } from "@mui/material";
import { ChatPageStyle } from "../../styles/ChatPageStyle";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import ProfilePage from "./ProfilePage.jsx";

const BreadcrumbsPath = [{ name: 'AuthPages' }, { name: 'รายละเอียด' }];

export default function AuthPages() {
    const { user } = useAuth();
    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                </Box>
                <Sheet variant="outlined" sx={[ChatPageStyle.BoxSheet, { border: "none" }]}>
                    <Grid2 container spacing={2}>
                        <Grid2 size={12}>
                            <ProfilePage />
                        </Grid2>
                    </Grid2>
                </Sheet>
            </Box>
        </Sheet>
    )
}