import Grid from "@mui/material/Grid2";
import {useEffect, useState} from "react";
import Button from "@mui/joy/Button";
import {ListContentsApi, ListGroupsApi, ListModelsApi, ListProblemsApi} from "../Api/ShortChat.js";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import {Autocomplete} from "@mui/joy";

export const ShortChatContent = ({handle}) => {
    const [groups, setGroups] = useState([]);
    const [G, setG] = useState({});
    const [models, setModels] = useState([]);
    const [M, setM] = useState({});
    const [problems, setProblems] = useState([]);
    const [P, setP] = useState({});
    const [contents, setContents] = useState([]);
    const [C, setC] = useState('');

    const fetchChatRoom = async () => {
        const {data, status} = await ListGroupsApi();
        status === 200 && setGroups(data.list);
    }
    useEffect(() => {
        fetchChatRoom().finally(() => console.log('fetch success'));
    }, []);

    const selectG = async (value) => {
        setModels([]);
        setProblems([]);
        setContents([]);
        setG(value);
        setM('');
        setP('');
        setC('');
        const {data, status} = await ListModelsApi({group: value});
        status === 200 && setModels(data.list);
    }

    const selectM = async (value) => {
        setProblems([]);
        setContents([]);
        setM(value);
        setP('');
        setC('');
        const {data, status} = await ListProblemsApi({group: G, model: value})
        status === 200 && setProblems(data.list);
    }

    const selectP = async (value) => {
        setContents([]);
        setP(value);
        setC('');
        const {data, status} = await ListContentsApi({group: G, model: M, problem: value})
        status === 200 && setContents(data.list);
    }


    return (
        // <Sheet sx={[MessageStyle.Layout]}>
        <Sheet sx={{width: '80vw'}}>
            <Grid container spacing={2}>
                <Grid size={{xs: 12, sm: 3}}>
                    <Typography mb={1} fontSize={14}>หมวดหมู่</Typography>
                    <Autocomplete
                        options={groups}
                        placeholder={'เลือกหมวดหมู่'}
                        isOptionEqualToValue={(option, value) => option.label === value.label}
                        onChange={(event, value, reason, details) => {
                            selectG(value.label)
                        }}
                    />
                </Grid>
                <Grid size={{xs: 12, sm: 3}}>
                    <Typography mb={1} fontSize={14}>รุ่น {models.length}</Typography>
                    {models.length > 0 && (
                        <Autocomplete
                            options={models}
                            placeholder={'เลือกหมวดหมู่'}
                            isOptionEqualToValue={(option, value) => option.label === value.label}
                            onChange={(event, value, reason, details) => {
                                selectM(value.label).then(()=>{})
                            }}
                        />
                    )}
                </Grid>
                <Grid size={{xs: 12, sm: 3}}>
                    <Typography mb={1} fontSize={14}>ปัญหา</Typography>
                    {problems.length > 0 && (
                        <Autocomplete
                            options={problems}
                            placeholder={'เลือกหมวดหมู่'}
                            isOptionEqualToValue={(option, value) => option.label === value.label}
                            onChange={(event, value, reason, details) => {
                                selectP(value.label).then(()=>{})
                            }}
                        />
                    )}

                </Grid>
                <Grid size={{xs: 12, sm: 3}}>
                    <Typography mb={1} fontSize={14}>ข้อความส่งด่วน</Typography>
                    {contents.length > 0 && (
                        <Autocomplete
                            options={contents}
                            placeholder={'เลือกหมวดหมู่'}
                            isOptionEqualToValue={(option, value) => option.label === value.label}
                            onChange={(event, value, reason, details) => {
                                setC(value.label)
                            }}
                        />
                    )}
                </Grid>
                <Grid size={12}>
                    <Grid container direction="row-reverse">
                        <Button onClick={() => handle(C)} disabled={C === null || C === ''} size='sm'>ส่ง</Button>
                    </Grid>
                </Grid>
            </Grid>
        </Sheet>
    )
}