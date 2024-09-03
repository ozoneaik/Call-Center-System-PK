import Stack from '@mui/joy/Stack';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import {Chip, IconButton} from '@mui/joy';
import List from '@mui/joy/List';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ChatListItem from './ChatListItem';
import Box from "@mui/joy/Box";
import Input from "@mui/joy/Input";
import {toggleMessagesPane} from "../../Components/utils.js";

export default function ChatsPane(props) {
    const {chats, setSelectedChat, selectedChatId,} = props;
    return (
        <Sheet
            sx={{
                borderRight: '1px solid', borderColor: 'divider', overflowY: 'auto',
                height: {sm: 'calc(100dvh - var(--Header-height))', md: '100dvh'},
            }}
        >
            <Stack
                direction="row" spacing={1}
                sx={{alignItems: 'center', justifyContent: 'space-between', p: 2, pb: 1.5}}
            >
                <Typography
                    component="h1"
                    endDecorator={
                        <Chip variant="soft" color="primary" size="md" slotProps={{root: {component: 'span'}}}>
                            10
                        </Chip>
                    }
                    sx={{fontSize: {xs: 'md', md: 'lg'}, fontWeight: 'lg', mr: 'auto'}}
                >
                    ข้อความ
                </Typography>
                <IconButton
                    variant="plain" aria-label="edit" color="neutral" size="sm"
                    sx={{display: {xs: 'none', sm: 'unset'}}}
                >
                    <EditNoteRoundedIcon/>
                </IconButton>
                <IconButton
                    variant="plain" aria-label="edit" color="neutral" size="sm" sx={{display: {sm: 'none'}}}
                    // onClick={() => {
                    //     toggleMessagesPane();
                    // }}
                >
                    <CloseRoundedIcon/>
                </IconButton>
            </Stack>
            <Box sx={{px: 2, pb: 1.5}}>
                <Input size="sm" startDecorator={<SearchRoundedIcon/>} placeholder="Search" aria-label="Search"/>
            </Box>
            <List
                sx={{
                    py: 0,
                    '--ListItem-paddingY': '0.75rem',
                    '--ListItem-paddingX': '1rem',
                }}
            >
                {chats.map((chat) => (
                    <ChatListItem
                        key={chat.id}{...chat}
                        setSelectedChat={setSelectedChat}
                        selectedChatId={selectedChatId}
                    ></ChatListItem>
                ))}
            </List>
        </Sheet>
    );
}