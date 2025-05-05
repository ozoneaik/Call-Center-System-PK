import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/joy";
import { ThumbDown, ThumbUp, ThumbsUpDown } from '@mui/icons-material';

const ListComponent = ({ label = 'ไม่พบ label', like = 0, unlike = 0, noFeedback = 0 }) => (
    <Stack direction='row' justifyContent='space-between'>
        <Typography>{label}</Typography>
        <Stack direction='row' spacing={2}>
            <Chip startDecorator={<ThumbUp />} variant="solid" color="success">{like}</Chip>
            <Chip startDecorator={<ThumbDown />} variant="solid" color="danger">{unlike}</Chip>
            <Chip startDecorator={<ThumbsUpDown />} variant="solid" color="neutral">{noFeedback}</Chip>
        </Stack>
    </Stack>
)

export default function LikeUnLike({ stars }) {
    return (
        <Card>
            <Typography fontWeight='bold'>จำนวนการประเมิน</Typography>
            <CardContent>
                <Box sx={{ height: 300, overflow: 'auto' }}>
                    <Stack spacing={2}>
                        {stars && stars.rooms.map((item, index) => (
                            <ListComponent key={index} label={item.roomName} like={item.count} />
                        ))}
                    </Stack>
                </Box>
            </CardContent>
        </Card>
    )
}