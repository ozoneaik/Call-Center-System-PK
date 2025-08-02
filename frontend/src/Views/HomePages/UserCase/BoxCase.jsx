//BoxCase.jsx
import { Box, Chip, IconButton } from "@mui/joy";
import { Home } from "@mui/icons-material";

export default function BoxCase({
    icon = <Home />,
    label = "กรุณาระบุ label",
    value = 0,
    color = "gray",
    warning = false
}) {
    return (
        <Box
            sx={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 1,
                borderRadius: 6,
                boxShadow: "sm",
                backgroundColor: warning ? "#FFF3F3" : "#ffffff",
                color: warning ? "#D32F2F" : color,
                border: warning ? "1px solid #F44336" : "none",
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton sx={{ color: warning ? "#D32F2F" : color }}>
                    {icon}
                </IconButton>
                <span>{label}</span>
            </Box>
            <Box sx={{ fontWeight: "bold" }}>
                {value}{" "}
                {warning && (
                    <Chip size="sm" color="danger" variant="solid" sx={{ ml: 1 }}>
                        !
                    </Chip>
                )}
            </Box>
        </Box>
    );
}
