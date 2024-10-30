import {Alert} from "@mui/joy";
import WarningIcon from "@mui/icons-material/Warning";
import Typography from "@mui/joy/Typography";
import Box from "@mui/joy/Box";

export const Warning = () => {
    return(
        <Box sx={{ display: 'flex', gap: 2, width: '100%', flexDirection: 'column' }}>

            <Alert
                sx={{ alignItems: 'flex-start' }}
                variant="soft"
                startDecorator={<WarningIcon/>}
                color='warning'
                invertedColors
            >
                <div>
                    <div>คำเตือน</div>
                    <Typography level="body-sm">
                        ชื่อเมนูกรอกได้มากสุด 20 ตัวอักษรเท่านั้น
                    </Typography>
                </div>
            </Alert>

        </Box>
    )
}