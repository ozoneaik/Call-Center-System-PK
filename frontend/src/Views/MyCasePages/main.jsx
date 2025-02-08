import { Box, Button, Card, Sheet, Typography, Stack, Avatar, Divider, Chip, CircularProgress } from "@mui/joy";
import { ChatPageStyle } from "../../styles/ChatPageStyle";
import BreadcrumbsComponent from "../../components/Breadcrumbs";
import { Grid2 } from "@mui/material";
import ChatIcon from '@mui/icons-material/Chat';
import { useEffect, useState } from "react";
import { myCaseApi } from "../../Api/Messages";
import { convertFullDate } from "../../Components/Options";
import { Link } from "react-router-dom";
const BreadcrumbsPath = [{ name: 'เคสของฉัน' }, { name: 'รายละเอียด' }];

const TitleComponent = ({ title, result, color = 'primary', type = 'text' }) => (
    <Stack direction='row' spacing={1} alignItems='center'>
        <Typography level="body-sm">{title} : </Typography>
        <Chip color={color} variant="outlined">
            <Typography maxWidth={300} noWrap color={color} level="body-sm">
                {
                    type === 'date' ? convertFullDate(result) :
                        type === 'file' ? 'ส่งไฟล์แนบ' :
                            type === 'image' ? 'ส่งรูปภาพ' :
                                type === 'video' ? 'ส่งวิดีโอ' : type === 'sticker' ? 'ส่งสติ๊กเกอร์' :
                                    type === 'audio' ? 'ส่งไฟล์เสียง' : result
                }
            </Typography>
        </Chip>
    </Stack>
)

const Detail = ({ data }) => (
    <Stack spacing={1}>
        <Stack direction='row' spacing={1} alignItems='center'>
            <Avatar color="primary" variant="solid" src={data.avatar || ''} />
            <Typography level="body-md" color="primary" fontWeight='bold'>{data.custName}</Typography>
        </Stack>
        <Typography level="body-md" fontWeight='bold'>
            รายละเอียด&nbsp;
            <Typography level="body-xs">
                (รหัสอ้างอิง&nbsp;A{data.id}R{data.rateRef})
            </Typography>

        </Typography>
        <TitleComponent
            title={'วันที่รับเรื่อง'} result={data.created_at}
            color="neutral" type="date"
        />
        <Divider />
        <Typography level="body-md" fontWeight='bold'>ข้อความ</Typography>
        <TitleComponent
            title={'เมื่อ'} result={data.latest_message.created_at}
            color="neutral" type="date"
        />
        <TitleComponent
            title={'ประเภทข้อความ'} result={data.latest_message.contentType}
            color="warning"
        />
        <TitleComponent title={'เนื้อหา'} result={data.latest_message.content}
            color="primary" type={data.latest_message.contentType}
        />
        <Stack direction='row' spacing={2} alignItems='center' marginTop={2}>
            <Link style={{ width: '100%' }} to={`/select/message/${data.rateRef}/${data.id}/${data.custId}/1`}>
                <Button color="primary" fullWidth size='sm'>
                    <ChatIcon />
                </Button>
            </Link>
        </Stack>
    </Stack>
)
export default function MyCasePage() {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData().finally(() => setLoading(false));
    }, []);
    const fetchData = async () => {
        setLoading(true);
        const { data, status } = await myCaseApi();
        console.log(data);
        status === 200 && setList(data.result);
        setLoading(false);
    }
    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box sx={ChatPageStyle.MainContent}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                </Box>
                <Grid2 container spacing={2} sx={{ overflow: 'auto' }}>
                    <Grid2 size={12}>
                        <Button onClick={fetchData}>refresh</Button>
                    </Grid2>
                    {!loading ? (
                        list.length > 0 ? (
                            list.map((item, index) => (
                                <Grid2 size={{ xs: 12, md: 12, lg: 4 }} key={index}>
                                    <Card variant="soft">
                                        <Stack spacing={1}>
                                            <Detail data={item} />
                                        </Stack>
                                    </Card>
                                </Grid2>
                            ))
                        ) : 'ไม่พบข้อมูล'
                    ) : <CircularProgress />}
                </Grid2>
            </Box>
        </Sheet>
    )
}
