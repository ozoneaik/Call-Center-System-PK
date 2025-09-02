import Button from "@mui/joy/Button";
import { Modal, ModalClose, Sheet, Table, Typography, Input, Box, Autocomplete, Stack } from "@mui/joy";
import { TableContainer } from "@mui/material";
import { Delete as DeleteIcon, Add as AddIcon, DragIndicator } from '@mui/icons-material';
import { useState } from "react";
import { addOrUpdateBotApi } from "../../Api/BotMenu.js";
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import { Warning } from "./Warning.jsx";

export const FormCreateOrUpdateBot = (props) => {
    const { setBots, setSelected, selected, chatRooms, showForm, setShowForm } = props;
    const [stringLength, setStringLength] = useState(0);
    const [newMenuItem, setNewMenuItem] = useState({
        menuName: "",
        roomId: null,
        roomName: "",
    });

    // ฟังก์ชันสำหรับอัปเดต menu_number ให้เรียงลำดับ
    const updateMenuNumbers = (list) => {
        return list.map((item, index) => ({
            ...item,
            menu_number: index + 1
        }));
    };

    // ฟังก์ชันลบเมนู
    const handleDelete = (index) => {
        const updatedList = [...selected.list];
        updatedList.splice(index, 1);
        const reorderedList = updateMenuNumbers(updatedList);
        setSelected({ ...selected, list: reorderedList });
    };

    // ฟังก์ชันเพิ่มเมนูใหม่
    const handleAddMenuItem = () => {
        if (selected.list.length >= 4) {
            AlertDiaLog({
                icon: 'warning',
                title: 'ไม่สามารถเพิ่มได้',
                text: 'สามารถเพิ่มเมนูได้สูงสุด 4 เมนูเท่านั้น',
            });
            return;
        }

        const newItem = {
            ...newMenuItem,
            menu_number: selected.list.length + 1
        };

        setSelected({
            ...selected,
            list: [...selected.list, newItem],
        });
        setNewMenuItem({
            menuName: "",
            roomId: null,
            roomName: "",
        });
        setStringLength(0);
    };

    // ฟังก์ชันจัดการการลาก
    const handleDragStart = (e, index) => {
        e.dataTransfer.setData('text/plain', index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));

        if (dragIndex === dropIndex) return;

        const updatedList = [...selected.list];
        const draggedItem = updatedList[dragIndex];

        // ลบ item ที่ถูกลาก
        updatedList.splice(dragIndex, 1);
        // เพิ่ม item ในตำแหน่งใหม่
        updatedList.splice(dropIndex, 0, draggedItem);

        const reorderedList = updateMenuNumbers(updatedList);
        setSelected({ ...selected, list: reorderedList });
    };

    // ฟังก์ชันยกเลิก
    const handleCancel = () => {
        setShowForm(false);
        setSelected(null);
        setNewMenuItem({
            menuName: "",
            roomId: null,
            roomName: "",
        });
        setStringLength(0);
    };

    // ฟังก์ชันบันทึก
    const handleSave = async () => {
        if (selected.list.length === 0) {
            AlertDiaLog({
                icon: 'warning',
                title: 'ไม่สามารถบันทึกได้',
                text: 'ต้องมีเมนูอย่างน้อย 1 เมนู',
            });
            return;
        }

        // เรียงลำดับ array ตาม menu_number ก่อนส่ง
        const sortedList = selected.list.sort((a, b) => a.menu_number - b.menu_number);
        const dataToSend = {
            ...selected,
            list: sortedList
        };
        setShowForm(false);
        const { data, status } = await addOrUpdateBotApi({ bot: dataToSend });
        AlertDiaLog({
            icon: status === 200 ? 'success' : 'error',
            title: data.message,
            text: data.detail,
            onPassed: (confirm) => {
                if (status === 200) {
                    setBots(prevBots => {
                        return prevBots.map(bot => {
                            if (bot.botTokenId === selected.botTokenId) {
                                return { ...dataToSend };
                            }
                            return bot;
                        });
                    });
                    setSelected(null);
                } else {
                    console.log('ไม่ได้กด confirm หรือมี error');
                }
            }
        });
    };

    // ฟังก์ชันแก้ไขชื่อเมนู
    const handleEditMenuItem = (index, newMenuName) => {
        const updatedList = [...selected.list];
        updatedList[index].menuName = newMenuName;
        setSelected({ ...selected, list: updatedList });
    };

    return (
        <>
            <Modal
                open={showForm}
                onClose={handleCancel}
                sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
                <Sheet variant="outlined" sx={{ maxWidth: 700, borderRadius: 'md', p: 3, boxShadow: 'lg',overflow : 'auto' }}>
                    <ModalClose variant="plain" sx={{ m: 1 }} />
                    <Typography component="h2" level="h4" sx={{ fontWeight: 'lg', mb: 1 }}>
                        {selected?.description}[{selected?.botTokenId}]
                    </Typography>

                    <div id="modal-desc">
                        <Warning />
                        <Typography level="body-sm" sx={{ mb: 2, color: 'text.secondary' }}>
                            สามารถเพิ่มเมนูได้สูงสุด 4 เมนู (ปัจจุบัน: {selected?.list?.length || 0}/4)
                        </Typography>

                        <TableContainer>
                            <Table>
                                <thead>
                                    <tr>
                                        <th width="50">ลำดับ</th>
                                        <th width="100%">ชื่อเมนู</th>
                                        <th width="100%">ส่งไปยังห้อง</th>
                                        <th width="30%">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selected?.list?.map((item, index) => (
                                        <tr
                                            key={index} draggable onDragOver={handleDragOver}
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDrop={(e) => handleDrop(e, index)}
                                            style={{ cursor: 'move' }}
                                        >
                                            <td>
                                                <DragIndicator
                                                    sx={{
                                                        color: 'text.secondary',cursor: 'grab',
                                                        '&:active': { cursor: 'grabbing' }
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <Stack direction='row' alignItems='center' spacing={1}>
                                                    <Typography level="body-sm" sx={{ fontWeight: 'bold' }}>
                                                        {item.menu_number}
                                                    </Typography>
                                                    <Input
                                                        value={item.menuName || ""}
                                                        onChange={(e) => handleEditMenuItem(index, e.target.value)}
                                                        placeholder="ชื่อเมนู"
                                                        sx={{ width: '100%' }}
                                                    />
                                                </Stack>
                                            </td>
                                            <td>
                                                <Autocomplete
                                                    value={item.roomName || ""}
                                                    options={chatRooms?.map((room) => room.roomName) || []}
                                                    onChange={(_, newValue) => {
                                                        const updatedList = [...selected.list];
                                                        const selectedRoom = chatRooms?.find((room) => room.roomName === newValue);
                                                        updatedList[index].roomId = selectedRoom?.roomId || null;
                                                        updatedList[index].roomName = newValue || "";
                                                        setSelected({ ...selected, list: updatedList });
                                                    }}
                                                    placeholder="เลือกห้อง"
                                                    sx={{ width: '100%' }}
                                                />
                                            </td>
                                            <td>
                                                <Box>
                                                    <Button
                                                        variant='outlined' size='sm'
                                                        color='danger' onClick={() => handleDelete(index)}
                                                    >
                                                        <DeleteIcon />
                                                    </Button>
                                                </Box>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </TableContainer>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                            <Input
                                type="text"
                                sx={{ width: '100%' }}
                                value={newMenuItem.menuName || ""}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setNewMenuItem({ ...newMenuItem, menuName: value });
                                    setStringLength(value.length);
                                }}
                                placeholder="เพิ่มเมนู"
                            />
                            <Typography
                                level="body-sm"
                                sx={{
                                    minWidth: '30px',
                                    color: stringLength > 20 ? 'danger.main' : 'text.secondary'
                                }}
                            >
                                {stringLength}/20
                            </Typography>
                            <Autocomplete
                                sx={{ width: '100%' }}
                                value={newMenuItem.roomName || ""}
                                options={chatRooms?.map((room) => room.roomName) || []}
                                placeholder="ส่งไปยังห้อง"
                                onChange={(_, newValue) => {
                                    const selectedRoom = chatRooms?.find((room) => room.roomName === newValue);
                                    setNewMenuItem({
                                        ...newMenuItem,
                                        roomId: selectedRoom?.roomId || null,
                                        roomName: newValue || "",
                                    });
                                }}
                            />
                            <Button
                                size='sm'
                                onClick={handleAddMenuItem}
                                disabled={
                                    !newMenuItem.roomId ||
                                    !newMenuItem.menuName ||
                                    stringLength > 20 ||
                                    stringLength === 0 ||
                                    selected?.list?.length >= 4
                                }
                            >
                                <AddIcon />&nbsp;เพิ่ม
                            </Button>
                        </Box>

                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                            <Button size='sm' onClick={handleSave}>
                                บันทึก
                            </Button>
                            <Button size='sm' color='neutral' onClick={handleCancel}>
                                ยกเลิก
                            </Button>
                        </Box>
                    </div>
                </Sheet>
            </Modal>
        </>
    );
};