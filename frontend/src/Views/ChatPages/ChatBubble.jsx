import Stack from "@mui/joy/Stack";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import {Sheet} from "@mui/joy";
import {useAuth} from "../../context/AuthContext.jsx";
import {MessageStyle} from "../../styles/MessageStyle.js";
import {Link} from "react-router-dom";

export default function Bubble(props) {
    const {user} = useAuth();
    const {sender, variant, content, created_at, contentType} = props;
    const isSent = variant === 'sent';
    return (
        <Box sx={{maxWidth: '60%', minWidth: 'auto'}}>
            <Stack direction="row" spacing={2} sx={MessageStyle.Bubble.Main}>
                <Typography level="body-xs">
                    {sender === user.name ? sender : sender.name}
                </Typography>
                <Typography level="body-xs">{new Date(created_at).toLocaleString()}</Typography>
            </Stack>
            <Box sx={{position: 'relative'}}>
                <Sheet sx={isSent ? MessageStyle.Bubble.IsSent : MessageStyle.Bubble.IsNotSent}>
                    {
                        contentType === 'sticker' ? (
                            <img src={content} alt=""/>
                        ) : contentType === 'image' ? (
                            <Sheet
                                variant="outlined"
                                sx={isSent ? MessageStyle.Bubble.ImageIsSent : MessageStyle.Bubble.ImageIsNotSent}>
                                <Stack direction="row" spacing={1.5} sx={{alignItems: 'center'}}>
                                    <Link to={content} target={'_blank'}>
                                        <img src={content} width={200} alt=""/>
                                    </Link>
                                </Stack>
                            </Sheet>
                        ) : (
                            <Typography
                                level="body-sm"
                                sx={isSent ? MessageStyle.Bubble.TextIsSent : MessageStyle.Bubble.TextIsNotSent}>
                                {content}
                            </Typography>
                        )
                    }
                </Sheet>
            </Box>
        </Box>
    )
}