import React, {useEffect, useState} from 'react';
import {Autocomplete, AutocompleteOption, Box, Button, FormControl, FormLabel, Textarea, Typography,} from "@mui/joy";
import {ChatPageStyle} from "../../styles/ChatPageStyle.js";
import SaveIcon from "@mui/icons-material/Save";

export const FormSC = (props) => {
    const {onSubmit, Groups = [], Models = [], Problems = []} = props;
    const [groups, setGroups] = useState([]);
    const [models, setModels] = useState([]);
    const [problems, setProblems] = useState([]);

    const [selectedGroups, setSelectedGroups] = useState([]);
    const [selectedModels, setSelectedModels] = useState([]);
    const [selectedProblems, setSelectedProblems] = useState([]);
    const [content, setContent] = useState('');

    useEffect(() => {
        setGroups(Groups);
        setModels(Models);
        setProblems(Problems);
    }, [Groups, Models, Problems]);


    const handleSubmit = (e) => {
        e.preventDefault();
        console.log({
            groups: selectedGroups,
            models: selectedModels,
            problems: selectedProblems,
            content
        });

        const dataForm = {
            groups: selectedGroups,
            models: selectedModels,
            problems: selectedProblems,
            content
        }
        onSubmit(dataForm);
    };

    const handleAddOption = (options, setOptions, selectedOptions, setSelectedOptions) => (event, newValue) => {
        if (newValue.length > 0) {
            const lastOption = newValue[newValue.length - 1];
            if (typeof lastOption === 'string') {
                const optionExists = options.some(
                    (option) => option.title.toLowerCase() === lastOption.toLowerCase()
                );
                if (!optionExists) {
                    const newOption = {title: lastOption};
                    setOptions((prev) => [...prev, newOption]);
                    newValue[newValue.length - 1] = newOption;
                } else {
                    newValue = newValue.slice(0, -1);
                }
            }
        }
        setSelectedOptions(newValue);
    };

    const clear = () => {
        setSelectedGroups([]);
        setSelectedModels([]);
        setSelectedProblems([]);
        setContent('');
    }

    return (

        <Box sx={{bgcolor: 'background.surface', borderRadius: 'sm'}}>
            <Box sx={ChatPageStyle.BoxTable}>
                <Typography level="h2" component="h1">เพิ่ม/แก้ไขข้อความส่งด่วน</Typography>
            </Box>
            <form onSubmit={handleSubmit}>
                <FormControl sx={{mb: 2}}>
                    <FormLabel>หมวดหมู่</FormLabel>
                    <Autocomplete
                        multiple
                        id="groups"
                        placeholder="เลือกหรือเพิ่มหมวดหมู่"
                        options={groups}
                        getOptionLabel={(option) => option.title}
                        value={selectedGroups}
                        onChange={handleAddOption(groups, setGroups, selectedGroups, setSelectedGroups)}
                        freeSolo
                        renderOption={(props, option) => {
                            const {key, ...otherProps} = props;
                            return (
                                <AutocompleteOption key={key} {...otherProps}>
                                    {option.title}
                                </AutocompleteOption>
                            );
                        }}
                    />
                </FormControl>
                <FormControl sx={{mb: 2}}>
                    <FormLabel>รุ่น</FormLabel>
                    <Autocomplete
                        multiple
                        id="models"
                        placeholder="เลือกหรือเพิ่มรุ่น"
                        options={models}
                        getOptionLabel={(option) => option.title}
                        value={selectedModels}
                        onChange={handleAddOption(models, setModels, selectedModels, setSelectedModels)}
                        freeSolo
                        renderOption={(props, option) => {
                            const {key, ...otherProps} = props;
                            return (
                                <AutocompleteOption key={key} {...otherProps}>
                                    {option.title}
                                </AutocompleteOption>
                            );
                        }}
                    />
                </FormControl>
                <FormControl sx={{mb: 2}}>
                    <FormLabel>ปัญหา</FormLabel>
                    <Autocomplete
                        multiple
                        id="problems"
                        placeholder="เลือกหรือเพิ่มปัญหา"
                        options={problems}
                        getOptionLabel={(option) => option.title}
                        value={selectedProblems}
                        onChange={handleAddOption(problems, setProblems, selectedProblems, setSelectedProblems)}
                        freeSolo
                        renderOption={(props, option) => {
                            const {key, ...otherProps} = props;
                            return (
                                <AutocompleteOption key={key} {...otherProps}>
                                    {option.title}
                                </AutocompleteOption>
                            );
                        }}
                    />
                </FormControl>
                <FormControl sx={{mb: 2}}>
                    <FormLabel>เนื้อหา</FormLabel>
                    <Textarea
                        placeholder="กรอกเนื้อหา"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        minRows={3}
                    />
                </FormControl>
                <Button type="submit" disabled={content === ''} startDecorator={<SaveIcon/>}>บันทึก</Button>
                <Button onClick={clear}>reset</Button>
            </form>
        </Box>

    );
};