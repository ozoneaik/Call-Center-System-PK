import Content from "../../Layouts/Content.jsx";
import {Link as link, useParams} from "react-router-dom";
import Box from "@mui/joy/Box";
import {AspectRatio, Breadcrumbs, Card, CardActions, CardOverflow} from "@mui/joy";
import Link from "@mui/joy/Link";
import Typography from "@mui/joy/Typography";
import Sheet from "@mui/joy/Sheet";
import {useEffect, useState} from "react";
import {CustDetailApi, UpdateCustDetailApi} from "../../Api/Customer.js";
import {AlertStandard} from "../../Dialogs/Alert.js";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import Divider from "@mui/joy/Divider";
import FormLabel from "@mui/joy/FormLabel";
import Input from "@mui/joy/Input";
import FormControl from "@mui/joy/FormControl";
import SaveIcon from '@mui/icons-material/Save';

export default function Detail() {
    const {custId} = useParams();
    const [detail, setDetail] = useState({avatar: '', name: '', description: '' , platform : ''});
    useEffect(() => {
        getCustDetail().then();
    }, []);
    const getCustDetail = async () => {
        const {data, status} = await CustDetailApi(custId);
        console.log(data, status)
        if (status === 200) {
            setDetail(data.detail);
        } else {
            AlertStandard({text: data.message});
        }
    }

    const handleSubmit = async () => {
        const {data,status} = await UpdateCustDetailApi(detail.custId,detail)
        let icon = 'error'
        if (status === 200) {
            icon = 'success'
        }

        AlertStandard({text: data.message,icon});
    }
    return (
        <Content>
            <Sheet
                sx={{flex: 1, width: '100%', mx: 'auto', pt: 0, display: 'grid', gridTemplateColumns: {xs: '1fr',},}}>
                <Box
                    component="main"
                    className="MainContent"
                    sx={{
                        px: {xs: 2, md: 6}, pb: {xs: 2, sm: 2, md: 3}, minWidth: 0, height: '100dvh',
                        pt: {
                            xs: 'calc(12px + var(--Header-height))', sm: 'calc(12px + var(--Header-height))', md: 3,
                        },
                        flex: 1, display: 'flex', flexDirection: 'column', gap: 1,
                    }}
                >
                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                        <Breadcrumbs size="sm" aria-label="breadcrumbs" sx={{pl: 0}}>
                            <Link component={link} underline="none" color="neutral" aria-label="Home" to={'/home'}>
                                จัดการสมาชิก
                            </Link>
                            <Link component={link} underline="none" color="neutral" aria-label="Home" to={'/home'}>
                                รายการข้อมูลลูกค้า
                            </Link>
                            <Typography color="primary" sx={{fontWeight: 500, fontSize: 12}}>
                                รายละเอียด
                            </Typography>
                        </Breadcrumbs>
                    </Box>
                    <Box sx={{
                        display: 'flex', mb: 1, gap: 1, flexDirection: {xs: 'column', sm: 'row'},
                        alignItems: {xs: 'start', sm: 'center'}, flexWrap: 'wrap', justifyContent: 'space-between',
                    }}>
                        <Typography level="h2" component="h1">รายละเอียด</Typography>
                    </Box>
                    <Box sx={{flex: 1, width: '100%'}}>
                        <Stack
                            spacing={4}
                            sx={{
                                display: 'flex', maxWidth: '800px', mx: 'auto', px: {xs: 2, md: 6}, py: {xs: 2, md: 3},
                            }}
                        >
                            <Card>
                                <Box><Typography level="title-md">ข้อมูลส่วนตัว</Typography></Box>
                                <Divider/>
                                <Stack direction="row" spacing={3} sx={{display: {xs: 'none', md: 'flex'}, my: 1}}>
                                    <Stack direction="column" spacing={1}>
                                        <AspectRatio
                                            ratio="1" maxHeight={200}
                                            sx={{flex: 1, minWidth: 120, borderRadius: '100%'}}
                                        >
                                            <img src={detail.avatar} loading="lazy" alt=""/>
                                        </AspectRatio>
                                    </Stack>
                                    <Stack spacing={2} sx={{flexGrow: 1}}>
                                        <Stack spacing={1}>
                                            <FormLabel>ชื่อ</FormLabel>
                                            <FormControl sx={{display: {sm: 'flex-column', md: 'flex-row'}, gap: 2}}>
                                                <Input value={detail.name}
                                                       onChange={(e) => setDetail({...detail, name: e.target.value})}/>
                                            </FormControl>
                                        </Stack>
                                        <Stack spacing={1}>
                                            <FormLabel>คำอธิบาย</FormLabel>
                                            <FormControl sx={{display: {sm: 'flex-column', md: 'flex-row'}, gap: 2}}>
                                                <Input value={detail.description}
                                                       onChange={(e) => setDetail({
                                                           ...detail,
                                                           description: e.target.value
                                                       })}/>
                                            </FormControl>
                                        </Stack>
                                        <Stack spacing={1}>
                                            <FormControl>
                                                <FormLabel>แพลตฟอร์ม</FormLabel>
                                                <Input value={detail.platform} disabled/>
                                            </FormControl>
                                        </Stack>
                                    </Stack>
                                </Stack>
                                <Stack direction="column" spacing={2} sx={{display: {xs: 'flex', md: 'none'}, my: 1}}>
                                    <Stack direction="row" spacing={2}>
                                        <Stack direction="column" spacing={1}>
                                            <AspectRatio
                                                ratio="1" maxHeight={108}
                                                sx={{flex: 1, minWidth: 108, borderRadius: '100%'}}
                                            >
                                                <img src={detail.avatar} loading="lazy" alt=""/>
                                            </AspectRatio>
                                        </Stack>
                                    </Stack>
                                    <FormControl>
                                        <FormLabel>ชื่อ</FormLabel>
                                        <Input value={detail.name} size='sm'
                                               onChange={(e) => setDetail({...detail, name: e.target.value})}/>
                                    </FormControl>
                                    <FormControl sx={{flexGrow: 1}}>
                                        <FormLabel>description</FormLabel>
                                        <Input value={detail.description} size='sm'
                                               onChange={(e) => setDetail({...detail, description: e.target.value})}/>
                                    </FormControl>
                                    <FormControl sx={{flexGrow: 1}}>
                                        <FormLabel>platform</FormLabel>
                                        <Input value={detail.platform} size='sm' disabled/>
                                    </FormControl>
                                </Stack>
                                <CardOverflow sx={{borderTop: '1px solid', borderColor: 'divider'}}>
                                    <CardActions sx={{alignSelf: 'flex-end', pt: 2}}>
                                        <Button startDecorator={<SaveIcon/>} size="sm" variant="solid"
                                                onClick={handleSubmit}>
                                            บันทึก
                                        </Button>
                                    </CardActions>
                                </CardOverflow>
                            </Card>
                        </Stack>
                    </Box>
                </Box>
            </Sheet>
        </Content>
    )
}