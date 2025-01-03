import Box from "@mui/joy/Box";
import FormControl from "@mui/joy/FormControl";
import { Button, Textarea } from "@mui/joy";
import { MessageStyle } from "../../../styles/MessageStyle.js";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { useState } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { sendApi } from "../../../Api/Messages.js";
import { AlertDiaLog } from "../../../Dialogs/Alert.js";
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { StickerPK } from "./StickerPK.jsx";
import FilePresentIcon from '@mui/icons-material/FilePresent';

export const MessageInput = (props) => {
    const { user } = useAuth();
    const { check, msg, setMsg, sender, setMessages, activeId } = props;
    const [imagePreview, setImagePreview] = useState([]);
    const [selectedFile, setSelectedFile] = useState();
    const [disableBtn, setDisableBtn] = useState(false);

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
            // const reader = new FileReader();
            // reader.onloadend = () => {
            //     // setImagePreview(reader.result);
            //     setImagePreview({ type: file.type, data: reader.result });
            // };
            // reader.readAsDataURL(file);

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
        const C = msg.content ? msg.content : c;
        if (!selectedFile) {
            if (C === null || C === undefined || C === '') {
                alert('กรุณากรอกข้อความที่ต้องส่งก่อน')
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
        console.log('data, status, selectedFile')
        console.log(data, status, selectedFile)
        if (status === 200) {
            setMsg({ content: '', contentType: 'text', sender: '' });
        } else AlertDiaLog({ title: data.message, text: data.detail, onPassed: () => console.log('') });
        handleRemoveImage();
        setDisableBtn(false);
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
                                                        <PictureAsPdfIcon fontSize="50px" />
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
                            minRows={imagePreview ? 1 : 3} maxRows={10}
                            value={msg.content}
                            onChange={(e) => setMsg({ ...msg, content: e.target.value })}
                            endDecorator={
                                <Stack direction="row" gap={1} sx={MessageStyle.TextArea}>

                                    <StickerPK sender={sender} activeId={activeId} />
                                    {/* <StickerPK sender={sender} activeId={activeId} Disable={(sender.emp !== user.empCode) || disableBtn || selectedFile} /> */}

                                    <Button
                                        // disabled={(sender.emp !== user.empCode) || disableBtn || selectedFile}
                                        color="danger" component="label"
                                    >
                                        <Typography sx={MessageStyle.InsertImage}>แนปไฟล์</Typography>
                                        <input type="file" hidden accept="image/*,video/*,application/pdf"
                                            onChange={handleImageChange} multiple
                                        />
                                        <FilePresentIcon />
                                    </Button>

                                    <Button
                                        // disabled={(sender.emp !== user.empCode) || disableBtn}
                                        color="primary"
                                        onClick={() => handleSend({ type: 'text' })}
                                    >
                                        <Typography sx={MessageStyle.InsertImage}>
                                            ส่ง ( ctrl+enter )
                                        </Typography>
                                        <SendRoundedIcon />
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