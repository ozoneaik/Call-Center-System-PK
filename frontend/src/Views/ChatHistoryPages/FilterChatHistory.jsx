import { Box, Button, FormControl, FormLabel, Input } from "@mui/joy"
import Autocomplete from '@mui/joy/Autocomplete';

export const FilterChatHistory = (props) => {
    const { setFilter, list } = props;

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

    return (
        <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl>
                <FormLabel>ชื่อลูกค้า</FormLabel>
                <Input onChange={(e) => searchName(e)} />
            </FormControl>
            <FormControl>
                <FormLabel>ทักมาจาก</FormLabel>
                <Autocomplete options={['ทักมาจากไลน์ PhuAongBot', 'ทักมาจากไลน์ message']} sx={{ width: 300 }} onChange={(event, value) => searchDirectFrom(event, value)} />
            </FormControl>
            <FormControl>
                <FormLabel>พนักงานที่คุยล่าสุด</FormLabel>
                <Input options={['Option 1', 'Option 2']} sx={{ width: 300 }} onChange={(e)=>searchEmp(e)} />
            </FormControl>
            {/* <Button>ค้นหา</Button> */}
        </Box>
    )
}