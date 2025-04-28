import { Box, Button, FormControl, FormLabel, Input, Stack } from "@mui/joy"
import Autocomplete from '@mui/joy/Autocomplete';
import { useState } from "react";

export const FilterChatHistory = (props) => {
    const { setFilter, list } = props;
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const searchName = (e) => {
        const value = e.target.value;
        if (value === '') {
            setFilter(list);
        }
        const filterUpdate = list.filter((item) => item.custName.includes(value));
        setFilter(filterUpdate);
    }

    const searchDirectFrom = (event, value) => {
        // ตรวจสอบว่า value ไม่เป็น null และมีค่า
        if (value === '' || value === null) {
            setFilter(list);
        } else {
            const filterUpdate = list.filter((item) => item.description.includes(value));
            setFilter(filterUpdate);
            console.log(filterUpdate);
            console.log('Filtered by Direct From:', value);
        }
    }

    const searchEmp = (e) => {
        const value = e.target.value;
        if (value === '' || value === null) {
            setFilter(list);
        } else {
            const filterUpdate = list.filter((item) => item.name?.includes(value));
            setFilter(filterUpdate);
            console.log(filterUpdate);
            console.log('Filtered by Direct From:', value);
        }
    }

    const searchDate = (e) => {
        const filterUpdate = list.filter((item) => item.created_at >= startTime && item.created_at <= endTime);
        setFilter(filterUpdate);
        console.log(filterUpdate);
        console.log('Filtered by Date:', startTime, endTime);
    }

    return (
        <Stack direction={'row'} spacing={2}>
            <FormControl>
                <FormLabel>ชื่อลูกค้า</FormLabel>
                <Input onChange={(e) => searchName(e)} />
            </FormControl>
            <FormControl>
                <FormLabel>ทักมาจาก</FormLabel>
                <Autocomplete options={[
                    'pumpkintools',
                    'ศูนย์ซ่อม Pumpkin',
                    'dearler'
                ]} sx={{ width: 300 }} onChange={(event, value) => searchDirectFrom(event, value)} />
            </FormControl>
            <FormControl>
                <FormLabel>พนักงานที่คุยล่าสุด</FormLabel>
                <Input options={['Option 1', 'Option 2']} sx={{ width: 300 }} onChange={(e) => searchEmp(e)} />
            </FormControl>
            <FormControl>
                <FormLabel>ทักครั้งแรกเมื่อ	</FormLabel>
                <Input type="date" onChange={(e) => setStartTime(e.target.value)} />
            </FormControl>
            <Button onClick={()=>searchDate()}>ค้นหา</Button>
        </Stack>
    )
}