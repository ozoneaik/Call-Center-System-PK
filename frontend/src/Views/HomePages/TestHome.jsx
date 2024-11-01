import {Box, Card, CardContent, Sheet} from "@mui/joy";
import {ChatPageStyle} from "../../styles/ChatPageStyle.js";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/joy/Typography";
import Input from "@mui/joy/Input";
import {Charts} from "./Chart.jsx";
import Button from "@mui/joy/Button";

export function TestHome({chatData}) {
    return (
        <Sheet sx={[ChatPageStyle.Layout]}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <BreadcrumbsComponent list={[{name: 'hello'}]}/>
                </Box>
                <Box sx={ChatPageStyle.BoxTable}>
                    <Typography level="h2" component="h1">hello</Typography>
                    <Input sx={{width: {xs: '100%', lg: '30%'}}} type="date"/>
                </Box>
                <Grid container spacing={2}>
                    <Grid size={8}>
                        <Card color='primary' variant='solid' invertedColors>
                            <div>
                                <Typography level="title-lg">รายการแชทย้อนหลัง 7 วัน</Typography>
                                <Typography
                                    level="body-sm">ปัจจุบัน {new Date().getDate()}/{new Date().getMonth() + 1}</Typography>
                            </div>
                            <Charts chatData={chatData}/>
                        </Card>
                    </Grid>
                    <Grid size={4}>
                        <Grid container spacing={2}>
                            <Grid size={6}>
                                <Card color='success' invertedColors variant='solid'>
                                    <div>
                                        <Typography level="title-lg">ผู้ติดต่อใหม่</Typography>
                                    </div>
                                    <CardContent orientation="horizontal">
                                        <div>
                                            <Typography level="body-xs">Total price:</Typography>
                                            <Typography sx={{fontSize: 'lg', fontWeight: 'lg'}}>$2,900</Typography>
                                        </div>
                                        <Button
                                            variant="solid"
                                            size="md"
                                            color="primary"
                                            aria-label="Explore Bahamas Islands"
                                            sx={{ml: 'auto', alignSelf: 'center', fontWeight: 600}}
                                        >
                                            {customers.newCust}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid size={6}>
                                <Card color='neutral' invertedColors variant='solid'>
                                    <div>
                                        <Typography level="title-lg">ผู้ติดต่อทั้งหมด</Typography>
                                    </div>
                                    <CardContent orientation="horizontal">
                                        <div>
                                            <Typography level="body-xs">Total price:</Typography>
                                            <Typography sx={{fontSize: 'lg', fontWeight: 'lg'}}>$2,900</Typography>
                                        </div>
                                        <Button
                                            variant="solid"
                                            size="md"
                                            color="primary"
                                            aria-label="Explore Bahamas Islands"
                                            sx={{ml: 'auto', alignSelf: 'center', fontWeight: 600}}
                                        >
                                            Explore
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid size={12}>
                                <Card>
                                    จำนวนดาว
                                </Card>
                            </Grid>
                            <Grid size={12}>
                                <Card>
                                    จำนวนแชท
                                </Card>
                            </Grid>

                        </Grid>
                    </Grid>

                </Grid>
            </Box>
        </Sheet>
    )
}