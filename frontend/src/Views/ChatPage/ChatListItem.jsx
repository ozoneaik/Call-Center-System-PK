import Box from '@mui/joy/Box';
import ListDivider from '@mui/joy/ListDivider';
import ListItem from '@mui/joy/ListItem';
import ListItemButton from '@mui/joy/ListItemButton';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import CircleIcon from '@mui/icons-material/Circle';
import AvatarWithStatus from './AvatarWithStatus';
import {toggleMessagesPane} from "../../Components/utils.js";
import {Content, DateAndUnRead, Main} from "../../assets/styles/ChatListItemStyle.js";

export default function ChatListItem(props) {
    const {sender, messages, selectedChatId, setSelectedChat} = props;
    const selected = selectedChatId === sender.custId;

    const handleChange = () => {
        toggleMessagesPane();
        setSelectedChat({id: sender.custId, sender, messages});
        localStorage.setItem('selectChat', '1');
    }
    return (
        <>
            <ListItem>
                <ListItemButton onClick={handleChange} selected={selected} color="neutral" sx={Main}>
                    <Stack direction="row" spacing={1.5}>
                        <AvatarWithStatus online={sender.online} src={sender.avatar}/>
                        <Box sx={{flex: 1}}>
                            <Typography level="title-sm">{sender.name}</Typography>
                            <Typography level="title-sm" fontSize={'smaller'}>{sender.description}</Typography>
                        </Box>
                        <Box sx={DateAndUnRead}>
                            {
                                messages[0].unread && <CircleIcon fontSize='12' color="danger"/>
                            }
                            <Typography level="body-xs" noWrap sx={{display: {xs: 'none', md: 'block'}}}>
                                {new Date(messages[0].created_at).toLocaleString()}
                            </Typography>
                        </Box>
                    </Stack>
                    <Typography level="body-sm" sx={Content}>
                        {
                            messages[0].contentType === 'text' ? messages[0].content : 'ส่งรูปภาพ หรือ Sticker เข้ามา'
                        }
                    </Typography>
                </ListItemButton>
            </ListItem>
            <ListDivider sx={{margin: 0}}/>
        </>
    );
}