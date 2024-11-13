import Typography from "@mui/joy/Typography";
import {MessageStyle} from "../../../styles/MessageStyle.js";
import {Button, Modal, ModalClose, Sheet} from "@mui/joy";
import DoneIcon from '@mui/icons-material/Done';
import {useState} from "react";
import {endTalkApi} from "../../../Api/Messages.js";
import {AlertDiaLog} from "../../../Dialogs/Alert.js";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import Box from "@mui/joy/Box";
import { useNavigate } from "react-router-dom";

const ModalEndTalk = (props) => {
    const navigate = useNavigate();
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
                C && status === 200 && navigate(-1);
            }
        })
    }
    return (
        <>

            <Button variant="outlined" color="neutral" onClick={() => setOpen(true)}>
                Open modal
            </Button>
            <Modal
                aria-labelledby="modal-title" aria-describedby="modal-desc"
                open={showModalEndTalk} onClose={() => setShowModalEndTalk(false)}
                sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}
            >
                <Sheet
                    variant="outlined"
                    sx={{maxWidth: 500, borderRadius: 'md', p: 3, boxShadow: 'lg'}}
                >
                    <ModalClose variant="plain" sx={{m: 1}}/>
                    <Typography
                        component="h2" id="modal-title" level="h4"
                        textColor="inherit" sx={{fontWeight: 'lg', mb: 1}}
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

export const EndTalk = (props) => {
    const {disable, rateId, activeId, tags} = props;
    const [showModalEndTalk, setShowModalEndTalk] = useState(false);
    return (
        <>
            {showModalEndTalk && (
                <ModalEndTalk
                    rateId={rateId} activeId={activeId} showModalEndTalk={showModalEndTalk}
                    setShowModalEndTalk={setShowModalEndTalk} tags={tags}/>
            )}
            <Button color='success' disabled={disable} variant="outlined" size="sm"
                    onClick={() => setShowModalEndTalk(true)}>
                <DoneIcon/>
                <Typography color={disable ? '' : 'success'} fontSize='small' sx={MessageStyle.PaneHeader.BtnText}>
                    จบการสนทนา
                </Typography>
            </Button>
        </>
    )
}