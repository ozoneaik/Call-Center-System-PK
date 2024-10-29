import Button from "@mui/joy/Button";
import {Modal, ModalClose, Sheet, Table} from "@mui/joy";
import Typography from "@mui/joy/Typography";
import {TableContainer} from "@mui/material";
import Box from "@mui/joy/Box";
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Input from "@mui/joy/Input";
import {useState} from "react";
import Autocomplete from "@mui/joy/Autocomplete";
import {addOrUpdateBotApi} from "../../Api/BotMenu.js";
import {AlertDiaLog} from "../../Dialogs/Alert.js";

export const FormCreateOrUpdateBot = (props) => {
    const {setBots, setSelected, selected, chatRooms, showForm, setShowForm} = props;
    const [newMenuItem, setNewMenuItem] = useState({
        menuName: "",
        roomId: null,
        roomName: "",
    });

    const handleDelete = (index) => {
        const updatedList = [...selected.list];
        updatedList.splice(index, 1);
        setSelected({...selected, list: updatedList});
    };

    const handleAddMenuItem = () => {
        setSelected({
            ...selected,
            list: [...selected.list, newMenuItem],
        });
        setNewMenuItem({
            menuName: "",
            roomId: null,
            roomName: "",
        });
    };

    const handleCancel = () => {
        setShowForm(false);
        setSelected(null);
    };

    const handleSave = async () => {
        console.log(selected)
        // handleSubmit(selected);
        setShowForm(false);
        const {data, status} = await addOrUpdateBotApi({bot : selected});
        console.log('Data>> ' , data)
        AlertDiaLog({
            icon : status === 200 && 'success',
            title : data.message,
            text : data.detail,
            onPassed : (confirm) => {
                if ((confirm && status ===  200) || (!confirm && status === 200)) {
                    setBots(prevBots => {
                        return prevBots.map(bot => {
                            if (bot.botTokenId === selected.botTokenId) {
                                // Return the updated bot
                                return {
                                    ...selected
                                };
                            }
                            // Return unchanged bot
                            return bot;
                        });
                    });
                    setSelected(null);
                }else console.log('ไม่ได้กด confirm');
            }
        })
    };

    const handleEditMenuItem = (index, newMenuName) => {
        const updatedList = [...selected.list];
        updatedList[index].menuName = newMenuName;
        setSelected({...selected, list: updatedList});
    };

    return (
        <>
            <Modal
                open={showForm}
                onClose={handleCancel}
                sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}
            >
                <Sheet variant="outlined" sx={{maxWidth: 700, borderRadius: 'md', p: 3, boxShadow: 'lg'}}>
                    <ModalClose variant="plain" sx={{m: 1}}/>
                    <Typography component="h2" level="h4" sx={{fontWeight: 'lg', mb: 1}}>
                        {selected?.description}[{selected?.botTokenId}]
                    </Typography>
                    <div id="modal-desc">
                        <TableContainer>
                            <Table>
                                <thead>
                                <tr>
                                    <th>Menu Name</th>
                                    <th>Send to Room</th>
                                    <th style={{textAlign: 'center'}}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {selected.list.map((item, index) => (
                                    <tr key={index}>
                                        <td>
                                            <Input
                                                value={item.menuName}
                                                onChange={(e) => handleEditMenuItem(index, e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <Autocomplete
                                                value={item.roomName}
                                                options={chatRooms.map((room) => room.roomName)}
                                                onChange={(_, newValue) => {
                                                    const updatedList = [...selected.list];
                                                    updatedList[index].roomId = chatRooms.find((room) => room.roomName === newValue)?.roomId;
                                                    updatedList[index].roomName = newValue;
                                                    setSelected({...selected, list: updatedList});
                                                }}
                                            />
                                        </td>
                                        <td>
                                            <Box sx={{display: 'flex', justifyContent: 'center', gap: 1}}>
                                                <Button variant='outlined' size='sm' color='danger'
                                                        onClick={() => handleDelete(index)}>
                                                    <DeleteIcon/>
                                                </Button>
                                            </Box>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
                        </TableContainer>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mt: 2}}>
                            <Input
                                sx={{width: '100%'}}
                                value={newMenuItem.menuName}
                                onChange={(e) =>
                                    setNewMenuItem({...newMenuItem, menuName: e.target.value})
                                }
                                placeholder="Add new menu"
                            />
                            <Autocomplete
                                sx={{width: '100%'}}
                                value={newMenuItem.roomName}
                                options={chatRooms.map((room) => room.roomName)}
                                placeholder={'ส่งไปยังห้อง'}
                                onChange={(_, newValue) => {
                                    setNewMenuItem({
                                        ...newMenuItem,
                                        roomId: chatRooms.find((room) => room.roomName === newValue)?.roomId,
                                        roomName: newValue,
                                    });
                                }}
                            />
                            <Button size='sm' onClick={handleAddMenuItem}
                                    disabled={!newMenuItem.roomId || !newMenuItem.menuName}>
                                <AddIcon/>&nbsp;เพิ่ม
                            </Button>
                        </Box>
                        <Box sx={{mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1}}>
                            <Button size='sm' onClick={handleSave}>
                                Save
                            </Button>
                            <Button size='sm' color='neutral' onClick={handleCancel}>
                                Cancel
                            </Button>
                        </Box>
                    </div>
                </Sheet>
            </Modal>
        </>
    );
};