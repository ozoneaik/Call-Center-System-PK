import Box from "@mui/joy/Box";
import FormControl from "@mui/joy/FormControl";
import {Button, Textarea} from "@mui/joy";
import {MessageStyle} from "../../../styles/MessageStyle.js";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import LocalSeeIcon from "@mui/icons-material/LocalSee";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import {useState} from "react";
import {useAuth} from "../../../context/AuthContext.jsx";
import {sendApi} from "../../../Api/Messages.js";
import {AlertDiaLog} from "../../../Dialogs/Alert.js";

export const MessageInput = (props) => {
    const {user} = useAuth();
    const {check, msg, setMsg,sender,setMessages,activeId} = props;
    const [imagePreview, setImagePreview] = useState();
    const [selectedFile, setSelectedFile] = useState();
    const [disableBtn, setDisableBtn] = useState(false);

    const handleRemoveImage = () => {
        setImagePreview(null);
        setSelectedFile(null);
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSend = async ({type = 'text', c}) => {
        setDisableBtn(true);
        const C = msg.content ? msg.content : c;
        if (!selectedFile){
            if (C === null || C === undefined || C === '') {
                alert('กรุณากรอกข้อความที่ต้องส่งก่อน')
                return;
            }
        }
        const {data, status} = await sendApi({
            msg: C,
            contentType: type,
            custId: sender.custId,
            conversationId: activeId,
            selectedFile
        });
        console.log(data, status)
        if (status === 200) {
            setMsg({content: '', contentType: 'text', sender: ''});

            // เช็คว่ามีรุปภาพหรือไม่
            if (selectedFile) {
                setMessages((prevMessages) => {
                    const newId = prevMessages.length.toString();
                    return [
                        ...prevMessages,
                        {
                            id: newId,
                            content: imagePreview,
                            contentType: 'image',
                            sender: user,
                            created_at: new Date().toString()
                        },

                    ]
                })
            }
            // เช้คว่า มีการพิมข้อความมาหรือไม่
            if (C) {
                setMessages((prevMessages) => {
                    const newId = prevMessages.length.toString();
                    return [
                        ...prevMessages,
                        {
                            id: newId,
                            content: C,
                            contentType: type,
                            sender: user,
                            created_at: new Date().toString()
                        },

                    ]
                })
            }
        } else AlertDiaLog({title: data.message, text: data.detail, onPassed: () => console.log('')});
        handleRemoveImage();
        setDisableBtn(false);
    }
    return (
        <>
            {check === '1' && (
                <Box sx={{px: 2, pb: 3}}>
                    <FormControl>
                        <Textarea
                            id='inputSend'
                            startDecorator={
                                imagePreview && (
                                    <Box sx={{position: 'relative', maxWidth: 300}}>
                                        <img src={imagePreview} alt="Preview"
                                             style={MessageStyle.imagePreview}
                                        />
                                        <Button onClick={handleRemoveImage} sx={MessageStyle.BtnCloseImage}>
                                            x
                                        </Button>
                                    </Box>
                                )
                            }
                            disabled={sender.emp !== user.empCode}
                            placeholder="พิมพ์ข้อความที่นี่..."
                            minRows={imagePreview ? 1 : 3} maxRows={10}
                            value={msg.content}
                            onChange={(e) => setMsg({...msg, content: e.target.value})}
                            endDecorator={
                                <Stack direction="row" sx={MessageStyle.TextArea}>
                                    <Button
                                        disabled={(sender.emp !== user.empCode) || disableBtn || selectedFile}
                                        color="danger" component="label"
                                    >
                                        <Typography sx={MessageStyle.InsertImage}>แนปรูป</Typography>
                                        <input type="file" hidden accept="image/*"
                                               onChange={handleImageChange}
                                        />
                                        <LocalSeeIcon/>
                                    </Button>
                                    <Button
                                        disabled={(sender.emp !== user.empCode) || disableBtn}
                                        color="primary"
                                        onClick={() => handleSend({type: 'text'})}
                                    >
                                        <Typography
                                            sx={{color: 'white', display: {xs: 'none', sm: 'block'}}}>
                                            ส่ง ( ctrl+enter )
                                        </Typography>
                                        <SendRoundedIcon/>
                                    </Button>
                                </Stack>
                            }
                            onKeyDown={async (event) => {
                                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                                    await handleSend({})
                                }
                            }}
                        />
                    </FormControl>
                </Box>
            )}
        </>
    )
}