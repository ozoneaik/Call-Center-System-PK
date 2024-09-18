import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import Stack from "@mui/joy/Stack";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import ListDivider from "@mui/joy/ListDivider";
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import {toggleMessagesPane} from "../../Components/utils.js";
import {ListPane} from "../../assets/styles/FirstPaneStyle.js";

export default function FistPane(props) {
    const {setSelectedChat} = props;
    const selectChat = localStorage.getItem('selectChat');
    const handleChange = () => {
        toggleMessagesPane();
        setSelectedChat({id : 0});
        localStorage.setItem('selectChat', '0');
    }
    return (
        <>
            <ListItem>
                <ListItemButton onClick={handleChange} selected={selectChat === '0'} sx={ListPane}>
                    <Stack direction="row" spacing={1.5}>
                        <Box sx={{flex: 1}}>
                            <Typography level="title-sm" startDecorator={<InsertDriveFileRoundedIcon/>}>
                                แชทรวม
                            </Typography>
                        </Box>
                    </Stack>
                    <Typography>
                        กดเพื่อดูรายละเอียด
                    </Typography>
                </ListItemButton>
            </ListItem>
            <ListDivider sx={{margin: 0}}/>
        </>

    )
}