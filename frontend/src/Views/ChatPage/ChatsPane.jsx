import Stack from '@mui/joy/Stack';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import {IconButton} from '@mui/joy';
import List from '@mui/joy/List';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ChatListItem from './ChatListItem';
import Box from "@mui/joy/Box";
import Input from "@mui/joy/Input";
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import FistPane from "./FistPane.jsx";

export default function ChatsPane(props) {
    const {roomId, chatRooms, roomName, chats, setSelectedChat, selectedChatId,} = props;
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
                    component="h1" sx={{fontSize: {xs: 'md', md: 'lg'}, fontWeight: 'lg', mr: 'auto'}}
                >
                    {Number(roomId) === 0 ? 'ห้องแชทใหม่' : `ห้องแชทที่ ${roomId}`}
                </Typography>
                <IconButton variant="plain" aria-label="edit" color="neutral" size="sm" sx={{display: {sm: 'none'}}}>
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

                {
                    chats.length > 0 ? (
                        <>
                            <FistPane setSelectedChat={setSelectedChat} selectedChatId={selectedChatId}/>
                            {
                                chats.map((chat) => (
                                    chat.id !== 0 &&
                                    <ChatListItem
                                        key={chat.id}{...chat}
                                        setSelectedChat={setSelectedChat}
                                        chatRooms={chatRooms}
                                        selectedChatId={selectedChatId}
                                    ></ChatListItem>
                                ))
                            }
                        </>
                    ) : (
                        <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                            <div>
                                <Typography sx={{textAlign: 'center'}}>
                                    <SentimentVeryDissatisfiedIcon/>
                                </Typography>
                                <Typography>ไม่มีรายแชทในห้องนี้</Typography>
                            </div>
                        </Box>

                    )


                }
            </List>
        </Sheet>
    );
}