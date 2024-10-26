import DoneIcon from "@mui/icons-material/Done";
import Typography from "@mui/joy/Typography";
import {MessageStyle} from "../../../styles/MessageStyle.js";
import {Button, Modal, ModalClose, ModalDialog} from "@mui/joy";
import {useState} from "react";
import {senToApi} from "../../../Api/Messages.js";
import {AlertDiaLog} from "../../../Dialogs/Alert.js";

const ModalChangRoom = (props) => {
    const {showModalChangeRoom, setShowModalChangeRoom, chatRooms,rateId,activeId,roomSelect} = props;
    const handleChangeRoom = async (roomId) => {
        console.log(roomId)
        const {data, status} = await senToApi({rateId, activeConversationId: activeId, latestRoomId: roomId});
        AlertDiaLog({
            icon: status === 200 && 'success',
            title: data.message,
            text: data.detail,
            onPassed: (confirm) => {
                confirm && window.close();
            }
        });
        setShowModalChangeRoom(false);
    }

    return (
        <Modal open={showModalChangeRoom} onClose={() => setShowModalChangeRoom(false)}>
            <ModalDialog>
                <ModalClose/>
                <Typography component="h2">ส่งต่อไปยัง</Typography>
                <Typography>ห้องแชท</Typography>
                {chatRooms.length > 0 && (
                    chatRooms.map((room, index) => (
                        <Button
                            onClick={() => handleChangeRoom(room.roomId)} key={index}
                            disabled={(room.id === roomSelect.id) || (room.roomId === 'ROOM00')}
                        >
                            {room.roomName}
                        </Button>
                    ))
                )}
            </ModalDialog>
        </Modal>
    )
}


export const ChangeRoom = (props) => {
    const {disable, chatRooms,rateId,activeId,roomSelect} = props;
    const [showModalChangeRoom, setShowModalChangeRoom] = useState(false);
    return (
        <>
            {showModalChangeRoom && (
                <ModalChangRoom
                    showModalChangeRoom={showModalChangeRoom}
                    setShowModalChangeRoom={setShowModalChangeRoom}
                    chatRooms={chatRooms} rateId={rateId} activeId={activeId}
                    roomSelect={roomSelect}
                />
            )
            }
            <Button color='primary' disabled={disable} variant="outlined" size="sm"
                    onClick={() => setShowModalChangeRoom(true)}>
                <DoneIcon/>
                <Typography color={disable ? '' : 'primary'} fontSize='small' sx={MessageStyle.PaneHeader.BtnText}>
                    ส่งต่อไปยัง
                </Typography>
            </Button>
        </>
    )
}