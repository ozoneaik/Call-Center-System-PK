import { Typography } from "@mui/joy";

export const AnnouncementBar = ({item}) => {
    return (
        <div
            style={{
                position: 'sticky',
                top : 0,
                zIndex: 1000,
                backgroundColor: '#f15721',
                padding: '5px 24px',
                textAlign: 'center',
                borderBottom : '2px solid black',
            }}
        >
            <Typography
                level="h6"
                sx={{
                    color: '#333',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                }}>
                {item.detail_text}
            </Typography>
        </div>
    );
};
