import {Navigate, Outlet} from "react-router-dom";
import {useAuth} from "../context/AuthContext.jsx"; // สมมุติว่ามี useAuth ที่ดึงข้อมูล user จาก context

const CheckAdmin = () => {
    const {user} = useAuth(); // สมมุติว่ามี user.role ใน context

    // ถ้าผู้ใช้มี role ที่อยู่ใน allowedRoles ให้แสดง Outlet
    if (user.role === 'admin') {
        return <Outlet/>;
    }
    // ถ้าไม่มี role ที่ถูกต้อง ให้เปลี่ยนเส้นทางไปหน้าอื่น เช่น หน้า forbidden หรือ login
    return <Navigate to="/access/denied" replace/>;
};

export default CheckAdmin;
