import { useState, useCallback, useEffect, useRef } from 'react';
import { Box, Textarea, Typography, Button, Stack, Card } from '@mui/joy';
import { Delete, EmojiEmotions, Info, RemoveRedEye, Send} from '@mui/icons-material';
import { sendApi } from '../../../Api/Messages';
import { AlertDiaLog } from '../../../Dialogs/Alert';
import { useNotification } from '../../../context/NotiContext';
import { useAuth } from '../../../context/AuthContext';
import StickerPkNew from './StickerPkNew';
import ModalHelperSendMsg from '../../../Components/ModalHelperSendMsg';

export default function MessageInputNew(props) {
    const { sender, activeId, msg, setMsg } = props;
    const [openHelper, setOpenHelper] = useState(false);
    const [inputText, setInputText] = useState('');
    const [firstRender, setFirstRender] = useState(true);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const { notification } = useNotification();
    const [stickerOpen, setStickerOpen] = useState(false);
    const { user } = useAuth();
    const textareaRef = useRef(null);

    useEffect(() => {
        if (firstRender) {
            setFirstRender(false);
            return;
        }
    }, [notification]);

    useEffect(() => {
        if (firstRender) {
            setFirstRender(false);
            return;
        }
        console.log('msg >>> ', msg);
        setInputText(inputText + msg.content)
    }, [msg])

    // ฟังก์ชันสำหรับจัดการการลากและวางไฟล์
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        setFiles((prev) => [...prev, ...droppedFiles]);
    }, []);

    // ฟังก์ชันสำหรับจัดการการวางไฟล์จากคลิปบอร์ด
    const handlePaste = useCallback((e) => {
        const clipboardItems = Array.from(e.clipboardData.items);
        const pastedFiles = [];
        let hasStringData = false;

        clipboardItems.forEach((item) => {
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) {
                    pastedFiles.push(file);
                }
            } else if (item.kind === 'string') {
                hasStringData = true;
                // ไม่ต้องทำอะไรเพิ่มเติม เนื่องจาก Textarea จะรับค่าวางจากคลิปบอร์ดอัตโนมัติ
            }
        });

        if (pastedFiles.length > 0) {
            setFiles((prev) => [...prev, ...pastedFiles]);
            e.preventDefault(); // ป้องกันการวางข้อความเมื่อมีไฟล์
        }
    }, []);

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDeleteFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSend = async () => {
        if ((!inputText.trim() && files.length === 0) || loading) {
            return;
        }

        setLoading(true);
        try {
            const { data, status } = await sendApi({
                msg: inputText,
                contentType: 'text',
                custId: sender.custId,
                conversationId: activeId,
                selectedFile: files
            });

            if (status === 200) {
                setInputText('');
                setFiles([]);
            } else {
                AlertDiaLog({
                    icon: 'error',
                    title: data.message || 'เกิดข้อผิดพลาด',
                    text: data.detail || 'ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง',
                });
            }
        } catch (error) {
            AlertDiaLog({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง',
            });
            console.error('Send message error:', error);
        } finally {
            setLoading(false);
        }
    };

    const isDisabled = (sender.emp !== user.empCode) && (user.role !== 'admin');

    return (
        <Box
            sx={{
                borderRadius: 'lg',
                p: 2,
                minHeight: '100px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            {files.length > 0 && (
                <Box sx={{ my: 2 }}>
                    <Typography level="body-sm" sx={{ mb: 1 }}>
                        ไฟล์ที่แนบ:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {files.map((file, index) => (
                            <Card sx={{ p: 0, pb: 1 }} key={index}>
                                <Stack direction='column' spacing={2}>
                                    <iframe onClick={() => { window.open(URL.createObjectURL(file), '_blank') }} src={URL.createObjectURL(file)} />
                                    <Stack direction='row' spacing={2} justifyContent='center' alignItems='center'>
                                        <Button
                                            variant='solid' size='sm' startDecorator={<RemoveRedEye />}
                                            onClick={() => window.open(URL.createObjectURL(file), '_blank')}
                                        >
                                            ดูแบบเต็ม
                                        </Button>
                                        <Button
                                            variant='solid' color='danger' startDecorator={<Delete />}
                                            onClick={() => handleDeleteFile(index)} size='sm'
                                        >
                                            นำออก
                                        </Button>
                                    </Stack>
                                </Stack>
                            </Card>
                        ))}
                    </Box>
                </Box>
            )}

            <Textarea
                ref={textareaRef}
                disabled={isDisabled}
                placeholder="พิมพ์ข้อความ หรือวาง / ลากไฟล์ที่นี่"
                minRows={4}
                sx={{ mb: 1 }}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
            />

            <Stack direction='row-reverse' spacing={2}>
                <Button
                    disabled={isDisabled || (!inputText.trim() && files.length === 0)}
                    loading={loading}
                    onClick={handleSend}
                    // onClick={() => console.log('file', files)}
                    size='sm'
                    endDecorator={<Send />}
                >
                    ส่ง
                </Button>
                <Button
                    disabled={isDisabled}
                    size='sm'
                    color='warning'
                    endDecorator={<EmojiEmotions />}
                    onClick={() => setStickerOpen(true)}
                >
                    สติกเกอร์
                </Button>
                <Button
                    onClick={() => setOpenHelper(true)}
                    size='sm' variant='outlined' color='neutral'
                    endDecorator={<Info />}
                >
                    วิธีส่งข้อความ (ไฟล์,รูปภาพ,วิดีโอ)
                </Button>
            </Stack>
            {stickerOpen && <StickerPkNew activeId={activeId} sender={sender} open={stickerOpen} setOpen={setStickerOpen} />}
            {openHelper && <ModalHelperSendMsg open={openHelper} setOpen={setOpenHelper} />}
        </Box>
    );
}