import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import FormControl from '@mui/joy/FormControl';
import Textarea from '@mui/joy/Textarea';
import {Stack } from '@mui/joy';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import {useRef} from "react";
export default function MessageInput(props) {
    // eslint-disable-next-line react/prop-types
    const { textAreaValue, setTextAreaValue, onSubmit } = props;
    const textAreaRef = useRef(null);
    const handleClick = () => {
        alert(textAreaValue)
        // eslint-disable-next-line react/prop-types
        if (textAreaValue.trim() !== '') {
            onSubmit();
            setTextAreaValue('');
        }
    };
    return (
        <Box sx={{ px: 2, pb: 3 }}>
            <FormControl>
                <Textarea placeholder="พิมพ์ข้อความที่นี่..." aria-label="Message" ref={textAreaRef}
                    onChange={(e) => {
                        setTextAreaValue(e.target.value);
                    }}
                    value={textAreaValue} minRows={3} maxRows={10}
                    endDecorator={
                        <Stack
                            direction="row"
                            sx={{
                                justifyContent: 'space-between', alignItems: 'center', flexGrow: 1,
                                py: 1, pr: 1, borderTop: '1px solid', borderColor: 'divider',
                            }}
                        >
                            <div>
                                {/*<IconButton size="sm" variant="plain" color="neutral">*/}
                                {/*    <FormatBoldRoundedIcon />*/}
                                {/*</IconButton>*/}
                                {/*<IconButton size="sm" variant="plain" color="neutral">*/}
                                {/*    <FormatItalicRoundedIcon />*/}
                                {/*</IconButton>*/}
                                {/*<IconButton size="sm" variant="plain" color="neutral">*/}
                                {/*    <StrikethroughSRoundedIcon />*/}
                                {/*</IconButton>*/}
                                {/*<IconButton size="sm" variant="plain" color="neutral">*/}
                                {/*    <FormatListBulletedRoundedIcon />*/}
                                {/*</IconButton>*/}
                            </div>
                            <Button
                                size="sm" color="primary" sx={{ alignSelf: 'center', borderRadius: 'sm' }}
                                endDecorator={<SendRoundedIcon />} onClick={handleClick}
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