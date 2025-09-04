import { Box, Card, CardContent, Textarea } from "@mui/joy";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import Button from "@mui/joy/Button";
import IconButton from "@mui/joy/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Chip from "@mui/joy/Chip";
import { deleteNoteApi, storeNoteApi } from "../../../Api/Note.js";
import { AlertDiaLog, AlertWithForm } from "../../../Dialogs/Alert.js";

export const Notes = (props) => {
    const { notes, setNotes, check, newNote, setNewNote, sender } = props;

    const addNote = async (e) => {
        e.preventDefault();
        const { data, status } = await storeNoteApi({ text: newNote, custId: sender.custId });
        AlertDiaLog({
            icon: status === 200 && 'success',
            text: data.detail,
            title: data.message,
            onPassed: (confirm) => {
                if (confirm && status === 200) {
                    const New = {
                        id: notes.length,
                        text: newNote,
                    };
                    setNotes([...notes, New]);
                    setNewNote('');
                } else console.log('add note not success')
            }
        })
    };

    const deleteNote = (id) => {
        AlertDiaLog({
            icon: 'question',
            title: 'ยืนยันการลบ',
            text: 'กด ตกลง เพื่อยืนยันการลบ',
            onPassed: async (confirm) => {
                if (confirm) {
                    const { data, status } = await deleteNoteApi({ id: id });
                    AlertDiaLog({
                        icon: status === 200 && 'success',
                        text: data.detail,
                        title: data.message,
                        onPassed: (confirm) => {
                            if (confirm && status === 200) {
                                setNotes((prevNotes) =>
                                    prevNotes.filter((note) => note.id !== id)
                                );
                            } else console.log('delete note not success')
                        }
                    });
                } else console.log('ไม่ได้ confirm')
            }
        })
    }

    const updateNote = (text, id) => {
        AlertWithForm({
            id, text,
            onPassed: ({ confirm, textUpdate, id }) => {
                if (confirm) {
                    const updatedNotes = notes.map(note =>
                        note.id === id ? { ...note, id: id, text: textUpdate } : note
                    );
                    setNotes(updatedNotes);
                } else console.log('เกิดปัญหาการ update Note')
            }
        });
    };

    return (
        <>
            <Box sx={{ p: 2, height: '40%', overflowY: 'scroll' }}>
                <Typography level="title-md" sx={{ mb: 1 }}>โน๊ต</Typography>
                <Stack spacing={1}>
                    {check === '1' && (
                        <form onSubmit={(e) => addNote(e)}>
                            <Textarea required value={newNote || ''} placeholder='เพิ่มโน้ต'
                                onChange={(e) => setNewNote(e.target.value)} />
                            <Box sx={{ display: 'flex', justifyContent: 'end', alignItems: 'center', mt: 1 }}>
                                <Button size='sm' type={"submit"}>เพิ่ม</Button>
                            </Box>
                        </form>
                    )}
                    {notes && notes.length > 0 ? (notes.map((note, index) => (
                        <Card key={index} variant="soft" color="neutral">
                            <CardContent>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Box>
                                        <Typography level="body-sm" sx={{ color: "text.primary" }}>
                                            {note.text} (#{note.id})
                                        </Typography>
                                        <Typography level="body-xs" sx={{ color: "text.tertiary", mt: 0.5 }}>
                                            🕒 {new Date(note.created_at).toLocaleString("th-TH", {
                                                dateStyle: "short",
                                                timeStyle: "short",
                                            })}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <IconButton size="sm" onClick={() => updateNote(note.text, note.id)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton size="sm" onClick={() => deleteNote(note.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    ))) : (
                        <Box>
                            <Chip size='lg' color='danger'>ไม่พบโน๊ต</Chip>
                        </Box>
                    )}
                </Stack>
            </Box>
        </>
    )
}