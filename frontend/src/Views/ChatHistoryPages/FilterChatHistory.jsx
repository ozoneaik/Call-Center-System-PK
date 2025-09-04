import { Button, Drawer, FormControl, FormLabel, Input, Option, Select, Sheet, Stack } from "@mui/joy"
import { useState } from "react";
import { Search, RotateLeft } from '@mui/icons-material';
import FilterListIcon from '@mui/icons-material/FilterList';

export const FilterChatHistory = ({ platforms, onPassed }) => {
    const [filter, setFilter] = useState({
        custName: '',
        directFrom: '',
        firstContactDate: '',
    });
    const [open, setOpen] = useState(false);

    const searchDirectFrom = (event, value) => {
        setFilter((prevstate) => ({
            ...prevstate,
            directFrom: value
        }))
    }

    const handleOnChange = (event) => {
        const { name, value } = event.target;
        setFilter((prevstate) => ({
            ...prevstate,
            [name]: value
        }));
    }

    return (
        <>
            <Button onClick={() => setOpen(true)} startDecorator={<FilterListIcon />}>ตัวกรอง</Button>
            <Drawer open={open} onClose={() => setOpen(false)}>
                <Sheet sx={{ p: 3 }}>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        onPassed(filter)
                        setOpen(false);
                    }}>
                        <Stack direction='column' spacing={2}>
                            <FormControl>
                                <FormLabel>ชื่อลูกค้า</FormLabel>
                                <Input name="custName" onChange={(e) => handleOnChange(e)} />
                            </FormControl>
                            <FormControl>
                                <FormLabel>ติดต่อมาจาก</FormLabel>
                                <Select sx={{ width: '100%' }} onChange={(e, value) => searchDirectFrom(e, value)} name="directFrom" defaultValue=''>
                                    <Option value={''}>ทั้งหมด</Option>
                                    {platforms.map((platform, index) => (
                                        <Option key={index} value={platform.id}>
                                            {platform.description}
                                        </Option>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl>
                                <FormLabel>ทักครั้งแรกเมื่อ	</FormLabel>
                                <Input type="date" name="firstContactDate" onChange={(e) => handleOnChange(e)} />
                            </FormControl>
                            <Stack direction='row' spacing={2}>
                                <Button type="submit" startDecorator={<Search />}>
                                    ค้นหา
                                </Button>
                                <Button type="reset" color="warning" startDecorator={<RotateLeft />}>
                                    reset
                                </Button>
                            </Stack>
                        </Stack>
                    </form>
                </Sheet>

            </Drawer>

        </>
    )
}