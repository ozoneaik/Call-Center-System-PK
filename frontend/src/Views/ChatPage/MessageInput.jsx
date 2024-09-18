import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import FormControl from '@mui/joy/FormControl';
import Textarea from '@mui/joy/Textarea';
import {Stack} from '@mui/joy';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import {useRef} from "react";
import {InputButton, messageInputStyle, textAreaInput} from "../../assets/styles/MessageInputStyle.js";

export default function MessageInput(props) {
    const {onSubmit, Disable} = props;
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
        <Box sx={{px: 2, pb: 3}}>
            <FormControl>
                <Textarea disabled={Disable} ref={textAreaRef}
                          placeholder={!Disable ? 'พิมพ์ข้อความที่นี่...' : 'คุณไม่มีสิทธิ์'} aria-label="Message"
                          endDecorator={
                              <Stack direction="row-reverse" sx={messageInputStyle}>
                                  <Button disabled={Disable} size="sm" color="primary" sx={InputButton}
                                          endDecorator={<SendRoundedIcon/>} onClick={handleClick}>
                                      ส่ง (ctrl + enter)
                                  </Button>
                              </Stack>
                          }
                          onKeyDown={(event) => {
                              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                                  handleClick();
                              }
                          }}
                          sx={textAreaInput}
                />
            </FormControl>
        </Box>
    );
}