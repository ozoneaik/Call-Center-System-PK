import { Button, FormControl, FormLabel, Input, Option, Select, Stack } from "@mui/joy"
import { useState } from "react";

export const FilterChatHistory = ({ platforms, onPassed }) => {
    const [filter, setFilter] = useState({
        custName: '',
        directFrom: '',
        firstContactDate: '',
    });

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
        <form onSubmit={(e) => {
            e.preventDefault();
            onPassed(filter)
        }}>
            <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
                <FormControl>
                    <FormLabel>ชื่อลูกค้า</FormLabel>
                    <Input name="custName" onChange={(e) => handleOnChange(e)} />
                </FormControl>
                <FormControl>
                    <FormLabel>ติดต่อมาจาก</FormLabel>
                    <Select sx={{ width: '100%' }} onChange={(e, value) => searchDirectFrom(e, value)} name="directFrom" defaultValue=''>
                        <Option value={''}>
                            ทั้งหมด
                        </Option>
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
                <Button type="submit">ค้นหา</Button>
                <Button type="reset" color="warning">reset</Button>
            </Stack>
        </form>
    )
}