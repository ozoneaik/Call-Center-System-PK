import * as React from 'react';
import {Button, Input, Option, Select} from '@mui/joy';
import Grid from "@mui/material/Grid2";

export const Filter = (props) => {
    const {Groups = [], Models = [], Problems = []} = props;
    return (

        <Grid container spacing={2} mb={2}>
            <Grid size={{xs: 6, sm: 3}}>
                <Input placeholder="Search..." size="md" variant="outlined"/>
            </Grid>
            <Grid size={{xs: 6, sm: 3}}>
                <Select placeholder="เลือกหมวดหมู่" variant="outlined">
                    {Groups.map((group, i) => (
                        <Option key={i} value={group.title}>{group.title}</Option>
                    ))}
                </Select>
            </Grid>
            <Grid size={{xs: 6, sm: 3}}>
                <Select placeholder="เลือกรุ่น" variant="outlined">
                    {Models.map((model, i) => (
                        <Option key={i} value={model.title}>{model.title}</Option>
                    ))}
                </Select>
            </Grid>
            <Grid size={{xs: 6, sm: 3}}>
                <Select placeholder="เลือกปัญหา" variant="outlined">
                    {Problems.map((problem, i) => (
                        <Option key={i} value={problem.title}>{problem.title}</Option>
                    ))}
                </Select>
            </Grid>
            <Grid size={{xs: 6, sm: 3}}>
                <Button variant="solid" color="primary">
                    Apply Filters
                </Button>
            </Grid>
        </Grid>
    );
}
