import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, Textarea, Typography, Chip, Button, ChipDelete, Stack } from '@mui/joy';
import { EmojiEmotions, Info, Send } from '@mui/icons-material';
import { sendApi } from '../../../Api/Messages';
import { AlertDiaLog } from '../../../Dialogs/Alert';
import { useNotification } from '../../../context/NotiContext';
import { useAuth } from '../../../context/AuthContext';

export default function MessageInputNew(props) {
    const { sender, activeId, msg,setMsg } = props;
    const [inputText, setInputText] = useState('');
    const [firstRender, setFirstRender] = useState(true);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const { notification } = useNotification();
    const { user } = useAuth();
    const textareaRef = useRef(null);

    useEffect(() => {
        if (firstRender) {
            setFirstRender(false);
            return;
        }
    }, [notification]);

    useEffect(() =>{
        if (firstRender) {
            setFirstRender(false);
            return;
        }
        console.log('msg >>> ', msg);
        setInputText(inputText + msg.content)
    },[msg])

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
                <Box sx={{ mt: 2 }}>
                    <Typography level="body-sm" sx={{ mb: 1 }}>
                        ไฟล์ที่แนบ:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {files.map((file, index) => (
                            <Chip
                                key={index}
                                onClick={() => window.open(URL.createObjectURL(file), '_blank')}
                                variant='solid'
                                endDecorator={
                                    <ChipDelete
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteFile(index);
                                        }}
                                    />
                                }
                            >
                                {file.name}
                            </Chip>
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
                >
                    สติกเกอร์
                </Button>
                <Button
                    onClick={() => window.open('https://images.pumpkin.tools/call_center_helper/how_to_send_file.mp4', '_blank')}
                    size='sm' 
                    variant='outlined' 
                    color='neutral' 
                    endDecorator={<Info />}
                >
                    วิธีการใช้งาน ส่งข้อความ
                </Button>
            </Stack>
        </Box>
    );
}