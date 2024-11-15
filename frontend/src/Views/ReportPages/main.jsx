import { Box, Button, Card, Input, Sheet, Stack, Table, Typography } from "@mui/joy";
import { ChatPageStyle } from "../../styles/ChatPageStyle";
import BreadcrumbsComponent from "../../components/Breadcrumbs";
import { Grid2 } from "@mui/material";
import { RateList } from "./RateList";
import { ActiveList } from "./ActiveList";
import { useNavigate } from "react-router-dom";

const BreadcrumbsPath = [{ name: 'รายงาน' }, { name: 'รายละเอียด' }];

export default function ReportPage() {
    const navigate = useNavigate();
    return (
        <Sheet>
            <Box component="main" mx={1}>
                <Box sx={ChatPageStyle.BoxTable} mt={2}>
                    <Stack flexDirection='row' gap={1} alignItems='center'>
                        <Button onClick={()=>navigate(-1)} size="sm">
                            {'<'}
                        </Button>
                        <Typography level="h2" component="h1">รายงาน</Typography>
                    </Stack>
                    <Stack flexDirection='row' gap={1} alignItems='center'>
                        <Input type='date'/>
                        <Typography>ถึง</Typography>
                        <Input type='date'/>
                        <Button>ตกลง</Button>
                    </Stack>
                </Box>
                <Sheet variant="outlined" sx={[ChatPageStyle.BoxSheet, { border: "none" }]}>
                    <Grid2 container spacing={2} mb={2}>
                        <Grid2 size={3} height={400} sx={{ backgroundColor: 'white' ,overflow : 'auto'}}>
                                <Table stickyHeader borderAxis="both">
                                    <thead>
                                        <tr>
                                            <th>จากไลน์</th>
                                            <th>เคสที่จบแล้ว</th>
                                            <th>เคสที่ค้าง</th>
                                            <th>#</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[1, 2, 3, 4, 5, 67, 4, 2, 2, 3, 23, 23, 24, 2].map((item) => (
                                            <tr>
                                                <td>sldfls</td>
                                                <td>sldfls</td>
                                                <td>sldfls</td>
                                                <td>
                                                    <Button size="sm">ดู</Button>
                                                </td>
                                            </tr>
                                        ))}

                                    </tbody>
                                </Table>
                            
                        </Grid2>
                        <Grid2 size={5} height={400} sx={{ backgroundColor: 'white' ,overflow : 'auto'}}>
                            <RateList/>
                        </Grid2>
                        <Grid2 size={4} height={400} sx={{ backgroundColor: 'white' ,overflow : 'auto'}}>
                            <ActiveList/>
                        </Grid2>
                    </Grid2>
                    <Grid2 container spacing={2}>
                        <Grid2 size={12}>
                            <Card variant="outlined" color="neutral">
                                ดูจำนวน เคส แต่ละ line
                            </Card>
                        </Grid2>
                    </Grid2>
                </Sheet>
            </Box>
        </Sheet>
    )
}