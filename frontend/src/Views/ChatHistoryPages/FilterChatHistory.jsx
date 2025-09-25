import { Button, Drawer, FormControl, FormLabel, Input, Option, Select, Sheet, Stack } from "@mui/joy"
import { useState } from "react";
import { Search, RotateLeft } from '@mui/icons-material';
import FilterListIcon from '@mui/icons-material/FilterList';

export const FilterChatHistory = ({ platforms, onPassed }) => {
    const [filter, setFilter] = useState({
        custId: '',
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

    const handleReset = () => {
        const resetData = {
            custId: '',
            custName: '',
            directFrom: '',
            firstContactDate: '',
        };
        setFilter(resetData);
        onPassed(resetData);
    };

    return (
        <form onSubmit={(e) => {
            e.preventDefault();
            onPassed(filter);
        }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-end">
                <FormControl>
                    <FormLabel>รหัสลูกค้า</FormLabel>
                    <Input name="custId" value={filter.custId} onChange={handleOnChange} />
                </FormControl>
                <FormControl>
                    <FormLabel>ชื่อลูกค้า</FormLabel>
                    <Input name="custName" value={filter.custName} onChange={handleOnChange} />
                </FormControl>
                <FormControl>
                    <FormLabel>ติดต่อมาจาก</FormLabel>
                    <Select sx={{ width: '200px' }} value={filter.directFrom} onChange={(e, value) => searchDirectFrom(e, value)}>
                        <Option value={''}>ทั้งหมด</Option>
                        {platforms.map((platform, index) => (
                            <Option key={index} value={platform.id}>
                                {platform.description}
                            </Option>
                        ))}
                    </Select>
                </FormControl>
                <FormControl>
                    <FormLabel>ทักครั้งแรกเมื่อ</FormLabel>
                    <Input type="date" name="firstContactDate" value={filter.firstContactDate} onChange={handleOnChange} />
                </FormControl>
                <Stack direction="row" spacing={1}>
                    <Button type="submit" startDecorator={<Search />}>ค้นหา</Button>
                    <Button type="button" color="warning" startDecorator={<RotateLeft />} onClick={handleReset}>รีเซ็ต</Button>
                </Stack>
            </Stack>
        </form>
    );
};