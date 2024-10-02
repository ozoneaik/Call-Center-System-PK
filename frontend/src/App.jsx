import {useEffect, useState} from "react";
import {Snackbar} from "@mui/joy";
import {useNotification} from "./context/NotiContext.jsx";
import Typography from "@mui/joy/Typography";
import Avatar from "@mui/joy/Avatar";
import Box from "@mui/joy/Box";
import CancelIcon from '@mui/icons-material/Cancel';
import CircleNotificationsIcon from '@mui/icons-material/CircleNotifications';

function App() {
    const [sender, setSender] = useState({});
    const [state, setState] = useState({
        open : false,
        vertical: 'top',
        horizontal: 'center',
    });
    const {notification} = useNotification();
    const { vertical, horizontal, open } = state;

    useEffect(() => {
        if (notification) {
            console.log('notification => ',notification.title,notification)
            setSender(notification);
            if (notification.title === 'มีข้อความใหม่เข้ามา'){
                handleClick({ vertical: 'top', horizontal: 'right' })();
            }
        }
    },[notification])

    const handleClick = (newState) => () => {
        setState({ ...newState, open: true });
    };

    const handleClose = () => {
        setState({ ...state, open: false });
        localStorage.removeItem('notification');
    };

    return (
        <>
            <Snackbar
                variant='outlined'
                color="success"
                startDecorator={sender.contentType ? <Avatar src={sender.avatar}/> : <CircleNotificationsIcon/>}
                endDecorator={<Typography color='danger' onClick={()=>handleClose()}>ปิด</Typography>}
                size='lg'
                anchorOrigin={{ vertical, horizontal }}
                open={open}
                onClose={handleClose}
                key={vertical + horizontal}
                sx={{
                    boxShadow: 'md',
                    borderRadius: 'md',
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography fontWeight="bold" color='success'>
                            {sender.message} {sender.custName}
                        </Typography>
                    </Box>
                    <Typography level="body-sm">
                        {sender.contentType ? sender.contentType === 'text' ? sender.content : 'ส่งรูปภาพ หรือ sicker' : ''}
                    </Typography>
                </Box>

            </Snackbar>
        </>
    )
}

export default App
