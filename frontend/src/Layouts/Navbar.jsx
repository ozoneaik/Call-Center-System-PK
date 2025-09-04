import {Sheet} from "@mui/joy";
import GlobalStyles from "@mui/joy/GlobalStyles";
import {toggleSidebar} from "../utils.js";
import IconButton from "@mui/joy/IconButton";
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import {LayoutStyle} from "../styles/LayoutStyle.js";

export default function Navbar() {
    return (
        <Sheet sx={LayoutStyle.Navbar}>
            <GlobalStyles styles={(theme) => ({
                ':root': {
                    '--Header-height': '52px',
                    [theme.breakpoints.up('lg')]: {
                        '--Header-height': '0px',
                    },
                },
            })}/>
            <IconButton
                onClick={() => toggleSidebar()}
                variant="outlined"
                color="neutral"
                size="sm"
            >
                <MenuRoundedIcon />
            </IconButton>
        </Sheet>
    )
}