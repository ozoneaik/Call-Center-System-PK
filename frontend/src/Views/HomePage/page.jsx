import Content from "../../Layouts/Content.jsx";
import { Typography, Box, Card, CardContent, Grid, Button } from '@mui/joy';
import ChatIcon from '@mui/icons-material/Chat';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';

function HomePage() {
    return (
        <Content>
            <Box sx={{ maxWidth: '800px', margin: 'auto', padding: 4 }}>
                <Typography level="h2" sx={{ mb: 4, textAlign: 'center' }}>
                    ยินดีต้อนรับสู่ระบบแชทอัจฉริยะ
                </Typography>

                <Typography sx={{ mb: 4, textAlign: 'center' }}>
                    ระบบแชทของเราช่วยให้คุณสื่อสารได้อย่างมีประสิทธิภาพ ปลอดภัย และรวดเร็ว
                    ไม่ว่าจะเป็นการติดต่อกับเพื่อนร่วมงาน ลูกค้า หรือการใช้งานส่วนตัว
                </Typography>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <ChatIcon sx={{ fontSize: 40, mb: 2 }} />
                                <Typography level="h6" sx={{ mb: 1 }}>การสื่อสารที่ราบรื่น</Typography>
                                <Typography>
                                    แชทแบบเรียลไทม์ พร้อมการส่งไฟล์และรูปภาพ
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <SecurityIcon sx={{ fontSize: 40, mb: 2 }} />
                                <Typography level="h6" sx={{ mb: 1 }}>ความปลอดภัยสูงสุด</Typography>
                                <Typography>
                                    การเข้ารหัสแบบ end-to-end เพื่อความเป็นส่วนตัวของคุณ
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <SpeedIcon sx={{ fontSize: 40, mb: 2 }} />
                                <Typography level="h6" sx={{ mb: 1 }}>ประสิทธิภาพสูง</Typography>
                                <Typography>
                                    ระบบที่รวดเร็วและเสถียร รองรับการใช้งานพร้อมกันหลายอุปกรณ์
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Box sx={{ textAlign: 'center' }}>
                    <Button size="lg" variant="solid">
                        เริ่มใช้งานเลย
                    </Button>
                </Box>
            </Box>
        </Content>
    );
}

export default HomePage;