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
import ListDivider from "@mui/joy/ListDivider";
import {BoxStyle, Main, Head, HeadTitle, ListStyle} from "../../assets/styles/ChatPaneStyle.js";

export default function ChatsPane(props) {
    const {roomId, chatRooms, chats, setSelectedChat, selectedChatId,} = props;
    return (
        <Sheet sx={Main}>
            <Stack direction="row" spacing={1} sx={Head}>
                <Typography component="h1" sx={HeadTitle}>
                    {Number(roomId) === 0 ? 'ห้องแชทใหม่' : `ห้องแชทที่ ${roomId}`}
                </Typography>
                <IconButton variant="plain" aria-label="edit" color="neutral" size="sm" sx={{display: {sm: 'none'}}}>
                    <CloseRoundedIcon/>
                </IconButton>
            </Stack>
            <Box sx={{px: 2, pb: 1.5}}>
                <Input size="sm" startDecorator={<SearchRoundedIcon/>} placeholder="Search" aria-label="Search"/>
            </Box>
            <List sx={ListStyle}>
                {
                    chats.length > 0 ? (
                        <>
                            <FistPane setSelectedChat={setSelectedChat} selectedChatId={selectedChatId}/>
                            <Typography fontWeight='bold'>รายการแชท</Typography>
                            <ListDivider sx={{margin: 0}}/>
                            {
                                chats.map((chat) => (
                                    chat.id !== 0 &&
                                    <ChatListItem
                                        key={chat.id} {...chat}
                                        setSelectedChat={setSelectedChat}
                                        chatRooms={chatRooms}
                                    ></ChatListItem>
                                ))
                            }
                        </>
                    ) : (
                        <Box sx={BoxStyle}>
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