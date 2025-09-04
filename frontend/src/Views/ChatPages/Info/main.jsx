import {MessageStyle} from "../../../styles/MessageStyle.js";
import Avatar from "@mui/joy/Avatar";
import {Box, Sheet} from "@mui/joy";
import Typography from "@mui/joy/Typography";
import Divider from "@mui/joy/Divider";
import {useEffect, useState} from "react";
import {toggleMessagesPane} from "../../../utils.js";
import {Notes} from "./Notes.jsx";
import {Feedback} from "./Feedback.jsx";


export default function Info(props) {
    const {sender, check} = props;
    const [notes, setNotes] = useState([]);
    const [starList, setStarList] = useState([]);
    const [newNote, setNewNote] = useState('');

    useEffect(() => {
        setNotes(props.notes);
    }, [props.notes]);

    useEffect(() => {
        setStarList(props.starList)
    }, [props.starList]);

    return (
        <Sheet sx={[MessageStyle.Layout, MessageStyle.Info.subLayout]}>
            <Box onClick={() => toggleMessagesPane()} sx={{m: 1, display: {sm: 'none'}}}>
                <Typography textAlign='center'>
                    ปิดหน้าต่างนี้
                </Typography>
            </Box>
            <Box sx={MessageStyle.Info.Box}>
                <Avatar src={sender.avatar} sx={{width: '80px', height: '80px', mb: 1}}/>
                <Typography level="h4" sx={{mb: 0.5, color: 'white'}}>{sender.custName}</Typography>
            </Box>
            <Divider/>
            {/* โน๊ต */}
            <Notes
                notes={notes}
                setNotes={setNotes}
                check={check}
                newNote={newNote}
                setNewNote={setNewNote}
                sender={sender}>
            </Notes>
            <Divider/>
            {/* ประวัติการให้ดาว */}
            <Feedback starList={starList} />
        </Sheet>
    )
}