import { Modal, ModalClose, ModalDialog } from "@mui/joy";
import { forceHttps } from "../../../utils.js";

export default function ChatMediaPreview({ url = 'www', setOpen, open }) {
    return (
        <Modal open={open} onClose={() => setOpen(false)}>
            <ModalDialog size="lg" sx={{ width: { xs: '100dvw', md: '50dvw' }, maxWidth: '100dvw', height: '100dvh', padding: 0, overflow: 'hidden', borderRadius: { xs: 0, md: 'md' } }}>
                <ModalClose variant="plain" sx={{ m: 1 }} />
                <iframe style={{border : 'none'}} src={forceHttps(url)} height='100%' width='100%' ></iframe>
            </ModalDialog>
        </Modal>
    )
}