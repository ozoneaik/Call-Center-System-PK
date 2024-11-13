import { Typography } from "@mui/joy";

export const AnnouncementBar = () => {
    return (
        <div
            style={{
                backgroundColor: '#f15721',
                padding: '5px 24px',
                textAlign: 'center',
                borderBottom: '2px solid #f15721'
            }}
        >
            <Typography
                level="h6"
                sx={{
                    color: '#333',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                }}>
                ขณะนี้ไลน์&nbsp;
                <u>ศูนย์ซ่อม&nbsp;pumpkin</u>
                &nbsp;หมดโควตาในการส่งข้อความผ่านระบบ
                &nbsp;หากต้องการคุยกับลูกค้าที่ทักมาจาก&nbsp;ไลน์
                &nbsp;<u>ศูนย์ซ่อม&nbsp;pumpkin</u>
                &nbsp;กรุณาคุยที่&nbsp;Line&nbsp;OA&nbsp;
                ขออภัยในความไม่สะดวกครับ
            </Typography>
        </div>
    );
};
