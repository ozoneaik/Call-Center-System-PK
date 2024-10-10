import {MessageStyle} from "../../styles/MessageStyle.js";
import Avatar from "@mui/joy/Avatar";
import {Box, Card, CardContent, Sheet, Textarea} from "@mui/joy";
import Typography from "@mui/joy/Typography";
import Divider from "@mui/joy/Divider";
import Stack from "@mui/joy/Stack";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from '@mui/icons-material/StarBorder';
import IconButton from "@mui/joy/IconButton";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Button from "@mui/joy/Button";
import {convertFullDate} from "../../Components/Options.jsx";
import Chip from "@mui/joy/Chip";
import {AlertDiaLog, AlertWithForm} from "../../Dialogs/Alert.js";
import {useEffect, useState} from "react";
import {deleteNoteApi, storeNoteApi} from "../../Api/Messages.js";

const StarRating = ({value, max = 5}) => (
    <Box sx={{display: 'flex', alignItems: 'center'}}>
        {[...Array(max)].map((_, index) => (
            <IconButton key={index}>
                {index < value ? <StarIcon sx={{color: '#f15721'}}/> : <StarBorderIcon/>}
            </IconButton>
        ))}
    </Box>
);

export default function InfoMessage(props) {
    const {sender} = props;
    const [notes, setNotes] = useState([]);
    const [starList, setStarList] = useState([]);
    const [newNote, setNewNote] = useState('');

    useEffect(() => {
        setNotes(props.notes);
    }, [props.notes]);

    useEffect(() => {
        setStarList(props.starList)
    }, [props.starList]);


    const updateNote = (text, id) => {
        AlertWithForm({
            id,
            text,
            onPassed: ({confirm, textUpdate, id}) => {
                if (confirm) {
                    const updatedNotes = notes.map(note =>
                        note.id === id ? {...note, id: id, text: textUpdate} : note
                    );
                    setNotes(updatedNotes);
                } else console.log('เกิดปัญหาการ update Note')
            }
        });
    };

    const addNote = async () => {
        const {data, status} = await storeNoteApi({text: newNote, custId: sender.custId});
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
            title: 'ยืนยันการลบ',
            text: 'กด ตกลง เพื่อยืนยันการลบ',
            onPassed: async (confirm) => {
                if (confirm) {
                    const {data, status} = await deleteNoteApi({id: id});
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

    return (
        <Sheet sx={[MessageStyle.Layout, MessageStyle.Info.subLayout]}>
            <Box sx={MessageStyle.Info.Box}>
                <Avatar src={sender.avatar} sx={{width: '80px', height: '80px', mb: 1}}/>
                <Typography level="h4" sx={{mb: 0.5, color: 'white'}}>{sender.custName}</Typography>
            </Box>
            <Divider/>
            {/* โน๊ต */}
            <Box sx={{p: 2, height: '40%', overflowY: 'scroll'}}>
                <Typography level="title-md" sx={{mb: 1}}>โน๊ต</Typography>
                <Stack spacing={1}>
                    <Textarea value={newNote || ''} placeholder='เพิ่มโน้ต'
                              onChange={(e) => setNewNote(e.target.value)}/>
                    <Box sx={{display: 'flex', justifyContent: 'end', alignItems: 'center'}}>
                        <Button size='sm' onClick={addNote}>เพิ่ม</Button>
                    </Box>
                    {notes && notes.length > 0 ? (notes.map((note, index) => (
                        <Card key={index} variant="soft" color='neutral'>
                            <CardContent>
                                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <Typography level="body-sm" sx={{color: 'text.tertiary'}}>
                                        {note.text}
                                    </Typography>
                                    <Typography level="body-sm">
                                        <IconButton size='sm' onClick={() => updateNote(note.text, note.id)}>
                                            <EditIcon/>
                                        </IconButton>
                                        <IconButton size='sm' onClick={() => deleteNote(note.id)}>
                                            <DeleteIcon/>
                                        </IconButton>
                                    </Typography>
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
            <Divider/>
            {/* ประวัติการให้ดาว */}
            <Box sx={{p: 2, height: '40%', overflowY: 'scroll'}}>
                <Typography level="title-md" sx={{mb: 1}}>ประวัติการให้ดาว</Typography>
                <Stack spacing={1}>
                    {starList && starList.length > 0 ?
                        starList.map((star, index) => (
                            <Card key={index} variant="outlined" sx={{p: 1.5}}>
                                <CardContent>
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <StarRating value={star.rate}/>
                                        <Box sx={{textAlign: 'end'}}>
                                            <Typography level="body-xs" sx={{color: 'text.tertiary'}}>
                                                {star.rate > 0 ? 'ประเมินเมื่อ' : 'ลูกค้าไม่ได้ประเมิน'}
                                            </Typography>
                                            <Typography level="body-xs" sx={{color: 'text.tertiary'}}>
                                                {star.rate > 0 && convertFullDate(star.updated_at)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        )) : (
                            <Box>
                                <Chip size='lg' color='danger'>ไม่พบประวัติ</Chip>
                            </Box>
                        )}
                </Stack>
            </Box>

        </Sheet>
    )
}