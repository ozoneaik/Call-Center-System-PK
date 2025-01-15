import { ChatPageStyle } from "../../styles/ChatPageStyle"
import BreadcrumbsComponent from "../../components/Breadcrumbs"
import { Grid2, Stack } from "@mui/material";
import { Box, Button, Card, Chip, Input, Sheet, Typography } from "@mui/joy";
import { useEffect, useState } from "react";
import SearchIcon from '@mui/icons-material/Search';
import { listNotesApi, selectNoteApi } from "../../Api/Note";
import { Link, useNavigate } from "react-router-dom";
const BreadcrumbsPath = [{ name: 'ค้นหาแท็ก' }];

const Detail = ({ title, value, type = 'text' }) => {
    if (type === 'text') {
        return (
            <Stack direction={'row'} spacing={1}>
                <Typography fontWeight='bold' variant="body1" color="textSecondary">{title}</Typography>
                : <Typography variant="body1">{value}</Typography>
            </Stack>
        )
    } else {
        return (
            <Stack direction={'row'} spacing={1}>
                <Typography fontWeight='bold' variant="body1" color="textSecondary">{title}</Typography>
                : <Chip
                    variant="solid"
                    color='primary'
                >{value}</Chip>
            </Stack>
        )
    }
}

export default function SearchNote() {
    const navigate = useNavigate();
    const [notes, setNotes] = useState([{ name: 'note1' }, { name: 'note2' }, { name: 'note3' }]);
    const [filter, setFilter] = useState([]);
    const [search, setSearch] = useState('');
    useEffect(() => {
        fetchData();
    }, [])
    const fetchData = async () => {
        const { data, status } = await listNotesApi();
        console.log(data, status);
        if (status === 200) {
            setNotes(data.notes);
            setFilter(data.notes);
        }
    }

    const searchFilter = () => {
        const result = notes.filter((item) => item.text.includes(search));
        setFilter(result);
    }

    const redirectTo = async (custId ) => {
        const {data, status } = await selectNoteApi({custId});
        if (status === 200) {
            navigate(`/select/message/${data.rate_id}/${data.ac_id}/${data.custId}/${data.active}`);
        }
    }
    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box sx={ChatPageStyle.MainContent}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                </Box>
                <Grid2 container spacing={2} sx={{ overflow: 'auto' }}>
                    <Grid2 size={12}>
                        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
                            <Input placeholder="ค้นหา note ที่นี่" startDecorator={<SearchIcon />} onChange={(e) => setSearch(e.target.value)} />
                            <Button onClick={() => searchFilter()}>ค้นหา</Button>
                            <Button color="neutral" onClick={() => setFilter(notes)}>ล้าง</Button>
                        </Stack>
                    </Grid2>
                    {filter.map((item, index) => (
                        <Grid2 size={{ lg: 4, md: 4, sm: 6, xs: 12 }} key={index}>
                            <Card variant="soft" color="neutral">
                                <Stack direction={'column'} spacing={2}>
                                    <Detail title={'รหัสอ้างอิง'} value={item.id}/>
                                    <Detail title={'โน็ต'} value={item.text} type="status" />
                                    <Detail title={'ชื่อลูกค้า'} value={item.custName} />
                                    <Button onClick={()=>redirectTo(item.custId)} fullWidth>ดูข้อความ</Button>
                                </Stack>
                            </Card>
                        </Grid2>
                    ))}
                </Grid2>
            </Box>
        </Sheet>
    )
}