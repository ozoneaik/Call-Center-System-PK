import { Modal, ModalClose, ModalDialog } from "@mui/joy";

export default function ChatMediaPreview({ url = 'www', setOpen, open }) {
    return (
        <Modal open={open} onClose={() => setOpen(false)}>
            <ModalDialog size="lg" sx={{width: '50dvw', height: '100dvh',padding : 0,overflow : 'hidden'}}>
                <ModalClose variant="plain" sx={{ m: 1 }} />
                <iframe style={{border : 'none'}} src={url} height='100%' width='100%' ></iframe>
            </ModalDialog>
        </Modal>
    )
}