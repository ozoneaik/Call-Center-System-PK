import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Input from "@mui/joy/Input";
import {Grid,Sheet} from "@mui/joy";
import {ChatPageStyle} from "../styles/ChatPageStyle.js";

export const CreateUser = (props) => {
    const {open, setOpen, Refresh} = props;
    return (
        <Sheet variant="outlined" sx={[ChatPageStyle.BoxSheet,{border : 'none'}]}>
            <Grid container spacing={1} sx={{ flexGrow: 1 }}>
                <Grid size={8}>
                    <FormControl>
                        <FormLabel>
                            รหัสพนักงาน
                        </FormLabel>
                        <Input placeholder={'ex.70010'}/>
                    </FormControl>
                </Grid>
                <Grid size={8}>
                    <FormControl>
                        <FormLabel>
                            ชื่อ-นามสกุล
                        </FormLabel>
                        <Input placeholder={'ex.นายสมศรี บันลือ'}/>
                    </FormControl>
                </Grid>
                <Grid size={8}>
                    <FormControl>
                        <FormLabel>
                            คำอธิบาย
                        </FormLabel>
                        <Input placeholder={'ex.นายสมศรี บันลือ'}/>
                    </FormControl>
                </Grid>
            </Grid>
        </Sheet>
    )
}