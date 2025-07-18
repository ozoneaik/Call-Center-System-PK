import React, { useState, useRef } from 'react';
import {
    Modal, ModalDialog, DialogTitle, DialogContent, DialogActions,
    Button, Stack, FormControl, FormLabel, Textarea, Input, Box, Typography,
    Select,
    Option,
    Chip
} from "@mui/joy";
import axiosClient from '../../../../Axios';

export default function CreatePostModal({ open, onClose, onCreated, platformTokens }) {
    const [content, setContent] = useState('');
    const [publishDate, setPublishDate] = useState('');
    const [images, setImages] = useState([]);
    const [selectedPages, setSelectedPages] = useState([]); // ✅ เป็น array เสมอ
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);


    const handleFileChange = (e) => {
        setImages(prev => [...prev, ...Array.from(e.target.files)]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = Array.from(e.dataTransfer.files).filter(file =>
            file.type.startsWith('image/')
        );
        setImages(prev => [...prev, ...files]);
    };

    const handleSelectChange = (event, newValue) => {
        setSelectedPages(newValue); // ✅ MUI Joy ส่ง array มาอยู่แล้ว
        console.log(newValue);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleRemoveImage = (indexToRemove) => {
        setImages(images.filter((_, index) => index !== indexToRemove));
    };

    const handleCreatePost = async () => {
        if (!content.trim()) {
            alert("กรุณาใส่ข้อความโพสต์");
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('message', content);
            if (publishDate) {
                formData.append('publishDate', publishDate);
            }
            selectedPages.forEach((pageId) => {
                formData.append('page_ids[]', pageId);
            });
            images.forEach((file) => {
                formData.append('images[]', file);
            });

            // ✅ แสดงค่าทั้งหมดใน FormData
            console.log('📦 FormData ที่จะส่งไป:');
            for (let pair of formData.entries()) {
                console.log(pair[0], pair[1]);
            }

            const url = import.meta.env.VITE_BACKEND_URL + '/api/webhooks/newFeedFacebook';

            const { data, status } = await axiosClient.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            console.log(data, status);
        } catch (error) {
            console.error(error);
            alert("เกิดข้อผิดพลาด: " + error.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <Modal open={open} onClose={onClose}>
            <ModalDialog sx={{ width: 600 }}>
                <DialogTitle>สร้างโพสต์ใหม่</DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        <FormControl>
                            <FormLabel>ข้อความโพสต์</FormLabel>
                            <Textarea
                                minRows={3}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="เขียนข้อความโพสต์ที่นี่..."
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>วันที่เผยแพร่ (ถ้ามี)</FormLabel>
                            <Input
                                type="datetime-local"
                                value={publishDate}
                                onChange={(e) => setPublishDate(e.target.value)}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>อัปโหลดรูปภาพ (ลากหรือคลิกเลือก)</FormLabel>
                            <Box
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onClick={() => fileInputRef.current?.click()}
                                sx={{
                                    p: 2,
                                    border: '2px dashed #ccc',
                                    borderRadius: 8,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    backgroundColor: '#f9f9f9',
                                    '&:hover': { backgroundColor: '#f0f0f0' }
                                }}
                            >
                                <Typography level="body-sm" color="neutral">
                                    ลากรูปภาพมาวางที่นี่ หรือคลิกเพื่อเลือก
                                </Typography>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                />
                            </Box>
                        </FormControl>

                        {images.length > 0 && (
                            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', py: 1 }}>
                                {images.map((file, i) => {
                                    const url = URL.createObjectURL(file);
                                    return (
                                        <Box key={i} sx={{ position: 'relative' }}>
                                            <img
                                                src={url}
                                                alt={`preview-${i}`}
                                                style={{ height: 80, borderRadius: 4 }}
                                                onLoad={() => URL.revokeObjectURL(url)}
                                            />
                                            <Button
                                                size="sm"
                                                variant="soft"
                                                color="danger"
                                                onClick={() => handleRemoveImage(i)}
                                                sx={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    right: 0,
                                                    minWidth: 0,
                                                    px: 0.5,
                                                    lineHeight: 1,
                                                    borderRadius: '50%',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                ×
                                            </Button>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        )}
                    </Stack>
                    <Stack>
                        <FormControl>
                            <FormLabel>เลือกเพจที่ต้องการโพสต์</FormLabel>
                            <Select
                                multiple
                                value={selectedPages} // ✅ ต้องเป็น array เช่น ["123", "456"]
                                onChange={handleSelectChange}
                                renderValue={(selectedValues) => (
                                    <Box sx={{ display: 'flex', gap: '0.25rem' }}>
                                        {selectedValues.map((value) => {
                                            const selectedOption = platformTokens.find(token => token.id === value.value);
                                            return selectedOption ? (
                                                <Chip key={value} variant="soft" color="primary">
                                                    {selectedOption.description}
                                                </Chip>
                                            ) : null;
                                        })}
                                    </Box>
                                )}
                            >
                                {platformTokens.map((token) => (
                                    <Option key={token.id} value={token.id}>
                                        {token.description}
                                    </Option>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button variant="plain" onClick={onClose} disabled={loading}>
                        ยกเลิก
                    </Button>
                    <Button onClick={handleCreatePost} disabled={loading}>
                        {loading ? 'กำลังโพสต์...' : '✅ สร้างโพสต์'}
                    </Button>
                </DialogActions>
            </ModalDialog>
        </Modal>
    );
}
