import Stack from "@mui/joy/Stack";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import {Avatar, Sheet} from "@mui/joy";
import {MessageStyle} from "../../../styles/MessageStyle.js";
import {Link} from "react-router-dom";
import {useAuth} from "../../../context/AuthContext.jsx";
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import Divider from "@mui/joy/Divider";
import ContextMenuButton from "./ContextMenuButton.jsx";

export default function Bubble(props) {
    const {user} = useAuth();
    const {sender, variant, content, created_at, contentType} = props;
    const {line_message_id, line_quote_token, line_quoted_message_id} = props;
    const {messages, onReply,setMessages} = props;
    const isSent = variant === 'sent';

    return (
        <Box sx={{maxWidth: '60%', minWidth: 'auto'}}>
            <Stack direction="row" spacing={2} sx={MessageStyle.Bubble.Main} onClick={() => {
                console.log(line_message_id, line_quote_token, line_quoted_message_id)
            }}>
                <Typography level="body-xs">
                    {isSent ? sender.name : sender.custName ? sender.custName : sender.name}
                </Typography>
                <Typography level="body-xs">{new Date(created_at).toLocaleString()}</Typography>
            </Stack>
            <Box
                sx={{
                    position: 'relative',
                    "&:hover .action-buttons": {
                        opacity: 1
                    }
                }}
            >
                {/* เมนู hover ต้องการ ตอบกลับ */}
                {line_message_id && <ContextMenuButton onReply={(value) => alert(value)} {...{...props}}/>}

                <Sheet sx={
                    isSent ? sender.empCode === user.empCode ?
                            MessageStyle.Bubble.IsMySent :
                            MessageStyle.Bubble.IsSent :
                        MessageStyle.Bubble.IsNotSent
                }>
                    {
                        line_quoted_message_id ? (
                            <div>
                                {messages.find(item => item.line_message_id === line_quoted_message_id) && (
                                    <Box>
                                        {(() => {
                                            const quotedMessage = messages.find(
                                                item => item.line_message_id === line_quoted_message_id
                                            );
                                            return quotedMessage ? (
                                                <Stack direction='column' mb={2}>
                                                    {!isSent ? (
                                                        <>
                                                            <Typography level='body-sm'>
                                                                {quotedMessage.content}
                                                            </Typography>
                                                            <Divider/>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Typography level='body-sm' sx={{color : 'white'}}>
                                                                {quotedMessage.content}
                                                            </Typography>
                                                            <Divider sx={{bgcolor : 'white'}}/>
                                                        </>
                                                    )}
                                                </Stack>
                                            ) : null;
                                        })()}
                                    </Box>
                                )}
                            </div>

                        ) : <></>
                    }
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
                                            <img src={content} width={165} alt={content}/>
                                        </Link>
                                    </Stack>
                                </Sheet>
                            ) :
                            (contentType === 'file') || (contentType === 'video') || (contentType === 'audio') ? (
                                    <Sheet
                                        variant="outlined"
                                        sx={[
                                            {px: 1.75, py: 1.25, borderRadius: 'lg',},
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
                                        component="pre" level="body-sm"
                                        sx={{
                                            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
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