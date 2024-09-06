import CssBaseline from "@mui/joy/CssBaseline";
import Box from "@mui/joy/Box";
import Sidebar from "./Sidebar.jsx";
import {CssVarsProvider} from "@mui/joy/styles";
import Header from "./Header.jsx";
import {useEffect} from "react";

export default function Content({children}) {
    return (
        <CssVarsProvider disableTransitionOnChange>
            <CssBaseline/>
            <Box sx={{display: 'flex', minHeight: '100dvh'}}>
                <Sidebar/>
                <Header/>
                <Box component="main" className="MainContent" sx={{flex: 1}}>
                    {children}
                </Box>
            </Box>
        </CssVarsProvider>
    )
}