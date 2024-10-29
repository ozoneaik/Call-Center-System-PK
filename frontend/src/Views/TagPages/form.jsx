import {DialogContent, DialogTitle, Modal, ModalDialog} from "@mui/joy";
import FormControl from "@mui/joy/FormControl";
import Stack from "@mui/joy/Stack";
import FormLabel from "@mui/joy/FormLabel";
import Input from "@mui/joy/Input";
import Button from "@mui/joy/Button";
import {convertFullDate} from "../../Components/Options.jsx";
import {useState} from "react";
import {AlertDiaLog} from "../../Dialogs/Alert.js";
import {storeTagsApi, updateTagsApi} from "../../Api/Tags.js";

export const FormTag = (props) => {
    const {show, setShow, selected, setSelected, setTags} = props;
    const [tagName, setTagName] = useState(selected.tagName);


    const handleSubmit = (e) => {
        e.preventDefault();
        setShow(false);
        AlertDiaLog({
            icon: 'question',
            title: 'ต้องการสร้าง/อัพเดท',
            text: 'กดตกลงเพื่อยืนยันการสร้างหรืออัพเดท',
            onPassed: async (confirm) => {
                if (confirm) {
                    let data, status;
                    if (selected.tagName) {
                        ({data, status} = await updateTagsApi({tagName, id: selected.id}))
                        if (status === 200) {
                            setTags((prevTags) =>
                                prevTags.map((tag) =>
                                    tag.id === data.tag.id ? {...tag, tagName: data.tag.tagName} : tag
                                )
                            );
                        }else console.log('ไม่ได้อัพเดท');
                    } else {
                        ({data, status} = await storeTagsApi({tagName}))
                        status === 200 && setTags((prevTags) => [...prevTags, data.tag]);
                    }
                    AlertDiaLog({
                        icon: status === 200 && 'success',
                        title: data.message,
                        text: data.detail,
                        onPassed: () => {
                            setSelected({})
                            setTagName('');
                        }
                    })
                }

            }
        })
    }

    return (
        <Modal open={show} onClose={() => {
            setShow(false);
            setSelected({})
        }}>
            <ModalDialog>
                <DialogTitle>
                    {selected.tagName ? `อัพเดท` : "สร้าง"}
                </DialogTitle>
                {selected.tagName && <DialogContent>{selected.tagName}</DialogContent>}
                <form
                    onSubmit={(e) => handleSubmit(e)}
                >
                    <Stack spacing={2}>
                        <FormControl>
                            <FormLabel>ชื่อ tag</FormLabel>
                            <Input autoFocus required value={tagName || ''}
                                   onChange={(e) => setTagName(e.target.value)} type={'text'}/>
                        </FormControl>
                        <FormControl>
                            <FormLabel>วันที่สร้าง</FormLabel>
                            <Input disabled
                                   value={selected.created_at ? convertFullDate(selected.created_at) : new Date()}/>
                        </FormControl>
                        <FormControl>
                            <FormLabel>วันที่อัพเดท</FormLabel>
                            <Input disabled
                                   value={selected.updated_at ? convertFullDate(selected.updated_at) : new Date()}/>
                        </FormControl>
                        <Button type="submit">
                            {selected.tagName ? `อัพเดท` : "สร้าง"}
                        </Button>
                    </Stack>
                </form>
            </ModalDialog>
        </Modal>
    )
}