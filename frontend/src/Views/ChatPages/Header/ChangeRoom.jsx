import DoneIcon from "@mui/icons-material/Done";
import Typography from "@mui/joy/Typography";
import { MessageStyle } from "../../../styles/MessageStyle.js";
import { Box, Button, Modal, ModalClose, ModalDialog, Stack } from "@mui/joy";
import { useState } from "react";
import { senToApi } from "../../../Api/Messages.js";
import { AlertDiaLog } from "../../../Dialogs/Alert.js";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "@mui/material";

const ModalChangRoom = (props) => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false);
    const { showModalChangeRoom, setShowModalChangeRoom, chatRooms, rateId, activeId, roomSelect, listAllChatRooms } = props;
    const handleChangeRoom = async (roomId) => {
        try {
            setLoading(true);
            const { data, status } = await senToApi({ rateId, activeConversationId: activeId, latestRoomId: roomId });
            AlertDiaLog({
                icon: status === 200 && 'success',
                title: data.message,
                text: data.detail,
                onPassed: (confirm) => {
                    status === 200 && navigate(-1)
                    // confirm && window.close();

                }
            });
        } finally {
            setLoading(false);
            setShowModalChangeRoom(false);
        }
    }

    return (
        <Modal open={showModalChangeRoom} onClose={() => setShowModalChangeRoom(false)}>
            <ModalDialog>
                <ModalClose />
                <Typography component="h2">ส่งต่อไปยัง</Typography>
                <Typography>ห้องแชท</Typography>
                <Stack direction='column' spacing={2} sx={{ overflow: 'auto' }}>
                    {listAllChatRooms.length > 0 && (
                        listAllChatRooms.map((room, index) => (
                            <Button
                                onClick={() => handleChangeRoom(room.roomId)} key={index} loading={loading}
                                disabled={(room.id === roomSelect.id) || (room.roomId === 'ROOM00')}
                            >
                                {room.roomName}
                            </Button>
                        ))
                    )}
                </Stack>
            </ModalDialog>
        </Modal>
    )
}


export const ChangeRoom = (props) => {
    const { disable, chatRooms, rateId, activeId, roomSelect, listAllChatRooms } = props;
    const [showModalChangeRoom, setShowModalChangeRoom] = useState(false);
    return (
        <>
            {showModalChangeRoom && (
                <ModalChangRoom
                    showModalChangeRoom={showModalChangeRoom}
                    setShowModalChangeRoom={setShowModalChangeRoom}
                    chatRooms={chatRooms} rateId={rateId} activeId={activeId}
                    roomSelect={roomSelect} listAllChatRooms={listAllChatRooms}
                />
            )
            }
            <Button
                startDecorator={<DoneIcon />}
                color='primary' disabled={disable} variant="solid" size="sm"
                onClick={() => setShowModalChangeRoom(true)}
                fullWidth={useMediaQuery('(max-width: 1000px)')}
            >

                {!useMediaQuery('(max-width: 1000px)') && 'ส่งต่อไปยัง'}
            </Button>
        </>
    )
}