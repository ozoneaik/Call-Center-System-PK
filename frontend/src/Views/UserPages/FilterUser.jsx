import { Input, Stack } from "@mui/joy"
import { Grid2 } from "@mui/material"


export const FilterUser = ({ setFilter, users }) => {
    const filterEmpCode = (e) => {
        const value = e.target.value;
        if (value === '' || value === null) {
            setFilter(users);
            return;
        }
        const filterUpdate = users.filter((user) => user.empCode.includes(value));
        setFilter(filterUpdate);
    }
    const filterEmpName = (e) => {
        const value = e.target.value;
        if (value === '' || value === null) {
            setFilter(users);
            return;
        }
        const filterUpdate = users.filter((user) => user.name.includes(value));
        setFilter(filterUpdate);
    }
    return (
        <Grid2 container gap={2}>
            <Grid2 size={4}>
                <Input type='text' placeholder="รหัสพนักงาน" onChange={(e) => filterEmpCode(e)} />
            </Grid2>
            <Grid2 size={4}>
                <Input type="text" placeholder="ชื่อพนักงาน" onChange={(e) => filterEmpName(e)} />
            </Grid2>
        </Grid2>
    )
}