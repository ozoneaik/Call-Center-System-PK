import Stack from "@mui/joy/Stack";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import {Sheet} from "@mui/joy";
import {MessageStyle} from "../../../styles/MessageStyle.js";
import {Link} from "react-router-dom";
import {useAuth} from "../../../context/AuthContext.jsx";
import {Avatar} from "@mui/joy";
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

export default function Bubble(props) {
    const {user} = useAuth();
    const {sender, variant, content, created_at, contentType} = props;
    const isSent = variant === 'sent';
    return (
        <Box sx={{maxWidth: '60%', minWidth: 'auto'}}>
            <Stack direction="row" spacing={2} sx={MessageStyle.Bubble.Main}>
                <Typography level="body-xs">
                    {isSent ? sender.name : sender.custName ? sender.custName : sender.name}
                </Typography>
                <Typography level="body-xs">{new Date(created_at).toLocaleString()}</Typography>
            </Stack>
            <Box sx={{position: 'relative'}}>
                <Sheet sx={
                    isSent ? sender.empCode === user.empCode ? MessageStyle.Bubble.IsMySent : MessageStyle.Bubble.IsSent : MessageStyle.Bubble.IsNotSent}>
                    {
                        contentType === 'sticker' ? (
                            <Sheet variant="outlined"
                                   sx={isSent ? MessageStyle.Bubble.ImageIsSent : MessageStyle.Bubble.ImageIsNotSent}>
                                <img src={content} alt="" width={165}/>
                            </Sheet>
                        ) : contentType === 'image' ? (
                                <Sheet
                                    variant="outlined"
                                    sx={isSent ? MessageStyle.Bubble.ImageIsSent : MessageStyle.Bubble.ImageIsNotSent}>
                                    <Stack direction="row" spacing={1.5} sx={{alignItems: 'center'}}>
                                        <Link to={content} target={'_blank'}>
                                            <img src={content} width={165} alt=""/>
                                        </Link>
                                    </Stack>
                                </Sheet>
                            ) :
                            (contentType === 'file') || (contentType === 'video') || (contentType === 'audio') ? (
                                    <Sheet
                                        variant="outlined"
                                        sx={[
                                            {
                                                px: 1.75,
                                                py: 1.25,
                                                borderRadius: 'lg',
                                            },
                                            isSent ? {borderTopRightRadius: 0} : {borderTopRightRadius: 'lg'},
                                            isSent ? {borderTopLeftRadius: 'lg'} : {borderTopLeftRadius: 0},
                                        ]}
                                    >
                                        <Stack direction="row" spacing={1.5} sx={{alignItems: 'center'}}>
                                            <Avatar color="primary" size="lg">
                                                {contentType === 'file' ?
                                                    <InsertDriveFileRoundedIcon/>
                                                    : contentType === 'video' ? <PlayCircleIcon/>
                                                        : <VolumeUpIcon/>
                                                }
                                            </Avatar>
                                            <div>
                                                <Typography sx={{fontSize: 'sm'}}>
                                                    {contentType === 'file' ? 'ไฟล์ PDF' : contentType === 'video' ? 'ไฟล์ Video' : 'ไฟล์เสียง'}
                                                </Typography>
                                                <Link to={content} target="_blank" level="body-sm">ดู</Link>
                                            </div>
                                        </Stack>
                                    </Sheet>
                                ) :
                                (
                                    <Typography
                                        component="pre"
                                        level="body-sm"
                                        sx={{
                                            whiteSpace: 'pre-wrap', // เพื่อให้รองรับการขึ้นบรรทัดใหม่ (\n)
                                            wordBreak: 'break-word', // ให้ข้อความแสดงผลดีในกรณีข้อความยาว
                                            ...(
                                                isSent
                                                    ? (sender.empCode === user.empCode
                                                        ? MessageStyle.Bubble.TextMySent
                                                        : MessageStyle.Bubble.TextIsSent)
                                                    : MessageStyle.Bubble.TextIsNotSent
                                            )
                                        }}>
                                        {content}
                                    </Typography>
                                )
                    }
                </Sheet>
            </Box>
        </Box>
    )
}