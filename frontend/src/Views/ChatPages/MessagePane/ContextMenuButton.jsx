import { Reply, Send } from "@mui/icons-material";
import { useState } from "react";
import {
    Button, Box, Typography, DialogContent, DialogTitle,
    IconButton, Modal, ModalDialog, Stack, Textarea
} from "@mui/joy";
import { Grid2 } from "@mui/material";
import axiosClient from "../../../Axios.js";
import { Link, useParams } from "react-router-dom";


const ShowContent = ({ content, contentType }) => {
    if (contentType === 'text') {
        return <Typography>{content}</Typography>;
    } else if (contentType === 'image') {
        return <img src={content} alt="Content" style={{ maxWidth: '50%', height: 'auto' }} />;
    } else if (contentType === 'video') {
        return <video src={content} controls style={{ maxWidth: '100%', maxHeight: '400px' }} />;
    } else if (contentType === 'audio') {
        return <audio src={content} controls style={{ width: '100%' }} />;
    } else if (contentType === 'file') {
        return <Link to={content} target="_blank">ดู</Link>
    }
    else {
        return <Typography>Unsupported content type</Typography>;
    }
}

export default function ContextMenuButton(props) {
    const { rateId, activeId, custId } = useParams();
    const { line_message_id, line_quote_token, line_quoted_message_id } = props;
    const { sender, content, contentType } = props;
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [replyContent, setReplyContent] = useState({
        text: '',
        type: 'text'
    });
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const { data, status } = await axiosClient.post('/messages/reply', {
                sender, content, line_message_id, line_quote_token, line_quoted_message_id,
                rateId, activeId, custId, replyContent
            });
            setShowModal(false);
        } catch (error) {
            alert(error.status)
        } finally {
            setLoading(false);
        }
    }

    const handleShowModal = (e) => {
        e.stopPropagation();
        setShowModal(true);
    }

    const handleReplyContent = (e) => {
        setReplyContent(prevState => {
            return { ...prevState, text: e.target.value }
        })
    }
    return (
        <>
            <Modal keepMounted open={showModal} onClose={() => setShowModal(false)}>
                <ModalDialog>
                    <DialogTitle>
                        ตอบกลับข้อความ
                    </DialogTitle>
                    <DialogContent>
                        <form onSubmit={handleSubmit}>
                            <Grid2 container spacing={2}>
                                <Grid2 size={12}>
                                    <Typography>
                                        เนื้อหาที่ต้องการตอบกลับ
                                    </Typography>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                                        <Box sx={blockStyle}>
                                            <Typography>
                                                <span style={{ fontWeight: 'bold' }}>
                                                    เนื้อหา&nbsp;{':'}&nbsp;
                                                </span>
                                                {content}
                                            </Typography>
                                            <Typography>
                                                <span style={{ fontWeight: 'bold' }}>
                                                    ประเภท&nbsp;{':'}&nbsp;
                                                </span>
                                                {contentType}
                                            </Typography>
                                            <ShowContent content={content} contentType={contentType} />
                                        </Box>
                                    </Stack>
                                </Grid2>
                                <Grid2 size={12}>
                                    <Typography>
                                        ข้อความที่ต้องการส่ง
                                    </Typography>
                                    <Box>
                                        <Textarea onChange={handleReplyContent} minRows={3} />
                                    </Box>
                                </Grid2>
                                <Grid2 size={12}>
                                    <Stack direction='row-reverse'>
                                        <Button
                                            startDecorator={<Send />} size='sm' type='submit'
                                            disabled={!replyContent.text} loading={loading}
                                        >
                                            ส่ง
                                        </Button>
                                    </Stack>
                                </Grid2>
                            </Grid2>
                        </form>
                    </DialogContent>
                </ModalDialog>
            </Modal>
            <Box className="action-buttons" sx={actionButtonsStyle}>
                <Stack direction='row' spacing={1}>
                    <IconButton size="sm" variant="outlined" color="warning" onClick={handleShowModal}>
                        <Reply fontSize="small" />
                    </IconButton>
                </Stack>
            </Box>
        </>
    )
}

const actionButtonsStyle = {
    position: 'absolute', top: '-30px', right: 10, left: 'auto',
    display: 'flex', gap: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 'md',
    boxShadow: 'sm', opacity: 0, transition: 'opacity 0.2s',
    zIndex: 10, padding: '2px',
};

const blockStyle = {
    p: 2, width: '100%', height: '100%', borderRadius: 'md',
    backgroundColor: 'background.level1', overflow: 'auto'
}