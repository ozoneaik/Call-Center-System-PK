import { Box, Button, CircularProgress, Input, Sheet, Stack } from "@mui/joy";
import { ChatPageStyle } from "../../styles/ChatPageStyle";
import BreadcrumbsComponent from "../../Components/Breadcrumbs";
import { Grid2 } from "@mui/material";
import { Search } from "@mui/icons-material";
import LatestCountMessage from "./LatestCountMessage";
import AmountCustomer from "./AmountCustomer";
import TopEmpReceive from "./TopEmpReceive";
import LikeUnLike from "./LikeUnLike";
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useEffect, useState } from "react";
import axiosClient from "../../Axios";
AOS.init();

const BreadcrumbsPath = [{ name: 'Home', path: '/หน้าหลัก' }]
export default function HomeNew() {
    const [stars, setStars] = useState();
    const [topEmp, setTopEmp] = useState();
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        fetchData().finally(() => setLoading(false));
    }, []);
    const fetchData = async () => {
        setLoading(true);
        try {
            const { data, status } = await axiosClient.get('/dashboard');
            console.log(data, status);
            setTopEmp(data.topEmployee);
            setStars(data.stars)
        } catch (error) {
            console.log(error);
        }
    }
    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                </Box>
                <Stack direction='row-reverse' alignItems='center' spacing={2} mb={3}>
                    <Button startDecorator={<Search />}>ค้นหา</Button>
                    <Input type="date" />
                </Stack>
                <Grid2 container spacing={2}>
                    {loading ? <CircularProgress /> : (
                        <>
                            {/* Left side - 8 columns */}
                            <Grid2 size={{ xs: 12, md: 8 }} container direction="column" spacing={2}>
                                {/* <Grid2 size={12}>
                                    <LatestCountMessage />
                                </Grid2> */}
                                <Grid2 size={12}>กำลังพัฒนา</Grid2>
                            </Grid2>

                            {/* Right side - 4 columns */}
                            <Grid2 size={{ xs: 12, md: 4 }} container direction="column" spacing={2}>
                                {/* <Grid2 size={12} data-aos='fade-up'>
                                    <AmountCustomer />
                                </Grid2>
                                <Grid2 size={12} data-aos='fade-up'>
                                    <TopEmpReceive topEmp={topEmp}/>
                                </Grid2>
                                <Grid2 size={12} data-aos='fade-up'>
                                        <LikeUnLike stars={stars} />
                                </Grid2> */}
                            </Grid2>
                        </>
                    )}
                </Grid2>
            </Box>
        </Sheet>
    )
}