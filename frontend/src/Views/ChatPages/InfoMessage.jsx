import {MessageStyle} from "../../styles/MessageStyle.js";
import Avatar from "@mui/joy/Avatar";
import {Box, Card, CardContent, Sheet, Textarea} from "@mui/joy";
import Typography from "@mui/joy/Typography";
import Divider from "@mui/joy/Divider";
import Stack from "@mui/joy/Stack";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from '@mui/icons-material/StarBorder';
import IconButton from "@mui/joy/IconButton";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Button from "@mui/joy/Button";
import {convertFullDate, getRandomColor} from "../../Components/Options.jsx";
import Chip from "@mui/joy/Chip";

const StarRating = ({value, max = 5}) => {
    return (
        <Box sx={{display: 'flex', alignItems: 'center'}}>
            {[...Array(max)].map((_, index) => (
                <IconButton key={index}>
                    {index < value ? <StarIcon sx={{color: '#f15721'}}/> : <StarBorderIcon/>}
                </IconButton>
            ))}
        </Box>
    );
};

export default function InfoMessage(props) {
    const {sender, starList, notes} = props;
    return (
        <Sheet sx={[MessageStyle.Layout, MessageStyle.Info.subLayout]}>
            <Box sx={MessageStyle.Info.Box}>
                <Avatar src={sender.avatar} sx={{width: '80px', height: '80px', mb: 1}}/>
                <Typography level="h4" sx={{mb: 0.5}}>{sender.custName}</Typography>
            </Box>

            <Divider/>

            <Box sx={{p: 2, height: '40%', overflowY: 'scroll'}}>
                <Typography level="title-md" sx={{mb: 1}}>โน๊ต</Typography>
                <Stack spacing={1}>
                    <Textarea placeholder='เพิ่มโน้ต'/>
                    <Box sx={{display: 'flex', justifyContent: 'end', alignItems: 'center'}}>
                        <Button size='sm'>เพิ่ม</Button>
                    </Box>
                    {notes && notes.length > 0 ? notes.map((note, index) => (
                        <Card key={index} variant="soft" color={getRandomColor()}>
                            <CardContent>
                                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <Typography level="body-sm" sx={{color: 'text.tertiary'}}>
                                        {note.text}
                                    </Typography>
                                    <Typography level="body-sm">
                                        <IconButton size='sm'>
                                            <EditIcon onClick={() => alert('edit Notes')}/>
                                        </IconButton>
                                        <IconButton size='sm'>
                                            <DeleteIcon onClick={() => alert('deleteNotes')}/>
                                        </IconButton>
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    )) : (
                        <Box>
                            <Chip size='lg' color='danger'>ไม่พบโน๊ต</Chip>
                        </Box>
                    )}
                </Stack>
            </Box>

            <Divider/>

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

        </Sheet>
    )
}