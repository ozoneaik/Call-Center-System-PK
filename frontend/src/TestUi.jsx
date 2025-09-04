import * as React from 'react';
import { Grid, Container } from '@mui/joy';

export default function TestUi() {
    return (
        <Container>
            <Grid container spacing={2}>
                <Grid xs={12} sm={6} md={12}>
                    <div style={{ backgroundColor: '#ccc', padding: '20px' }}>Column 1</div>
                </Grid>
                <Grid xs={12} sm={6} md={4}>
                    <div style={{ backgroundColor: '#ccc', padding: '20px' }}>Column 2</div>
                </Grid>
                <Grid xs={12} sm={6} md={4}>
                    <div style={{ backgroundColor: '#ccc', padding: '20px' }}>Column 3</div>
                </Grid>
            </Grid>
        </Container>
    );
}
