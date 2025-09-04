import { Grid2 } from "@mui/material";
import { useState } from "react";
import BotRoom from "./BotRoom";
import { Box, Button, Sheet } from "@mui/joy";


const backgroundUrl = 'https://img.freepik.com/free-vector/matrix-style-binary-code-digital-falling-numbers-blue-background_1017-37387.jpg?semt=ais_hybrid&w=740';
const buttonList = [
    { name: 'BotRoom', id: 1 },
    { name: 'BotRoom2', id: 2 },
    { name: 'BotRoom3', id: 3 },
]

export default function LayoutSeCreate() {
    const [selectMenu, setSelectMenu] = useState(0);
    const handleChagneMenu = (menu = 0) => {
        setSelectMenu(menu);
    }
    return (
        <Sheet sx={layoutStyle}>
            <Grid2 container spacing={2}>
                <Grid2 size={12}>
                    <Box display='flex' gap={1} flexWrap='wrap'>
                        {buttonList.map((item, index) => (
                            <Button disabled={item.id === selectMenu} key={index} onClick={() => handleChagneMenu(item.id)}>
                                {item.name}
                            </Button>
                        ))}
                    </Box>
                </Grid2>
                <Grid2 size={12}>
                    {selectMenu === 1 && <BotRoom />}
                </Grid2>
            </Grid2>
        </Sheet>
    )
}

const layoutStyle = {
    width: '100dvw',
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    p: 2,
    backgroundImage: `url(${backgroundUrl})`,
    backgroundSize: 'cover',
}