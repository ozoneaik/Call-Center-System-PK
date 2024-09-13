import Content from "../../Layouts/Content.jsx";
import Typography from "@mui/joy/Typography";
import Box from "@mui/joy/Box";
import {Breadcrumbs} from "@mui/joy";
import Sheet from "@mui/joy/Sheet";
import NewCustDmPage from "./NewCustDm.jsx";

export default function CustDmPage(){
    return (
        <Content>
            <Sheet
                sx={{
                    flex: 1, width: '100%', mx: 'auto', pt: 0, display: 'grid',
                    gridTemplateColumns: {xs: '1fr',},
                }}
            >
                <Box
                    component="main"
                    className="MainContent"
                    sx={{
                        px: {xs: 2, md: 6},
                        pt: {
                            xs: 'calc(12px + var(--Header-height))',
                            sm: 'calc(12px + var(--Header-height))',
                            md: 3,
                        },
                        pb: {xs: 2, sm: 2, md: 3},
                        flex: 1, display: 'flex', flexDirection: 'column',
                        minWidth: 0, height: '100dvh', gap: 1,
                    }}
                >
                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                        <Breadcrumbs size="sm" aria-label="breadcrumbs" sx={{pl: 0}}>
                            <Typography color="primary" sx={{fontWeight: 500, fontSize: 12}}>
                                ห้องแชท
                            </Typography>
                            <Typography color="primary" sx={{fontWeight: 500, fontSize: 12}}>

                            </Typography>
                        </Breadcrumbs>
                    </Box>
                    <NewCustDmPage/>
                </Box>
            </Sheet>
        </Content>
    )
}