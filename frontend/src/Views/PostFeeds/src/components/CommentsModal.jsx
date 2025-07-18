import React from 'react';
import {
    Modal, ModalDialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Stack, Typography
} from "@mui/joy";

export default function CommentsModal({ open, onClose, post }) {
    const isImageUrl = (url) => {
        if (!url) return false;
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(url.trim());
    };

    return (
        <Modal open={open} onClose={onClose}>
            <ModalDialog>
                <DialogTitle>คอมเมนต์โพสต์</DialogTitle>
                <DialogContent>
                    {post?.comments?.data?.length ? (
                        <Stack spacing={2} sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {post.comments.data.map((comment) => {
                                const msg = comment.message || "";
                                return (
                                    <Box key={comment.id} sx={{ borderBottom: '1px solid #ccc', pb: 1 }}>
                                        <Typography level="body-md" fontWeight="bold">
                                            {comment.from?.name || "ไม่ระบุชื่อ"}
                                        </Typography>
                                        <Typography level="body-sm" color="text.secondary" mb={0.5}>
                                            {new Date(comment.created_time).toLocaleString()}
                                        </Typography>
                                        {isImageUrl(msg) ? (
                                            <img
                                                src={msg.trim()}
                                                alt="comment image"
                                                style={{ maxWidth: '100%', borderRadius: 4 }}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://via.placeholder.com/300?text=Image+not+found';
                                                }}
                                            />
                                        ) : (
                                            <Typography level="body-md">{msg}</Typography>
                                        )}
                                    </Box>
                                );
                            })}
                        </Stack>
                    ) : (
                        <Typography>ไม่มีคอมเมนต์สำหรับโพสต์นี้</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button variant="plain" onClick={onClose}>ปิด</Button>
                </DialogActions>
            </ModalDialog>
        </Modal>
    );
}
