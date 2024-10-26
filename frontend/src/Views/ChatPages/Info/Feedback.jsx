import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import {Box, Card, CardContent} from "@mui/joy";
import {convertFullDate} from "../../../Components/Options.jsx";
import Chip from "@mui/joy/Chip";
import IconButton from "@mui/joy/IconButton";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

const StarRating = ({value, max = 5}) => (
    <Box sx={{display: 'flex', alignItems: 'center'}}>
        {[...Array(max)].map((_, index) => (
            <IconButton key={index}>
                {index < value ? <StarIcon sx={{color: '#f15721'}}/> : <StarBorderIcon/>}
            </IconButton>
        ))}
    </Box>
);

export const Feedback = (props) => {
    const {starList} = props;
    return (
        <Box sx={{p: 2, height: '40%', overflowY: 'scroll'}}>
            <Typography level="title-md" sx={{mb: 1}}>ประวัติการให้ดาว</Typography>
            <Stack spacing={1}>
                {starList && starList.length > 0 ?
                    starList.map((star, index) => (
                        <Card key={index} variant="outlined" sx={{p: 1.5}}>
                            <CardContent>
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <StarRating value={star.rate}/>
                                    <Box sx={{textAlign: 'end'}}>
                                        <Typography level="body-xs" sx={{color: 'text.tertiary'}}>
                                            {star.rate > 0 ? 'ประเมินเมื่อ' : 'ลูกค้าไม่ได้ประเมิน'}
                                        </Typography>
                                        <Typography level="body-xs" sx={{color: 'text.tertiary'}}>
                                            {star.rate > 0 && convertFullDate(star.updated_at)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    )) : (
                        <Box>
                            <Chip size='lg' color='danger'>ไม่พบประวัติ</Chip>
                        </Box>
                    )}
            </Stack>
        </Box>
    )
}