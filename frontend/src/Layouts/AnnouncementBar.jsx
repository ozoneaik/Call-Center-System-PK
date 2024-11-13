import { Typography } from "@mui/joy";

export const AnnouncementBar = () => {
    return (
        <div
            style={{
                backgroundColor: '#f15721', // สีพื้นหลังแถบประกาศ
                padding: '5px 24px', // เพิ่มพื้นที่ด้านในแถบ
                textAlign: 'center', // จัดข้อความให้อยู่ตรงกลาง
                borderBottom: '2px solid #f15721', // เพิ่มขอบล่าง
            }}
        >
            <Typography
                level="h6" // ตั้งระดับของ Typography ให้เหมาะกับการเป็นหัวข้อ
                sx={{
                    color: '#333', // สีข้อความ
                    fontWeight: 'bold', // ตัวหนาเพื่อให้ข้อความเด่นชัด
                    fontSize: '1rem', // ขนาดตัวอักษร
                }}
            >
                ขณะนี้ไลน์ <u>ศูนย์ซ่อม pumpkin</u> หมดโควตาในการส่งข้อความผ่านระบบ หากต้องการคุยกับลูกค้าที่ทักมาจาก ไลน์ <u>ศูนย์ซ่อม pumpkin</u> กรุณาคุยที่ Line OA ขออภัยในความไม่สะดวกครับ
            </Typography>
        </div>
    );
};
