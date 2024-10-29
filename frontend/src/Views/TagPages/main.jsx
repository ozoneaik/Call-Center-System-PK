import {ChatPageStyle} from "../../styles/ChatPageStyle.js";
import {Box, Card, CardActions, CardContent, CircularProgress, Sheet} from "@mui/joy";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import Typography from "@mui/joy/Typography";
import Grid from "@mui/material/Grid2";
import Button from "@mui/joy/Button";
import {useEffect, useState} from "react";
import {deleteTagApi, listTagsApi} from "../../Api/Tags.js";
import {FormTag} from "./form.jsx";
import {AlertDiaLog} from "../../Dialogs/Alert.js";

const BreadcrumbsPath = [{name: 'จัดการ tag การจบสทนา'}, {name: 'รายละเอียด'}];

export default function TagePage() {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(false);
    const [selected, setSelected] = useState({});
    useEffect(() => {
        fetchData().finally(() => setLoading(false));
    },[]);
    const fetchData = async () => {
        setLoading(true);
        const {data, status} = await listTagsApi();
        status === 200 && setTags(data.list);
    }

    const deleteTag = ({id}) => {
        AlertDiaLog({
            icon : 'question',
            title : 'ยืนยันการลบ Tag',
            text : 'กดตกลงเพืท่อยืนยันการลบ',
            onPassed : async (confirm) => {
                if (confirm) {
                    const {data, status} = await deleteTagApi({id});
                    AlertDiaLog({
                        icon : status === 200 && 'success',
                        title : data.message,
                        text : data.detail,
                        onPassed : () => {
                            if (status === 200) {
                                setTags((prevTags) => prevTags.filter((tag) => tag.id !== id));
                            }else console.log('TAG ไม่ได้ลบ หรือ การลบล้มเหลว');
                        }
                    })
                }else console.log('ไม่ได้ยืนยันการลบ');
            }
        })
    }
    return (
        <>
            {show && <FormTag show={show} setShow={setShow} selected={selected} setSelected={setSelected} setTags={setTags} />}
            <Sheet sx={ChatPageStyle.Layout}>
                <Box component="main" sx={ChatPageStyle.MainContent}>
                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                        <BreadcrumbsComponent list={BreadcrumbsPath}/>
                    </Box>
                    <Box sx={ChatPageStyle.BoxTable}>
                        <Typography level="h2" component="h1">จัดการ tag การจบสทนา</Typography>
                    </Box>
                    <Sheet variant="outlined" sx={[ChatPageStyle.BoxSheet, {border: "none"}]}>
                        <Grid container spacing={2}>
                            <Grid size={12}>
                                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'end', gap: 1}}>
                                    <Button onClick={() => setShow(!show)}>สร้าง</Button>
                                </Box>
                            </Grid>
                            {!loading ? (
                                tags.length > 0 ? (
                                    tags.map((tag, index) => (
                                        <Grid size={{md : 6, lg: 3, xs : 12}} key={index}>
                                            <Card variant="soft" invertedColors color='warning'>
                                                <CardContent orientation="horizontal" >
                                                    <CardContent>
                                                        <Typography level="body-md">รายการที่ {index+1}</Typography>
                                                        <Typography level="h4">{tag.tagName}</Typography>
                                                    </CardContent>
                                                </CardContent>
                                                <CardActions>
                                                    <Button variant="soft" size="sm" onClick={()=>{
                                                        setSelected(tag);
                                                        setShow(true);
                                                    }} >
                                                        แก้ไข
                                                    </Button>
                                                    <Button variant="solid" size="sm" onClick={()=>deleteTag({id: tag.id})}>
                                                        ลบ
                                                    </Button>
                                                </CardActions>
                                            </Card>
                                        </Grid>
                                    ))
                                ) : (
                                    <>ไม่พบรายการ</>
                                )
                            ) : (<CircularProgress/>)}

                        </Grid>
                    </Sheet>
                </Box>
            </Sheet>
        </>
    )
}