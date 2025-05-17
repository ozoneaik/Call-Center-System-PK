import {
    Input, FormLabel, Card, Stack, Typography,
    Sheet, Button, Divider, Chip, ChipDelete
} from "@mui/joy";
import { Box, debounce, FormGroup, Grid2 } from "@mui/material";
import { useCallback, useState } from "react";
import axiosClient from "../../../Axios";

export default function HelpChat({ handle }) {
    const [search, setSearch] = useState('');
    const [resultList, setResultList] = useState([]);
    const [selected, setSelected] = useState();
    // debounce function เพื่อหน่วงการยิง API
    const fetchHelpChat = async (value) => {
        try {
            const { data, status } = await axiosClient.post('/help-chat/search', { value });
            console.log(data.results, status);
            setResultList(data.results);
        } catch (error) {
            console.error('Error fetching help chat list:', error);
        }
    };

    const debouncedFetch = useCallback(debounce(fetchHelpChat, 1000), []);

    const handleSearch = (e) => {
        const { value } = e.target;
        setSearch(value);
        debouncedFetch(value);
    };

    const handleSelect = (item) => {
        setSelected(item);
    }


    const handleDeleteSelected = () => {
        setSelected(null);
    }
    return (
        <Grid2 container spacing={2}>
            <Grid2 size={12}>
                <FormGroup>
                    <FormLabel>ค้นหา</FormLabel>
                    <Input value={search} onChange={handleSearch} />
                </FormGroup>
            </Grid2>
            {selected && (<Grid2 size={12}>
                <Sheet sx={{ overflow: 'auto', maxHeight: '30vh' }}>
                    ข้อความที่เลือก
                    <Card color="primary" variant="outlined" invertedColors>
                        <Typography>{selected.search}</Typography>
                        <Chip color="success" endDecorator={<ChipDelete onDelete={() => handleDeleteSelected()} />} >
                            คำตอบ : {selected.solve}
                        </Chip>
                    </Card>
                </Sheet>
            </Grid2>)}
            <Grid2 size={12}>
                <Divider />
            </Grid2>
            <Grid2 size={12}>
                <Sheet sx={{ overflow: 'auto', maxHeight: '40vh' }}>
                    <Stack direction='column' spacing={2}>
                        {resultList && resultList.length > 0 && resultList.map((item, index) => (
                            <Card
                                onClick={() => handleSelect(item)}
                                color="primary" invertedColors
                                key={index} sx={{ cursor: 'pointer' }}
                                variant={selected?.id === item.id ? 'solid' : 'outlined'}
                            >
                                <Stack direction='row' spacing={2} alignItems='center'>
                                    <Typography>{item.id}{'.'}</Typography>
                                    <Typography>{item.search}</Typography>
                                </Stack>
                            </Card>
                        ))}
                    </Stack>
                </Sheet>
            </Grid2>
            <Grid2 size={12}>
                <Stack direction='row-reverse' spacing={2}>
                    <Button size="sm" onClick={() => handle(selected.solve)}>
                        ส่ง
                    </Button>
                </Stack>
            </Grid2>
        </Grid2>
    )
}