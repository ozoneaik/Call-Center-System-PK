import { Button, DialogContent, DialogTitle, FormControl, FormLabel, Input, Modal, Option, Select, Stack, Typography } from "@mui/joy"
import ModalDialog from '@mui/joy/ModalDialog';

export const ModalUpdateKeyword = ({open, setOpen,newKeyword,chatRooms,setNewKeyword,onCLick}) => {
    return (
        <Modal open={open} onClose={() => setOpen(false)}>
            <ModalDialog>
                <DialogTitle>update Keyword</DialogTitle>
                <DialogContent>
                    <Typography>
                        {newKeyword.id}
                    </Typography>
                </DialogContent>
                <Stack spacing={2}>
                    <FormControl>
                        <FormLabel>ชื่อ</FormLabel>
                        <Input value={newKeyword.name} onChange={(e) => setNewKeyword({id : newKeyword.id,name: e.target.value, redirectTo: newKeyword.redirectTo})} />
                    </FormControl>
                    <FormControl>
                        <FormLabel>ส่งไปยัง</FormLabel>
                        <Select defaultValue={newKeyword.redirectTo} onChange={(e, newValue) => {setNewKeyword({id : newKeyword.id,name: newKeyword.name, redirectTo: newValue})}}>
                            {chatRooms.map((item, index) => (
                                <Option key={index} value={item.roomId}>{item.roomName}</Option>
                            ))}
                        </Select>
                    </FormControl>
                    <Button onClick={onCLick}>
                        บันทึก
                    </Button>
                </Stack>
            </ModalDialog>
        </Modal>
    )
}