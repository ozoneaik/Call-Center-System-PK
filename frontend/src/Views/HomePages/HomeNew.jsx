import { Box, Button, CircularProgress, Grid, Input, Sheet, Stack } from "@mui/joy";
import { ChatPageStyle } from "../../styles/ChatPageStyle";
import BreadcrumbsComponent from "../../Components/Breadcrumbs";
import { Grid2 } from "@mui/material";
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useEffect, useState } from "react";
import axiosClient from "../../Axios";
import { Search } from "@mui/icons-material";
import UserCase from "./UserCase";
import AllCase from "./AllCase";
import StatisticsCase from "./StatisticsCase";
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
                {/* <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                    <Stack direction='row' spacing={2} justifyContent='end'>
                        <Input type="date" />
                        <Button startDecorator={<Search />}>
                            ค้นหา
                        </Button>
                    </Stack>
                </Box> */}
                <Grid2 container spacing={2}>
                    <Grid2 size={12}>

                    </Grid2>
                    <Grid2 size={12}>
                        <UserCase />
                    </Grid2>
                    <Grid2 size={12}>
                        <AllCase />
                    </Grid2>
                    <Grid2 size={12}>
                        <StatisticsCase />
                    </Grid2>
                </Grid2>
            </Box>
        </Sheet>
    )
}