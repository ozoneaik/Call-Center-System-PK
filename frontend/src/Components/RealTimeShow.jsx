import {useEffect, useState} from "react";
import {differentDate} from "./Options.jsx";
import Chip from "@mui/joy/Chip";
import Typography from "@mui/joy/Typography";
import {ChatPageStyle} from "../styles/ChatPageStyle.js";

export const RealTimeShow = ({ startTime }) => {
    const [timeDiff, setTimeDiff] = useState(differentDate(startTime));

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeDiff(differentDate(startTime));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <Chip color="primary">
            <Typography sx={ChatPageStyle.TableText}>
                {startTime ? timeDiff : 'ยังไม่เริ่มสนทนา'}
            </Typography>
        </Chip>
    );
};