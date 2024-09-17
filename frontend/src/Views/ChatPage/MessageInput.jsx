import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import FormControl from '@mui/joy/FormControl';
import Textarea from '@mui/joy/Textarea';
import {Stack } from '@mui/joy';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import {useRef} from "react";
export default function MessageInput(props) {
    const {onSubmit ,Disable} = props;
    const textAreaRef = useRef(null);
    const handleClick = () => {
        const TextareaElement = textAreaRef.current.querySelector('textarea');
        if (TextareaElement) {
            console.log(TextareaElement.value)
        }
        onSubmit(TextareaElement.value);
        TextareaElement.value = null
    };
    return (
        <Box sx={{ px: 2, pb: 3 }}>
            <FormControl>
                <Textarea disabled={Disable} id={'Input'} placeholder={!Disable ? 'พิมพ์ข้อความที่นี่...' : 'คุณไม่มีสิทธิ์'} aria-label="Message" ref={textAreaRef}
                    endDecorator={
                        <Stack
                            direction="row"
                            sx={{
                                justifyContent: 'space-between', alignItems: 'center', flexGrow: 1,
                                py: 1, pr: 1, borderTop: '1px solid', borderColor: 'divider',
                            }}
                        >
                            <Button
                                size="sm" color="primary" sx={{ alignSelf: 'center', borderRadius: 'sm' }}
                                endDecorator={<SendRoundedIcon />} onClick={handleClick} disabled={Disable}
                            >
                                ส่ง (ctrl + enter)
                            </Button>
                        </Stack>
                    }
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                            handleClick();
                        }
                    }}
                    sx={{'& textarea:first-of-type': {minHeight: 72,},}}
                />
            </FormControl>
        </Box>
    );
}