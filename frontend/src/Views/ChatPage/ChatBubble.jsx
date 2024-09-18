import Box from '@mui/joy/Box';
import Stack from '@mui/joy/Stack';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import {useAuth} from "../../Contexts/AuthContext.jsx";
import {Link as L} from "react-router-dom";
import Link from "@mui/joy/Link";
import {
    ImageIsNotSent,
    ImageIsSent,
    IsNotSent,
    IsSent,
    Main,
    TextIsNotSent,
    TextIsSent
} from "../../assets/styles/ChatBubbleStyle.js";

export default function ChatBubble(props) {
    const {user} = useAuth();
    const {content, contentType, variant, created_at, sender} = props;
    const isSent = variant === 'sent';

    return (
        <Box sx={{maxWidth: '60%', minWidth: 'auto'}}>
            <Stack direction="row" spacing={2} sx={Main}>
                <Typography level="body-xs">
                    {sender === user.name ? sender : sender.name}
                </Typography>
                <Typography level="body-xs">{new Date(created_at).toLocaleString()}</Typography>
            </Stack>
            <Box sx={{position: 'relative'}}>
                <Sheet sx={isSent ? IsSent : IsNotSent}>
                    {
                        contentType === 'sticker' ? (
                            <img src={content} alt=""/>
                        ) : contentType === 'image' ? (
                            <Sheet variant="outlined" sx={isSent ? ImageIsSent : ImageIsNotSent}>
                                <Stack direction="row" spacing={1.5} sx={{alignItems: 'center'}}>
                                    <Link component={L} to={content} target={'_blank'}>
                                        <img src={content} width={200} alt=""/>
                                    </Link>
                                </Stack>
                            </Sheet>
                        ) : (
                            <Typography level="body-sm" sx={isSent ? TextIsSent : TextIsNotSent}>
                                {content}
                            </Typography>
                        )
                    }
                </Sheet>
            </Box>
        </Box>
    );
}