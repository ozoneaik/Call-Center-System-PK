import { Modal, ModalDialog, ModalClose, Box } from "@mui/joy";
import { useMediaQuery } from "@mui/material";

const url = 'https://images.pumpkin.tools/call_center_helper/send_file.mp4';

export default function ModalHelperSendMsg(props) {
    const { open, setOpen } = props;
    const isMobile = useMediaQuery('(max-width: 1000px)');
    return (
        <Modal open={open} onClose={() => setOpen(false)}>
            <ModalDialog layout={isMobile ? 'fullscreen' : 'center'} overflow='auto'>
                <ModalClose onClick={() => setOpen(false)} />
                <Box mt={3}>
                    <video width="100%" controls>
                        <source src={url} type="video/mp4" />
                        Your browser does not support HTML video.
                    </video>
                </Box>
            </ModalDialog>
        </Modal>
    )
}