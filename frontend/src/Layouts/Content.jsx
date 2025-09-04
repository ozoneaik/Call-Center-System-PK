import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";
import {Box, CssBaseline, CssVarsProvider} from "@mui/joy";
import {LayoutStyle} from "../styles/LayoutStyle.js";

export default function Content({children}) {
    return (
        <>
            <CssVarsProvider disableTransitionOnChange>
                <CssBaseline/>
                <Box sx={LayoutStyle.MainLayout}>
                    <Sidebar/>
                    <Navbar/>
                    <Box component='main' className='MainContent' sx={{flex : 1}}>
                        {children}
                    </Box>
                </Box>
            </CssVarsProvider>
        </>
    )
}