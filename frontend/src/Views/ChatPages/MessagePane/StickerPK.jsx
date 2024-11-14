import { useState } from 'react';
import Button from '@mui/joy/Button';
import Modal from '@mui/joy/Modal';
import ModalClose from '@mui/joy/ModalClose';
import Typography from '@mui/joy/Typography';
import Sheet from '@mui/joy/Sheet';
import { MessageStyle } from '../../../styles/MessageStyle';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import { Box, ModalDialog } from '@mui/joy';
import '../../../styles/stickerPk.css'
import { sendApi } from '../../../Api/Messages';
const stickerList = [
    { id: 1, content: 'https://images.pumpkin.tools/sitcker/20241108-152612.gif', contentType: 'sticker' },
    { id: 2, content: 'https://images.pumpkin.tools/sitcker/20241108-152638.gif', contentType: 'sticker' },
    { id: 3, content: 'https://images.pumpkin.tools/sitcker/20241108-152641.gif', contentType: 'sticker' },
    { id: 4, content: 'https://images.pumpkin.tools/sitcker/20241108-152645.gif', contentType: 'sticker' },
    { id: 5, content: 'https://images.pumpkin.tools/sitcker/20241108-152649.gif', contentType: 'sticker' },
    { id: 6, content: 'https://images.pumpkin.tools/sitcker/20241108-152655.gif', contentType: 'sticker' },
    { id: 7, content: 'https://images.pumpkin.tools/sitcker/20241108-152659.gif', contentType: 'sticker' },
    { id: 8, content: 'https://images.pumpkin.tools/sitcker/20241108-152703.gif', contentType: 'sticker' },
    { id: 9, content: 'https://images.pumpkin.tools/sitcker/20241108-152706.gif', contentType: 'sticker' },
    { id: 10, content: 'https://images.pumpkin.tools/sitcker/20241108-152710.gif', contentType: 'sticker' },
    { id: 11, content: 'https://images.pumpkin.tools/sitcker/20241108-152714.gif', contentType: 'sticker' },
];


export const StickerPK = (props) => {
    const {sender, activeId} = props;
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState({
        id: 0
    });
    const handleSubmit = async () => {
        console.log(selected);
        const { data, status } = await sendApi({
            msg: selected.content,
            contentType: selected.contentType,
            custId : sender.custId,
            conversationId : activeId
        });
        status === 200 && setOpen(false)
    }
    return (
        <>
            <Button color="warning" onClick={() => setOpen(true)}>
                <Typography sx={MessageStyle.InsertImage}>
                    ส่งสติกเกอร์
                </Typography>
                <EmojiEmotionsIcon />
            </Button>
            <Modal
                open={open} onClose={() => { setOpen(false); setSelected(0) }}
                sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
                <ModalDialog>
                    <ModalClose onClick={() => setOpen(false)} />
                    <Sheet>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            {stickerList.map((sticker, index) => (
                                <Box key={index}>
                                    <img width={100} className={selected.id === sticker.id && 'sticker'} id={'stickerPK'} onClick={() => setSelected(sticker)}
                                        key={sticker.id} src={sticker.content}
                                        alt="sticker" style={MessageStyle.sticker}
                                    />
                                </Box>
                            ))}
                        </div>
                        <Box sx={{ display: 'flex', justifyContent: 'end' }}>
                            <Button disabled={selected === 0} onClick={handleSubmit}>
                                ส่ง
                            </Button>
                        </Box>
                    </Sheet>
                </ModalDialog>
            </Modal>
        </>
    );
}