import { Box, Button, FormControl, FormLabel, Input } from "@mui/joy"
import Autocomplete from '@mui/joy/Autocomplete';

export const FilterChatHistory = () => {
    return (
        <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl>
                <FormLabel>ชื่อลูกค้า</FormLabel>
                <Input />
            </FormControl>
            <FormControl>
                <FormLabel>ทักมาจาก</FormLabel>
                <Input />
            </FormControl>
            <FormControl>
                <FormLabel>พนักงานที่คุยล่าสุด</FormLabel>
                <Autocomplete options={['Option 1', 'Option 2']} sx={{ width: 300 }} />
            </FormControl>
            <Button>ค้นหา</Button>
        </Box>
    )
}