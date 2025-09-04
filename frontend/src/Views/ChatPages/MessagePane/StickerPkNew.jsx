import { Box, Button, CircularProgress, Modal, ModalClose, ModalDialog } from "@mui/joy";
import { useEffect, useState } from "react";
import axiosClient from "../../../Axios";
import { Send } from "@mui/icons-material";
import { sendApi } from "../../../Api/Messages";

export default function StickerPkNew(props) {
    const { open, setOpen, sender, activeId } = props;
    const [stickerList, setStickerList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [process, setProcess] = useState(false);
    const [selected, setSelected] = useState({ id: 0, path: '' });
    useEffect(() => {
        fetchData().finally(() => setLoading(false));
    }, [])

    const fetchData = async () => {
        try {
            const { data, status } = await axiosClient.get('/sticker/list');
            console.log(data, status);
            setStickerList(data.list);
        } catch (error) {
            console.error('error message :', error.response.data.message);
        }
    }

    const handleSubmit = async () => {
        console.log(selected);
        setProcess(true);
        const { data, status } = await sendApi({
            msg: selected.path,
            contentType: 'sticker',
            custId: sender.custId,
            conversationId: activeId
        });
        status === 200 && setOpen(false)
    }
    return (
        <Modal open={open} onClose={() => setOpen(false)}>
            <ModalDialog>
                <ModalClose onClick={() => setOpen(false)} />
                {loading ? (<CircularProgress />) : (
                    <>
                        <Box display='flex' flexWrap='wrap' gap={1} overflow='auto'>
                            {stickerList.map((sticker) => (
                                <Button
                                    variant={selected?.id === sticker.id ? 'solid' : 'plain'}
                                    key={sticker.id} onClick={() => setSelected(sticker)}
                                >
                                    <img width={100} height={100} src={sticker.path} />
                                </Button>
                            ))}
                        </Box>
                        <Button
                            disabled={selected.id === 0}
                            loading={process}
                            startDecorator={<Send />}
                            onClick={handleSubmit}
                        >
                            ส่ง
                        </Button>
                    </>
                )}

            </ModalDialog>
        </Modal>
    )
}