import { Card, Typography, CardContent, Stack, Chip } from "@mui/joy";
import { Grid2 } from "@mui/material";
import { GroupAdd, Group } from '@mui/icons-material';

export default function AmountCustomer() {
    return (
        <Card>
            <CardContent>
                <Grid2 container>
                    <Grid2 size={6} sx={{ borderRight: 1 }}>
                        <Stack direction='column' spacing={2} alignItems='center'>
                            <Typography level="title-lg">
                                ลูกค้าใหม่
                            </Typography>
                            <Chip startDecorator={<GroupAdd />} size="lg" color="success" variant="solid">
                                100
                            </Chip>
                        </Stack>
                    </Grid2>
                    <Grid2 size={6}>
                        <Stack direction='column' spacing={2} alignItems='center'>
                            <Typography level="title-lg">
                                ลูกค้าเก่า
                            </Typography>
                            <Chip startDecorator={<Group />} size="lg" color="neutral" variant="solid">
                                15
                            </Chip>
                        </Stack>
                    </Grid2>
                </Grid2>
            </CardContent>
        </Card>
    )
}