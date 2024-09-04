import Content from "../../Layouts/Content.jsx";
import { Typography, Box, Card, CardContent, Grid, Button, List, ListItem, ListItemButton, ListItemDecorator, ListItemContent } from '@mui/joy';
import ChatIcon from '@mui/icons-material/Chat';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';

function HomePage() {
    return (
        <Content>
            <Box sx={{ flexGrow: 1, p: 3 }}>
                <Typography level="h2" sx={{ mb: 4 }}>
                    แดชบอร์ดระบบแชท
                </Typography>

                <Grid container spacing={3}>
                    {/* สถิติการใช้งาน */}
                    <Grid xs={12} md={8}>
                        <Card>
                            <CardContent>
                                <Typography level="h3">สถิติการใช้งาน</Typography>
                                <Box sx={{ height: 300, mt: 2 }}>
                                    {/* ที่นี่คุณสามารถเพิ่มกราฟหรือแผนภูมิแสดงสถิติได้ */}
                                    <Typography>กราฟแสดงสถิติการใช้งาน</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* ข้อมูลสรุป */}
                    <Grid xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography level="h3">ข้อมูลสรุป</Typography>
                                <List>
                                    <ListItem>
                                        <ListItemButton>
                                            <ListItemDecorator>
                                                <ChatIcon />
                                            </ListItemDecorator>
                                            <ListItemContent>จำนวนแชททั้งหมด: 1,234</ListItemContent>
                                        </ListItemButton>
                                    </ListItem>
                                    <ListItem>
                                        <ListItemButton>
                                            <ListItemDecorator>
                                                <PeopleIcon />
                                            </ListItemDecorator>
                                            <ListItemContent>ผู้ใช้งานทั้งหมด: 567</ListItemContent>
                                        </ListItemButton>
                                    </ListItem>
                                    <ListItem>
                                        <ListItemButton>
                                            <ListItemDecorator>
                                                <SpeedIcon />
                                            </ListItemDecorator>
                                            <ListItemContent>เวลาตอบกลับเฉลี่ย: 2 นาที</ListItemContent>
                                        </ListItemButton>
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* ฟีเจอร์เด่น */}
                    <Grid xs={12}>
                        <Card>
                            <CardContent>
                                <Typography level="h3" sx={{ mb: 2 }}>ฟีเจอร์เด่น</Typography>
                                <Grid container spacing={2}>
                                    <Grid xs={12} sm={4}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <ChatIcon sx={{ fontSize: 40, mb: 1 }} />
                                                <Typography level="h4">แชทแบบเรียลไทม์</Typography>
                                                <Typography>การสื่อสารแบบทันทีทันใด</Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid xs={12} sm={4}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <SecurityIcon sx={{ fontSize: 40, mb: 1 }} />
                                                <Typography level="h4">ความปลอดภัยสูง</Typography>
                                                <Typography>การเข้ารหัสแบบ end-to-end</Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid xs={12} sm={4}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <BarChartIcon sx={{ fontSize: 40, mb: 1 }} />
                                                <Typography level="h4">วิเคราะห์ข้อมูล</Typography>
                                                <Typography>รายงานและการวิเคราะห์เชิงลึก</Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* ปุ่มดำเนินการ */}
                    <Grid xs={12} sx={{ mt: 2 }}>
                        <Button variant="solid" color="primary" startDecorator={<ChatIcon />} sx={{ mr: 2 }}>
                            เริ่มแชทใหม่
                        </Button>
                        <Button variant="outlined" color="neutral">
                            ดูรายงานเพิ่มเติม
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </Content>
    );
}

export default HomePage;