import Button from "@mui/joy/Button";
import { Modal, ModalClose, Sheet, Table, Typography, Input, Box, Autocomplete, Stack } from "@mui/joy";
import { TableContainer } from "@mui/material";
import { Delete as DeleteIcon, Add as AddIcon, DragIndicator } from '@mui/icons-material';
import { useState, useMemo } from "react";
import { addOrUpdateBotApi } from "../../Api/BotMenu.js";
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import { Warning } from "./Warning.jsx";

const MAX_NAME_LEN = 20;
const textLen = (s) => Array.from(s || "").length; // นับอักษร (ไทย/อีโมจิ) ให้ถูก

export const FormCreateOrUpdateBot = (props) => {
    const { setBots, setSelected, selected, chatRooms, showForm, setShowForm } = props;
    const [stringLength, setStringLength] = useState(0);
    const [newMenuItem, setNewMenuItem] = useState({
        menuName: "",
        roomId: null,
        roomName: "",
    });

    const updateMenuNumbers = (list) => list.map((item, index) => ({ ...item, menu_number: index + 1 }));

    const handleDelete = (index) => {
        const updatedList = [...selected.list];
        updatedList.splice(index, 1);
        const reorderedList = updateMenuNumbers(updatedList);
        setSelected({ ...selected, list: reorderedList });
    };

    const handleAddMenuItem = () => {
        if (selected.list.length >= 4) {
            AlertDiaLog({
                icon: 'warning',
                title: 'ไม่สามารถเพิ่มได้',
                text: 'สามารถเพิ่มเมนูได้สูงสุด 4 เมนูเท่านั้น',
            });
            return;
        }
        const newItem = { ...newMenuItem, menu_number: selected.list.length + 1 };
        setSelected({ ...selected, list: [...selected.list, newItem] });
        setNewMenuItem({ menuName: "", roomId: null, roomName: "" });
        setStringLength(0);
    };

    const handleDragStart = (e, index) => {
        e.dataTransfer.setData('text/plain', index);
        e.dataTransfer.effectAllowed = 'move';
    };
    const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
        if (dragIndex === dropIndex) return;
        const updatedList = [...selected.list];
        const draggedItem = updatedList[dragIndex];
        updatedList.splice(dragIndex, 1);
        updatedList.splice(dropIndex, 0, draggedItem);
        const reorderedList = updateMenuNumbers(updatedList);
        setSelected({ ...selected, list: reorderedList });
    };

    const handleCancel = () => {
        setShowForm(false);
        setSelected(null);
        setNewMenuItem({ menuName: "", roomId: null, roomName: "" });
        setStringLength(0);
    };

    // ---------- ตรวจ Validation ของทุกแถวในตาราง ----------
    const tooLongRows = useMemo(
        () => (selected?.list || []).map((it, i) => ({ i, len: textLen(it.menuName) }))
            .filter(r => r.len > MAX_NAME_LEN),
        [selected?.list]
    );
    const emptyNameRows = useMemo(
        () => (selected?.list || []).map((it, i) => ({ i, name: it.menuName }))
            .filter(r => !(r.name || "").trim()),
        [selected?.list]
    );
    const noRoomRows = useMemo(
        () => (selected?.list || []).map((it, i) => ({ i, roomId: it.roomId }))
            .filter(r => !r.roomId),
        [selected?.list]
    );

    const disableSave = useMemo(() => {
        if (!selected?.list?.length) return true;
        return tooLongRows.length > 0 || emptyNameRows.length > 0 || noRoomRows.length > 0;
    }, [selected?.list, tooLongRows.length, emptyNameRows.length, noRoomRows.length]);

    const handleSave = async () => {
        // กันพลาดอีกรอบก่อนส่ง
        if (disableSave) {
            const lines = [];
            if (emptyNameRows.length) lines.push(`• ชื่อเมนูว่างที่แถว: ${emptyNameRows.map(r => r.i + 1).join(', ')}`);
            if (tooLongRows.length) lines.push(`• เกิน ${MAX_NAME_LEN} ตัวอักษรที่แถว: ${tooLongRows.map(r => r.i + 1).join(', ')}`);
            if (noRoomRows.length) lines.push(`• ยังไม่เลือกห้องที่แถว: ${noRoomRows.map(r => r.i + 1).join(', ')}`);
            AlertDiaLog({
                icon: 'warning',
                title: 'ตรวจสอบข้อมูลก่อนบันทึก',
                text: lines.join('\n')
            });
            return;
        }

        const sortedList = [...selected.list].sort((a, b) => a.menu_number - b.menu_number);
        const dataToSend = { ...selected, list: sortedList };

        setShowForm(false);
        const { data, status } = await addOrUpdateBotApi({ bot: dataToSend });
        AlertDiaLog({
            icon: status === 200 ? 'success' : 'error',
            title: data.message,
            text: data.detail,
            onPassed: () => {
                if (status === 200) {
                    setBots(prevBots => prevBots.map(bot =>
                        bot.botTokenId === selected.botTokenId ? { ...dataToSend } : bot
                    ));
                    setSelected(null);
                }
            }
        });
    };

    const handleEditMenuItem = (index, newMenuName) => {
        const updatedList = [...selected.list];
        updatedList[index].menuName = newMenuName;
        setSelected({ ...selected, list: updatedList });
    };

    return (
        <>
            <Modal open={showForm} onClose={handleCancel} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Sheet variant="outlined" sx={{ maxWidth: 700, borderRadius: 'md', p: 3, boxShadow: 'lg', overflow: 'auto' }}>
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
                                    {selected?.list?.map((item, index) => {
                                        const len = textLen(item.menuName);
                                        const over = len > MAX_NAME_LEN;
                                        return (
                                            <tr
                                                key={index}
                                                draggable
                                                onDragOver={handleDragOver}
                                                onDragStart={(e) => handleDragStart(e, index)}
                                                onDrop={(e) => handleDrop(e, index)}
                                                style={{ cursor: 'move' }}
                                            >
                                                <td>
                                                    <DragIndicator
                                                        sx={{ color: 'text.secondary', cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
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
                                                            color={over ? 'danger' : 'neutral'}
                                                            variant="outlined"
                                                            sx={{ width: '100%' }}
                                                            endDecorator={
                                                                <Typography
                                                                    level="body-xs"
                                                                    sx={{
                                                                        minWidth: 44,
                                                                        textAlign: 'right',
                                                                        opacity: 0.9,
                                                                        color: over ? 'var(--joy-palette-danger-600)' : 'text.tertiary'
                                                                    }}
                                                                >
                                                                    {len}/{MAX_NAME_LEN}
                                                                </Typography>
                                                            }
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
                                                        <Button variant='outlined' size='sm' color='danger' onClick={() => handleDelete(index)}>
                                                            <DeleteIcon />
                                                        </Button>
                                                    </Box>
                                                </td>
                                            </tr>
                                        );
                                    })}
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
                                    setStringLength(textLen(value)); // ใช้ตัวนับใหม่
                                }}
                                placeholder="เพิ่มเมนู"
                                color={stringLength > MAX_NAME_LEN ? 'danger' : 'neutral'}
                                endDecorator={
                                    <Typography
                                        level="body-xs"
                                        sx={{
                                            minWidth: 44,
                                            textAlign: 'right',
                                            opacity: 0.9,
                                            color: stringLength > MAX_NAME_LEN ? 'var(--joy-palette-danger-600)' : 'text.tertiary'
                                        }}
                                    >
                                        {stringLength}/{MAX_NAME_LEN}
                                    </Typography>
                                }
                            />
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
                                    !newMenuItem.menuName?.trim() ||
                                    stringLength > MAX_NAME_LEN ||
                                    selected?.list?.length >= 4
                                }
                            >
                                <AddIcon />&nbsp;เพิ่ม
                            </Button>
                        </Box>

                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                            <Button size='sm' onClick={handleSave} disabled={disableSave}>
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
