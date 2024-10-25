import {Modal, ModalClose, Sheet} from "@mui/joy";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Select from "@mui/joy/Select";
import Option from '@mui/joy/Option';
import Box from "@mui/joy/Box";
import {useState} from "react";
import {endTalkApi} from "../Api/Messages.js";
import {AlertDiaLog} from "../Dialogs/Alert.js";


export const ModalEndTalk = (props) => {
    const {rateId, activeId, showModalEndTalk, setShowModalEndTalk, tags} = props;
    const [selectTag, setSelectTag] = useState();
    const endTalk = async () => {
        const {data, status} = await endTalkApi({rateId, activeConversationId: activeId, tagId: selectTag});
        setShowModalEndTalk(false);
        AlertDiaLog({
            title: data.message,
            text: data.detail,
            showConfirmButton: status === 200,
            icon: status === 200 && 'success',
            onPassed: (C) => {
                C && status === 200 && window.close();
            }
        })
    }
    return (
        <>
            <Button variant="outlined" color="neutral" onClick={() => setOpen(true)}>
                Open modal
            </Button>
            <Modal
                aria-labelledby="modal-title"
                aria-describedby="modal-desc"
                open={showModalEndTalk}
                onClose={() => setShowModalEndTalk(false)}
                sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}
            >
                <Sheet
                    variant="outlined"
                    sx={{maxWidth: 500, borderRadius: 'md', p: 3, boxShadow: 'lg'}}
                >
                    <ModalClose variant="plain" sx={{m: 1}}/>
                    <Typography
                        component="h2"
                        id="modal-title"
                        level="h4"
                        textColor="inherit"
                        sx={{fontWeight: 'lg', mb: 1}}
                    >
                        จบการสนทนา <Typography fontSize={12} textColor='#ccc'>รหัสอ้างอิง
                        R{rateId}_AC{activeId}</Typography>
                    </Typography>
                    <Typography id="modal-desc" textColor="text.tertiary">
                        ระบุ tag
                    </Typography>
                    <Select placeholder="Choose one…" sx={{mb: 1}} onChange={(event, value) => setSelectTag(value)}>
                        {tags && tags.length > 0 && tags.map((tag, index) => (
                            <Option value={tag.id} key={index}>{tag.tagName}</Option>
                        ))}
                    </Select>
                    <Typography>
                        กด "ตกลง" เพื่อจบการสนทนา (หากคุณต้องการส่งต่อกรุณากดที่ปุ่ม "ส่งต่อไปยัง" แทน)
                    </Typography>
                    <Box sx={{display: 'flex', justifyContent: 'end', gap: 1}}>
                        <Button disabled={!selectTag} onClick={() => endTalk()}>ตกลง</Button>
                    </Box>
                </Sheet>
            </Modal>

        </>
    )
}