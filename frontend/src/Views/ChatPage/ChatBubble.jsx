import Avatar from '@mui/joy/Avatar';
import Box from '@mui/joy/Box';
import Stack from '@mui/joy/Stack';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import {useAuth} from "../../Contexts/AuthContext.jsx";
import {Link as L} from "react-router-dom";
import Link from "@mui/joy/Link";



export default function ChatBubble(props) {
    const {user} = useAuth();
    const {id,content, contentType, variant, created_at, attachment = undefined, sender} = props;
    const isSent = variant === 'sent';

    return (
        <Box sx={{maxWidth: '60%', minWidth: 'auto'}}>
            <Stack direction="row" spacing={2} sx={{justifyContent: 'space-between', mb: 0.25}}>
                <Typography level="body-xs">
                    {sender === user.name ? sender : sender.name}
                </Typography>
                <Typography level="body-xs">{new Date(created_at).toLocaleString()}</Typography>
            </Stack>
            {attachment ? (
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
                            <InsertDriveFileRoundedIcon/>
                        </Avatar>
                        <div>
                            <Typography sx={{fontSize: 'sm'}}>{attachment.fileName}</Typography>
                            <Typography level="body-sm">{attachment.size}</Typography>
                        </div>
                    </Stack>
                </Sheet>
            ) : (
                (
                    <Box
                        sx={{position: 'relative'}}
                    >
                        <Sheet
                            color={isSent ? 'primary' : 'neutral'} variant={isSent ? 'solid' : 'soft'}
                            sx={[
                                {p: 1.25, borderRadius: 'lg',},
                                isSent ? {borderTopRightRadius: 0,} : {borderTopRightRadius: 'lg',},
                                isSent ? {borderTopLeftRadius: 'lg',} : {borderTopLeftRadius: 0,},
                                isSent ? {
                                    backgroundColor: 'var(--joy-palette-primary-solidBg)'
                                } : {
                                    backgroundColor: 'background.body',
                                },
                            ]}
                        >
                            {
                                contentType === 'sticker' ? (
                                    <img src={content} alt=""/>
                                ) : contentType === 'image' ? (
                                    <Sheet
                                        variant="outlined"
                                        sx={[
                                            {px: 1.75, py: 1.25, borderRadius: 'lg',},
                                            isSent ? {borderTopRightRadius: 0} : {borderTopRightRadius: 'lg'},
                                            isSent ? {borderTopLeftRadius: 'lg'} : {borderTopLeftRadius: 0},
                                        ]}
                                    >
                                        <Stack direction="row" spacing={1.5} sx={{alignItems: 'center'}}>
                                            <Link component={L} to={content} target={'_blank'}>
                                                <img src={content} width={200} alt=""/>
                                            </Link>
                                        </Stack>
                                    </Sheet>
                                ) : (
                                    <Typography
                                        level="body-sm"
                                        sx={[
                                            isSent ? {color: 'var(--joy-palette-common-white)',} : {color: 'var(--joy-palette-text-primary)'},
                                        ]}
                                    >{content}</Typography>
                                )
                            }
                        </Sheet>
                    </Box>
                )
            )
            }
        </Box>
    );
}