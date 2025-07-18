import { useState, useCallback, useEffect, useRef } from "react";
import { Box, Textarea, Typography, Button, Stack, Card } from "@mui/joy";
import {
    Delete,
    EmojiEmotions,
    Info,
    RemoveRedEye,
    Send,
} from "@mui/icons-material";
import { sendApi, sendApiFB } from "../../../Api/Messages";
import { AlertDiaLog } from "../../../Dialogs/Alert";
import { useNotification } from "../../../context/NotiContext";
import { useAuth } from "../../../context/AuthContext";
import StickerPkNew from "./StickerPkNew";
import ModalHelperSendMsg from "../../../Components/ModalHelperSendMsg";
import axiosClient from "../../../Axios";

export default function MessageInputNew(props) {
    const { sender, activeId, msg, setMsg } = props;
    const [openHelper, setOpenHelper] = useState(false);
    const [inputText, setInputText] = useState("");
    const [firstRender, setFirstRender] = useState(true);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const { notification } = useNotification();
    const [stickerOpen, setStickerOpen] = useState(false);
    const { user } = useAuth();
    const textareaRef = useRef(null);

    useEffect(() => {
        return () => {
            files.forEach((file) => URL.revokeObjectURL(file.preview));
        };
    }, [files]);


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
        console.log("msg >>> ", msg);
        setInputText(inputText + msg.content);
    }, [msg]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files).map(file => Object.assign(file, {
            preview: URL.createObjectURL(file)
        }));
        setFiles((prev) => [...prev, ...droppedFiles]);
    }, []);

    const handlePaste = useCallback((e) => {
        const pastedFiles = Array.from(e.clipboardData.items)
            .filter(item => item.kind === 'file')
            .map(item => {
                const file = item.getAsFile();
                return file ? Object.assign(file, { preview: URL.createObjectURL(file) }) : null;
            })
            .filter(file => file !== null);

        if (pastedFiles.length > 0) {
            setFiles((prev) => [...prev, ...pastedFiles]);
            e.preventDefault();
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
            const senderPlatform_format = sender?.platform || "Unknown";

            if (senderPlatform_format.toLowerCase() === "lazada") {
                const formData = new FormData();
                formData.append("custId", sender.custId);
                formData.append("conversationId", activeId);

                if (inputText.trim()) {
                    formData.append("messages[0][content]", inputText);
                    formData.append("messages[0][contentType]", "text");
                }

                files.forEach((file, index) => {
                    const messageIndex = inputText.trim() ? index + 1 : index;
                    formData.append(`messages[${messageIndex}][content]`, file);
                    formData.append(`messages[${messageIndex}][contentType]`, "image");
                });

                const { data, status } = await axiosClient.post(
                    "/messages/lazada/send",
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );

                if (status === 200) {
                    console.info("Lazada send response:", data);
                    setInputText("");
                    setFiles([]);
                } else {
                    AlertDiaLog({
                        icon: "error",
                        title: data.message || "เกิดข้อผิดพลาด",
                        text: data.detail || "ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง",
                    });
                }
            } else if (senderPlatform_format.toLowerCase() === "line") {
                const { data, status } = await sendApi({
                    msg: inputText,
                    contentType: "text",
                    custId: sender.custId,
                    conversationId: activeId,
                    selectedFile: files,
                });

                if (status === 200) {
                    setInputText("");
                    setFiles([]);
                } else {
                    AlertDiaLog({
                        icon: "error",
                        title: data.message || "เกิดข้อผิดพลาด",
                        text: data.detail || "ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง",
                    });
                }
            } else if (senderPlatform_format.toLowerCase() === "facebook") {
                console.log(sender.custId, activeId, inputText || 'inputText not send', files);
                const { data, status } = await sendApiFB({
                    msg: inputText,
                    contentType: "text",
                    custId: sender.custId,
                    conversationId: activeId,
                    selectedFile: files,
                });
                if (status === 200) {
                    console.info("Facebook send response:", data);
                    setInputText("");
                    setFiles([]);
                } else {
                    AlertDiaLog({
                        icon: "error",
                        title: data.message || "เกิดข้อผิดพลาด",
                        text: data.detail || "ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง",
                    });
                }
            }
            else {
                alert("ไม่รูว่า ลูกค้ามาจาก platform อะไร กรุณาแจ้งแอดมิน");
                return;
            }
        } catch (error) {
            const responseData = error.response?.data;
            const errorMsg = responseData?.message || "เกิดข้อผิดพลาดในการส่ง";

            AlertDiaLog({
                icon: "error",
                title: "เกิดข้อผิดพลาด",
                text: errorMsg,
            });
            console.error("Send message error:", error);
        } finally {
            setLoading(false);
        }
    };

    const isDisabled = sender.emp !== user.empCode && user.role !== "admin";

    return (
        <Box
            sx={{
                borderRadius: "lg",
                p: 2,
                minHeight: "100px",
                cursor: isDisabled ? "not-allowed" : "pointer",
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            {files.length > 0 && (
                <Box sx={{ my: 2 }}>
                    <Typography level="body-sm" sx={{ mb: 1 }}>
                        ไฟล์ที่แนบ:
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                        {/* ✅ [แก้ไข] ส่วนแสดงผลไฟล์ตัวอย่าง */}
                        {files.map((file, index) => {
                            let previewContent;
                            if (file.type.startsWith("image/")) {
                                previewContent = (
                                    <img
                                        src={file.preview}
                                        alt={file.name}
                                        style={{
                                            width: '150px',
                                            height: '150px',
                                            objectFit: 'cover',
                                            borderRadius: "8px",
                                        }}
                                    />
                                );
                            } else if (file.type.startsWith("video/")) {
                                previewContent = (
                                    <video
                                        src={file.preview}
                                        controls
                                        style={{ maxWidth: "200px", borderRadius: "8px" }}
                                    />
                                );
                            } else {
                                previewContent = (
                                    <Box sx={{ p: 2, width: '150px', textAlign: 'center' }}>
                                        <Typography>{file.name}</Typography>
                                    </Box>
                                );
                            }

                            return (
                                <Card variant="outlined" sx={{ p: 1, gap: 1 }} key={index}>
                                    {previewContent}
                                    <Stack direction="row" spacing={1} justifyContent="center">
                                        <Button
                                            variant="solid"
                                            size="sm"
                                            startDecorator={<RemoveRedEye />}
                                            onClick={() => window.open(file.preview, "_blank")}
                                        >
                                            ดู
                                        </Button>
                                        <Button
                                            variant="solid"
                                            color="danger"
                                            startDecorator={<Delete />}
                                            onClick={() => handleDeleteFile(index)}
                                            size="sm"
                                        >
                                            ลบ
                                        </Button>
                                    </Stack>
                                </Card>
                            );
                        })}
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
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
            />

            <Stack direction="row-reverse" spacing={2}>
                <Button
                    disabled={isDisabled || (!inputText.trim() && files.length === 0)}
                    loading={loading}
                    onClick={handleSend}
                    size="sm"
                    endDecorator={<Send />}
                >
                    ส่ง
                </Button>
                <Button
                    disabled={isDisabled}
                    size="sm"
                    color="warning"
                    endDecorator={<EmojiEmotions />}
                    onClick={() => setStickerOpen(true)}
                >
                    สติกเกอร์
                </Button>
                <Button
                    onClick={() => setOpenHelper(true)}
                    size="sm"
                    variant="outlined"
                    color="neutral"
                    endDecorator={<Info />}
                >
                    วิธีส่งข้อความ (ไฟล์,รูปภาพ,วิดีโอ)
                </Button>
            </Stack>
            {stickerOpen && (
                <StickerPkNew
                    activeId={activeId}
                    sender={sender}
                    open={stickerOpen}
                    setOpen={setStickerOpen}
                />
            )}
            {openHelper && (
                <ModalHelperSendMsg open={openHelper} setOpen={setOpenHelper} />
            )}
        </Box>
    );
}