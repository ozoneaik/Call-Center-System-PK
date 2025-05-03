import Button from "@mui/joy/Button";
import ReplyIcon from "@mui/icons-material/Reply";
import Box from "@mui/joy/Box";
import { useState } from "react";
import { DialogContent, DialogTitle, Modal, ModalDialog, Stack, Textarea } from "@mui/joy";
import { Grid2 } from "@mui/material";
import Typography from "@mui/joy/Typography";
import axiosClient from "../../../Axios.js";
import SendIcon from '@mui/icons-material/Send';
import { useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";


const actionButtonsStyle = {
    position: 'absolute',
    top: '-30px',
    right: 10,
    left: 'auto',
    display: 'flex',
    gap: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 'md',
    boxShadow: 'sm',
    opacity: 0,
    transition: 'opacity 0.2s',
    zIndex: 10,
    padding: '2px',
};

export default function ContextMenuButton(props) {
    const { rateId, activeId, custId } = useParams();
    const { user } = useAuth();
    const { onReply, line_message_id, line_quote_token, line_quoted_message_id } = props;
    const { sender, variant, content, created_at, contentType, messages, setMessages } = props;
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
            console.log(data, messages);
            setMessages((prev) => {
                return [
                    ...prev,
                    {
                        content: data.response.content,
                        contentType: data.response.contentType,
                        line_message_id: data.response.line_message_id,
                        line_quote_token: data.response.line_quote_token,
                        line_quoted_message_id: data.response.line_quoted_message_id,
                        sender: user,
                        created_at: new Date().toISOString(),
                    }
                ]
            })

            setShowModal(false);
        } catch (error) {
            alert(error.status)
        } finally {
            setLoading(false);
        }
    }
    return (
        <>
            <Modal keepMounted open={showModal} onClose={() => setShowModal(false)}>
                <ModalDialog>
                    <DialogTitle>ตอบกลับข้อความ</DialogTitle>
                    <DialogContent>
                        <form onSubmit={handleSubmit}>
                            <Grid2 container spacing={2}>
                                <Grid2 size={12}>
                                    <Typography>เนื้อหาที่ต้องการตอบกลับ</Typography>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                                        <Box sx={{
                                            p: 2,
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: 'md',
                                            backgroundColor: 'background.level1',
                                            overflow: 'auto'
                                        }}>
                                            <Typography>
                                                <span style={{ fontWeight: 'bold' }}>เนื้อหา&nbsp;{':'}&nbsp;</span>
                                                {content}
                                            </Typography>
                                            <Typography>
                                                <span style={{ fontWeight: 'bold' }}>ประเภท&nbsp;{':'}&nbsp;</span>
                                                {contentType}
                                            </Typography>
                                            {contentType !== 'text' &&  <iframe src={content} frameborder="0" style={{height : '40vh' ,width : '40vw'}}></iframe>}
                                        </Box>

                                    </Stack>

                                </Grid2>
                                <Grid2 size={12}>
                                    <Typography>ข้อความที่ต้องการส่ง</Typography>
                                    <Box>
                                        <Textarea onChange={(e) => {
                                            setReplyContent(prevState => {
                                                return {
                                                    ...prevState,
                                                    text: e.target.value
                                                }
                                            })
                                        }} minRows={3}></Textarea>
                                    </Box>
                                </Grid2>
                                <Grid2 size={12}>
                                    <Stack direction='row-reverse'>
                                        <Button
                                            startDecorator={<SendIcon />} size='sm' type='submit'
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
                <Button
                    size="sm"
                    variant="solid"
                    color="warning"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowModal(true);
                    }}
                >
                    <ReplyIcon fontSize="small" />
                    ตอบกลับ
                </Button>
            </Box>
        </>
    )
}