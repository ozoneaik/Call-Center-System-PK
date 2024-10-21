import Grid from "@mui/material/Grid2";
import {useEffect, useState} from "react";
import Button from "@mui/joy/Button";
import {ListContentsApi, ListGroupsApi, ListModelsApi, ListProblemsApi} from "../Api/Messages.js";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import Tooltip from '@mui/joy/Tooltip';

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
                    {groups.length > 0 && groups.map((group, i) => (
                        <Tooltip
                            key={i} placement="right-start"
                            title={group.groups}
                            variant="plain">
                            <Button
                                color='warning'
                                onClick={() => selectG(group.groups)}
                                disabled={G === group.groups} variant="outlined"
                                fullWidth sx={{my: .5}}>
                                {group.groups}
                            </Button>
                        </Tooltip>
                    ))}
                </Grid>
                <Grid size={{xs: 12, sm: 3}}>
                    <Typography mb={1} fontSize={14}>รุ่น {models.length}</Typography>
                    {models.length > 0 && models.map((model, i) => (
                        <Tooltip
                            key={i} placement="right-start"
                            title="lsadjflsjflksjflksjlfjslfjlsdfjls"
                            variant="plain">
                            <Button
                                color='danger'
                                onClick={() => selectM(model.models)}
                                disabled={M === model.models} variant="outlined"
                                fullWidth sx={{my: .5}}>
                                {model.models}
                            </Button>
                        </Tooltip>
                    ))}
                </Grid>
                <Grid size={{xs: 12, sm: 3}}>
                    <Typography mb={1} fontSize={14}>ปัญหา</Typography>
                    {problems.length > 0 && problems.map((problem, i) => (
                        <Tooltip
                            key={i} placement="right-start"
                            title={problem.problems}
                            variant="plain">
                            <Button
                                color='primary'
                                onClick={() => selectP(problem.problems)}
                                disabled={P === problem.problems} variant="outlined"
                                fullWidth sx={{my: .5}}>
                                {problem.problems}
                            </Button>
                        </Tooltip>
                    ))}
                </Grid>
                <Grid size={{xs: 12, sm: 3}}>
                    <Typography mb={1} fontSize={14}>ข้อความส่งด่วน</Typography>
                    {contents.length > 0 && contents.map((content, i) => (
                        <Tooltip
                            key={i} placement="right-start"
                            title={content.content}
                            variant="plain">
                            <Button
                                onClick={() => setC(content.content)}
                                disabled={C === content.content}
                                fullWidth sx={{
                                my: .5,
                                width: 200,
                                overflow: "hidden",
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: 3,
                                textOverflow: "ellipsis",
                                height: "auto",
                            }}>

                                {content.content}
                            </Button>
                        </Tooltip>
                    ))}
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