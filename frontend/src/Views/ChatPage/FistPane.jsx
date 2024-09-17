import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import Stack from "@mui/joy/Stack";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import ListDivider from "@mui/joy/ListDivider";
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import {toggleMessagesPane} from "../../Components/utils.js";
import TextsmsIcon from "@mui/icons-material/Textsms";
import Button from "@mui/joy/Button";

export default function FistPane(props) {
    const {setSelectedChat,selectedChatId} = props;
    return (
        <>
            <ListItem>
                <ListItemButton
                    onClick={() => {
                        toggleMessagesPane();
                        setSelectedChat({id : 0});
                        localStorage.setItem('selectChat', '0');
                    }}
                    selected={localStorage.getItem('selectChat') === '0'}
                    color="neutral"
                    sx={{flexDirection: 'column', alignItems: 'initial', gap: 1}}
                >
                    <Stack direction="row" spacing={1.5}>
                        <Box sx={{flex: 1}}>
                            <Typography level="title-sm" startDecorator={<InsertDriveFileRoundedIcon/>} fontWeight='bold' color='primary'>แชทรวม</Typography>
                        </Box>
                    </Stack>
                    <Typography
                        color='primary'
                        level="body-sm"
                        sx={{
                            display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical',
                            overflow: 'hidden', textOverflow: 'ellipsis',
                        }}
                    >
                        กดเพื่อดูรายละเอียด
                    </Typography>
                </ListItemButton>
            </ListItem>
            <ListDivider sx={{margin: 0}}/>
        </>

    )
}