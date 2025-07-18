import React, { useState, useEffect } from 'react';
import {
    Modal, ModalDialog, DialogTitle, DialogContent, DialogActions,
    Button, Stack, FormControl, FormLabel, Textarea, Input, Box
} from "@mui/joy";

export default function EditPostModal({ open, onClose, post, onSave }) {
    const [content, setContent] = useState(post?.message || '');
    const [imageUrl, setImageUrl] = useState(post?.full_picture || '');

    useEffect(() => {
        if (post) {
            setContent(post.message || '');
            setImageUrl(post.full_picture || '');
        }
    }, [post]);

    const handleSave = () => {
        if (!content.trim()) {
            alert("กรุณาใส่ข้อความโพสต์");
            return;
        }
        onSave({ ...post, message: content, full_picture: imageUrl });
    };

    return (
        <Modal open={open} onClose={onClose}>
            <ModalDialog>
                <DialogTitle>แก้ไขโพสต์</DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        <FormControl>
                            <FormLabel>ข้อความโพสต์</FormLabel>
                            <Textarea
                                minRows={3}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="แก้ไขข้อความโพสต์ที่นี่..."
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel>URL รูปภาพ</FormLabel>
                            <Input
                                type="url"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="วาง URL รูปภาพที่นี่"
                            />
                        </FormControl>
                        {imageUrl && (
                            <Box sx={{ mt: 1 }}>
                                <img
                                    src={imageUrl}
                                    alt="Preview"
                                    style={{ maxWidth: '100%', borderRadius: 4 }}
                                    onError={e => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://via.placeholder.com/300?text=Image+not+found';
                                    }}
                                />
                            </Box>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button variant="plain" onClick={onClose}>ยกเลิก</Button>
                    <Button onClick={handleSave}>บันทึก</Button>
                </DialogActions>
            </ModalDialog>
        </Modal>
    );
}
