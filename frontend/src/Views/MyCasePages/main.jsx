import { Box, Button, Card, Input, Select, Sheet, Option, Typography, Stack, Avatar, Divider } from "@mui/joy";
import { ChatPageStyle } from "../../styles/ChatPageStyle";
import BreadcrumbsComponent from "../../components/Breadcrumbs";
import { Grid2 } from "@mui/material";
import Chip from '@mui/joy/Chip';
import { useState } from "react";
const BreadcrumbsPath = [{ name: 'เคสของฉัน' }, { name: 'รายละเอียด' }];

const Detail = ({ title, result = 'ไม่มี' }) => (
    <Stack spacing={1}>
        <Stack direction='row' spacing={1} alignItems='center'>
            <Avatar color="primary" variant="solid" />
            <Typography level="body-md" color="primary" fontWeight='bold'>ชื่อลูกค้า</Typography>
        </Stack>
        <Typography level="body-md" fontWeight='bold'>รายละเอียด</Typography>
        <Typography level="body-sm">
            วันที่รับเรื่อง : <Chip color="neutral" variant="outlined">{result}</Chip>
        </Typography>
        <Stack spacing={1} direction='row'>
            <Typography level="body-sm">
                เวลาเริ่ม : <Chip color="primary" variant="outlined">{result}</Chip>
            </Typography>
            <Typography level="body-sm">
                เวลาที่สนทนา : <Chip color="danger" variant="outlined">{result}</Chip>
            </Typography>
        </Stack>
        <Divider />
        <Typography level="body-md" fontWeight='bold'>ข้อความ</Typography>
        <Stack spacing={1} direction='row'>
            <Typography level="body-sm">
                เมื่อ : <Chip color="neutral" variant="outlined">{result}</Chip>
            </Typography>
            <Typography level="body-sm">
                ประเภทข้อความ : <Chip color="warning" variant="outlined">{result}</Chip>
            </Typography>
        </Stack>
        <Typography level="body-sm" >
            เนื้อหา : <Chip color="primary" variant="outlined">
                hello my name is phuwadech panichaysap sdfsdfssdfsdfsdfsdfd
            </Chip>
        </Typography>
        <Stack direction='row' spacing={2} alignItems='center' marginTop={2}>
            <Button color="primary" fullWidth size='sm'>สนทนา</Button>
        </Stack>
    </Stack>
)
export default function MyCasePage() {
    let time = new Date().toLocaleTimeString()

    const [ctime, setTime] = useState(time)
    const UpdateTime = () => {
        time = new Date().toLocaleTimeString()
        setTime(time)
    }
    setInterval(UpdateTime)
    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box sx={ChatPageStyle.MainContent}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                </Box>
                <Grid2 container spacing={2} sx={{ overflow: 'auto' }}>
                    <Grid2 size={{ xs: 12, md: 6, lg: 4 }}>
                        <Card variant="soft">
                            <Stack spacing={1}>
                                <Detail title="วันที่รับเรื่อง" result="2021-09-01" />
                            </Stack>
                        </Card>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 6, lg: 4 }}>
                        <Card variant="soft">
                            <Stack spacing={1}>
                                <Detail title="วันที่รับเรื่อง" result="2021-09-01" />
                            </Stack>
                        </Card>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 6, lg: 4 }}>
                        <Card variant="soft">
                            <Stack spacing={1}>
                                <h1>{ctime}</h1>
                                <Detail title="วันที่รับเรื่อง" result="2021-09-01" />
                            </Stack>
                        </Card>
                    </Grid2>
                </Grid2>
            </Box>
        </Sheet>
    )
}