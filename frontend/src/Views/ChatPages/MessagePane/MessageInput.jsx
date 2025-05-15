import Box from "@mui/joy/Box";
import FormControl from "@mui/joy/FormControl";
import { Button, Textarea } from "@mui/joy";
import { MessageStyle } from "../../../styles/MessageStyle.js";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { sendApi } from "../../../Api/Messages.js";
import { AlertDiaLog } from "../../../Dialogs/Alert.js";
import { StickerPK } from "./StickerPK.jsx";
import { FilePresent, PictureAsPdf, SendRounded } from '@mui/icons-material';
import { useMediaQuery } from "@mui/material";
export const MessageInput = (props) => {
    const { user } = useAuth();
    const { disable, setDisable } = props
    const { check, msg, setMsg, sender, setMessages, activeId } = props;
    const [imagePreview, setImagePreview] = useState([]);
    const [selectedFile, setSelectedFile] = useState();
    const [disableBtn, setDisableBtn] = useState(false);
    const [msgInput, setMsgInput] = useState(msg);

    useEffect(() => {
        setMsgInput({
            ...msgInput,
            content: msg.content,
        });
    }, [msg])


    const handleRemoveImage = (index) => {
        if (index) {
            setImagePreview((prev) => prev.filter((_, i) => i !== index));
            setSelectedFile((prev) => prev.filter((_, i) => i !== index));

        } else {

            setImagePreview([]);
            setSelectedFile(null);
        }
    };

    const handleImageChange = (event) => {
        console.log('event upload file >>> ', event.target.files)
        // const file = event.target.files;
        const files = Array.from(event.target.files);
        if (files) {
            setSelectedFile(files);
            if (files.length > 0) {
                setSelectedFile(files);

                // ใช้ forEach แทนการ map เพื่ออัปเดต preview เมื่ออ่านไฟล์เสร็จ
                files.forEach((file) => {

                    const reader = new FileReader();
                    reader.onloadend = () => {
                        // อัปเดต state โดยการใช้ฟังก์ชัน callback เพื่อแก้ปัญหา "prev is not iterable"
                        setImagePreview((prev) => [...prev, { type: file.type, data: reader.result, fileName: file.name }]);
                    };
                    reader.readAsDataURL(file);
                });
            }
        }
    };

    const handleSend = async ({ type = 'text', c }) => {
        setDisableBtn(true);
        setDisable(true);
        // const C = msg.content ? msg.content : c;
        const C = msgInput.content ? msgInput.content : c;
        if (!selectedFile) {
            if (C === null || C === undefined || C === '') {
                alert('กรุณากรอกข้อความที่ต้องส่งก่อน')
                setDisable(false)
                return;
            }
        }
        const { data, status } = await sendApi({
            msg: C,
            contentType: type,
            custId: sender.custId,
            conversationId: activeId,
            selectedFile
        });
        console.log(data, status, selectedFile)
        const contents = data.content ? data.content : [];

        if (status === 200) {
            // setMsg({ content: '', contentType: 'text', sender: '' });
            setMsgInput({ content: '', contentType: 'text', sender: '' });
            console.log(selectedFile, C)
            contents.map((item) => {
                setMessages((prev) => {
                    return [
                        ...prev,
                        {
                            content: item.content,
                            contentType: item.contentType,
                            sender: user,
                            created_at: new Date().toISOString(),
                        }
                    ]
                })
            })
        } else AlertDiaLog({ title: data.message, text: data.detail, onPassed: () => console.log('') });
        handleRemoveImage();
        setDisableBtn(false);
        setDisable(false);
    }

    return (
        <>
            {check === '1' && (
                <Box sx={{ px: 2, pb: 3 }}>
                    <FormControl>
                        <Textarea
                            id='inputSend'
                            startDecorator={
                                imagePreview && (
                                    imagePreview.length > 0 && imagePreview.map((image, index) => (
                                        <Box sx={{ position: 'relative', maxWidth: 300 }} key={index}>
                                            {image.type.startsWith('image/') ? (
                                                <img
                                                    src={image.data}
                                                    alt="Preview"
                                                    style={MessageStyle.imagePreview}
                                                />
                                            ) : image.type.startsWith('video/') ? (
                                                <video
                                                    controls
                                                    src={image.data}
                                                    style={{ height: 200 }}
                                                />
                                            ) : (
                                                <Box sx={{ mx: 1, p: 1, minWidth: 100, minHeight: 100, backgroundColor: '#d1dcf5', borderRadius: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                    <div>
                                                        <PictureAsPdf fontSize="50px" />
                                                        <Typography>{image.fileName}</Typography>
                                                    </div>
                                                </Box>
                                            )}
                                            <Button onClick={() => handleRemoveImage(index)} sx={MessageStyle.BtnCloseImage}>
                                                x
                                            </Button>
                                        </Box>
                                    ))

                                )
                            }
                            disabled={(sender.emp !== user.empCode) && (user.role !== 'admin')}
                            placeholder="พิมพ์ข้อความที่นี่..."
                            minRows={imagePreview ? 2 : 3} maxRows={10}
                            value={msgInput.content}
                            onChange={(e) => {
                                setMsgInput({ ...msg, content: e.target.value });
                                // setMsg({ ...msg, content: e.target.value });
                            }}
                            // value={msg.content}
                            // onChange={(e) => setMsg({ ...msg, content: e.target.value })}
                            endDecorator={
                                <Stack direction={'row'} gap={1} sx={MessageStyle.TextArea}>
                                    <StickerPK disable={disable} sender={sender} activeId={activeId} />
                                    <Button
                                        fullWidth={useMediaQuery('(max-width: 1000px)')}
                                        component='label' loading={disable} color="danger"
                                        startDecorator={<FilePresent />} disabled={disable}
                                    >
                                        <Typography sx={MessageStyle.InsertImage}>แนปไฟล์</Typography>
                                        <input
                                            type="file" hidden
                                            accept="image/*,video/*,application/pdf"
                                            onChange={handleImageChange} multiple
                                        />
                                    </Button>

                                    <Button
                                        fullWidth={useMediaQuery('(max-width: 1000px)')}
                                        startDecorator={<SendRounded />}
                                        loading={disable} color="primary" disabled={disable}
                                        onClick={() => handleSend({ type: 'text' })}
                                    >
                                        {!useMediaQuery('(max-width: 1000px)') && <Typography sx={MessageStyle.InsertImage}>ส่ง {'(curl+enter)'}</Typography>}
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