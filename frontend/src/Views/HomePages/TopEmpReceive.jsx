import { Avatar, Badge, Card, CardContent, Chip, Stack, Typography } from "@mui/joy";
import { Assignment } from '@mui/icons-material';
import { Grid2 } from "@mui/material";

const UserDetail = ({ emp, topThree = 0 }) => (
    <Stack direction='column' spacing={2} alignItems='center'>
        <Badge
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="plain"
            badgeContent={
                <Avatar
                    color={topThree === 1 ? 'success' : topThree === 2 ? 'warning' : topThree === 3 ? 'danger' : 'neutral'}
                    variant="solid" sx={{ '--Avatar-size': '30px' }}
                >
                    {topThree}
                </Avatar>
            }
            badgeInset="14%"
            sx={{ '--Badge-paddingX': '0px' }}
        >
            <Avatar alt="Travis Howard" src={emp?.avatar} sx={{ height: 80, width: 80 }} />
        </Badge>
        <Typography level="title-sm">
            {emp?.name || 'ชื่อ-นามสกุล'}
        </Typography>
        <Chip
            startDecorator={<Assignment />}
            endDecorator={'เคส'} color="primary" variant="solid"
        >
            {emp?.count || 0}
        </Chip>
    </Stack>
)

const employees = [
    { name: 'พนักงาน 1', amount_case: 500, avatar: 'https://images.pumpkin.tools/UserLogo.jpg' },
    { name: 'พนักงาน 2', amount_case: 400, avatar: '' },
    { name: 'พนักงาน 3', amount_case: 250, avatar: '' },
]

export default function TopEmpReceive({ topEmp }) {
    return (
        <>
            <Card>
                <Typography fontWeight='bold'>พนักงานที่รับเคสมากที่สุด</Typography>
                <CardContent>
                    <Grid2 container spacing={2}>

                        {/* <Stack justifyContent='space-around' direction='row'>    */}
                        {topEmp && topEmp.map((emp, index) => (
                            <Grid2 size={{xs : 6 ,md : 12,lg: 4}} key={index}>
                                <UserDetail emp={emp} topThree={index + 1} />
                            </Grid2>
                        ))}
                        {/* </Stack> */}

                    </Grid2>
                </CardContent>
            </Card>
        </>
    )
}