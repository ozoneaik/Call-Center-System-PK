import {Box, Button, FormControl, FormLabel, Grid, Textarea} from "@mui/joy";
import {ChatPageStyle} from "../../styles/ChatPageStyle.js";
import Typography from "@mui/joy/Typography";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import SaveIcon from "@mui/icons-material/Save";

export const FormSC = (props) => {
    const {selected, setSelected,onSubmit} = props;
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    }
    return (
        <Grid xs={12} sm={4}>
            <Box sx={{bgcolor: 'background.surface', borderRadius: 'sm'}}>
                <Box sx={ChatPageStyle.BoxTable}>
                    <Typography level="h2" component="h1">เพิ่ม/แก้ไขข้อความส่งด่วน</Typography>
                </Box>
                <form onSubmit={handleSubmit}>
                    <FormControl sx={{mb: 2}}>
                        <FormLabel>หมวดมู่</FormLabel>
                        <Select multiple>
                            <Option value={'test'}>hello</Option>
                            <Option value={'joker'}>joker</Option>
                        </Select>
                    </FormControl>
                    <FormControl sx={{mb: 2}}>
                        <FormLabel>รุ่น</FormLabel>
                        <Select multiple>
                            <Option value={'test'}>hello</Option>
                            <Option value={'joker'}>joker</Option>
                        </Select>
                    </FormControl>
                    <FormControl sx={{mb: 2}}>
                        <FormLabel>ปัญหา</FormLabel>
                        <Select multiple>
                            <Option value={'test'}>hello</Option>
                            <Option value={'joker'}>joker</Option>
                        </Select>
                    </FormControl>
                    <FormControl sx={{mb: 2}}>
                        <FormLabel>ข้อความส่งด่วน</FormLabel>
                        <Textarea minRows={1}
                                  onChange={(e) => setSelected(prevState => ({
                                      ...prevState, content: e.target.value
                                  }))}
                                  value={selected.content || ''} type="text"
                                  placeholder="ex.มีอะไรให้ช่วยมั้ยครับ ?"
                        />
                    </FormControl>
                    <Box sx={{display: 'flex', gap: 1}}>
                        <Button
                            color='warning' disabled={!selected.content}
                            onClick={() => setSelected({})}
                        >
                            ล้าง
                        </Button>
                        <Button
                            disabled={!selected.content} type="submit"
                            startDecorator={<SaveIcon/>}
                        >
                            {!selected.id ? 'บันทึก' : 'อัพเดท'}
                        </Button>
                    </Box>
                </form>
            </Box>
        </Grid>
    )
}