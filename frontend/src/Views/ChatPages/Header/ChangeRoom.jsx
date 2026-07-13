import DoneIcon from "@mui/icons-material/Done";
import Typography from "@mui/joy/Typography";
import { Box, Button, Chip, CircularProgress, Modal, ModalClose, ModalDialog, Stack } from "@mui/joy";
import { useState } from "react";
import { senToApi } from "../../../Api/Messages.js";
import { AlertDiaLog } from "../../../Dialogs/Alert.js";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "@mui/material";
import { allowedRoomsApi } from "../../../Api/PlatformRouting.js";

const ModalChangRoom = (props) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { showModalChangeRoom, setShowModalChangeRoom, rateId, activeId, roomSelect, listAllChatRooms, allowedRooms, loadingRooms } = props;

    const handleChangeRoom = async (roomId) => {
        try {
            setLoading(true);
            const { data, status } = await senToApi({ rateId, activeConversationId: activeId, latestRoomId: roomId });
            AlertDiaLog({
                icon: status === 200 && 'success',
                title: data.message,
                text: data.detail,
                onPassed: () => { status === 200 && navigate(-1); }
            });
        } finally {
            setLoading(false);
            setShowModalChangeRoom(false);
        }
    };

    // allowedRooms มี is_allowed flag, listAllChatRooms ไม่มี → merge ให้เข้ากัน
    const displayRooms = allowedRooms
        ?? listAllChatRooms.map((r) => ({ ...r, is_allowed: true }));

    return (
        <Modal open={showModalChangeRoom} onClose={() => setShowModalChangeRoom(false)}>
            <ModalDialog>
                <ModalClose />
                <Typography component="h2">ส่งต่อไปยัง</Typography>
                <Typography level="body-sm" sx={{ color: 'neutral.500' }}>เลือกห้องแชทที่ต้องการส่งต่อ</Typography>

                {loadingRooms ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size="sm" />
                    </Box>
                ) : (
                    <Stack direction='column' spacing={2} sx={{ overflow: 'auto', maxHeight: 1000, mt: 1 }}>
                        {displayRooms.length > 0 ? (
                            displayRooms.map((room, index) => {
                                const isCurrent = room.roomId === roomSelect?.roomId;
                                const isBlocked = !room.is_allowed;
                                const isDisabled = isCurrent || isBlocked || room.roomId === 'ROOM00';

                                let endBadge = null;
                                if (isCurrent) endBadge = <Chip size="sm" color="neutral" variant="soft">ห้องปัจจุบัน</Chip>;
                                else if (isBlocked) endBadge = <Chip size="sm" color="danger" variant="soft">ไม่สามารถส่งต่อได้</Chip>;

                                return (
                                    <Button
                                        key={index}
                                        onClick={() => handleChangeRoom(room.roomId)}
                                        loading={loading}
                                        disabled={isDisabled}
                                        variant={isDisabled ? 'soft' : 'solid'}
                                        color={isBlocked ? 'neutral' : 'primary'}
                                        sx={{ justifyContent: 'space-between' }}
                                        endDecorator={endBadge}
                                    >
                                        {room.roomName}
                                    </Button>
                                );
                            })
                        ) : (
                            <Typography level="body-sm" sx={{ textAlign: 'center', color: 'neutral.400', py: 2 }}>
                                ไม่มีห้องที่สามารถส่งต่อได้
                            </Typography>
                        )}
                    </Stack>
                )}
            </ModalDialog>
        </Modal>
    );
};

export const ChangeRoom = (props) => {
    const { disable, chatRooms, rateId, activeId, roomSelect, listAllChatRooms, tokenId } = props;
    const [showModalChangeRoom, setShowModalChangeRoom] = useState(false);
    const [allowedRooms, setAllowedRooms] = useState(null);
    const [loadingRooms, setLoadingRooms] = useState(false);

    const handleOpen = async () => {
        setShowModalChangeRoom(true);
        if (!tokenId) return;
        setLoadingRooms(true);
        const { data, status } = await allowedRoomsApi(tokenId);
        if (status === 200) {
            setAllowedRooms(data.rooms);
        }
        setLoadingRooms(false);
    };

    return (
        <>
            {showModalChangeRoom && (
                <ModalChangRoom
                    showModalChangeRoom={showModalChangeRoom}
                    setShowModalChangeRoom={setShowModalChangeRoom}
                    chatRooms={chatRooms} rateId={rateId} activeId={activeId}
                    roomSelect={roomSelect} listAllChatRooms={listAllChatRooms}
                    allowedRooms={allowedRooms}
                    loadingRooms={loadingRooms}
                />
            )}
            <Button
                startDecorator={<DoneIcon />}
                color='primary' disabled={disable} variant="solid" size="sm"
                onClick={handleOpen}
                fullWidth={useMediaQuery('(max-width: 1000px)')}
            >
                {!useMediaQuery('(max-width: 1000px)') && 'ส่งต่อไปยัง'}
            </Button>
        </>
    );
};