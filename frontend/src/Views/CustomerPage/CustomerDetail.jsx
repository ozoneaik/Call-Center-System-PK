import Content from "../../Layouts/Content.jsx";
import {Link as link, useParams} from "react-router-dom";
import Box from "@mui/joy/Box";
import {AspectRatio, Breadcrumbs, Card, CardActions, CardOverflow} from "@mui/joy";
import Link from "@mui/joy/Link";
import Typography from "@mui/joy/Typography";
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

export default function CustomerDetail() {
    const {custId} = useParams();
    const [detail, setDetail] = useState({
        avatar: '', name: '', description: '', platform: '', created_at: '', updated_at: ''
    });

    useEffect(() => {
        getCustDetail().then();
    }, []);

    const getCustDetail = async () => {
        const {data, status} = await CustDetailApi(custId);
        if (status === 200) {
            setDetail(data.detail);
        } else {
            AlertStandard({text: data.message});
        }
    }

    const handleSubmit = async () => {
        const {data, status} = await UpdateCustDetailApi(detail.custId, detail);
        AlertStandard({text: data.message, icon: status === 200 ? 'success' : 'error'});
    }

    // Function to render form fields
    const renderFormField = (label, value, setValue, disabled = false) => (
        <FormControl>
            <FormLabel>{label}</FormLabel>
            <Input value={value} onChange={e => setValue(e.target.value)} disabled={disabled}/>
        </FormControl>
    );

    return (
        <Content>
            <Box sx={{flex: 1, width: '100%', mx: 'auto', pt: 0, display: 'grid', gridTemplateColumns: {xs: '1fr'}}}>
                <Box component="main" sx={{
                    px: {xs: 2, md: 6},
                    pb: {xs: 2, md: 3},
                    pt: {xs: 'calc(12px + var(--Header-height))', md: 3},
                    flex: 1
                }}>
                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                        <Breadcrumbs size="sm" sx={{pl: 0}}>
                            <Link component={link} to={'/customer/list'} underline="none"
                                  color="neutral">จัดการลูกค้า</Link>
                            <Link component={link} to={"/customer/list"} underline="none"
                                  color="neutral">รายการข้อมูลลูกค้า</Link>
                            <Typography color="primary" sx={{fontWeight: 500, fontSize: 12}}>รายละเอียด</Typography>
                        </Breadcrumbs>
                    </Box>
                    <Typography level="h2" component="h1">รายละเอียด</Typography>
                    <Stack spacing={4} sx={{maxWidth: '800px', mx: 'auto', py: {xs: 2, md: 3}}}>
                        <Card>
                            <Typography level="title-md">ข้อมูลส่วนตัว</Typography>
                            <Divider/>
                            <Stack direction={{xs: 'column', md: 'row'}} spacing={3} sx={{my: 1}}>
                                <AspectRatio ratio="1" maxHeight={120} sx={{width: 120, borderRadius: '100%'}}>
                                    <img src={detail.avatar} loading="lazy" alt="avatar"/>
                                </AspectRatio>
                                <Stack spacing={2} sx={{flexGrow: 1}}>
                                    {renderFormField("ชื่อ", detail.name, (value) => setDetail({
                                        ...detail,
                                        name: value
                                    }))}
                                    {renderFormField("คำอธิบาย", detail.description, (value) => setDetail({
                                        ...detail,
                                        description: value
                                    }))}
                                    {renderFormField("แพลตฟอร์ม", detail.platform, () => detail.platform, true)}
                                    {renderFormField("เริ่มสนทนาเมื่อ", detail.created_at, '', true)}
                                    {renderFormField("แก้ไขข้อมูลเมื่อ", detail.updated_at, '', true)}
                                </Stack>
                            </Stack>
                            <CardOverflow sx={{borderTop: '1px solid', borderColor: 'divider'}}>
                                <CardActions sx={{pt: 2}}>
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
        </Content>
    )
}