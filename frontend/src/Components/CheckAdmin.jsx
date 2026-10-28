import {Navigate, Outlet, useLocation} from "react-router-dom";
import {useAuth} from "../context/AuthContext.jsx";
import {canAccessPath} from "./adminMenus.js";

// กั้นหน้าเมนูผู้ดูแลระบบ: admin เข้าได้ทุกหน้า, ผู้ใช้ทั่วไปเข้าได้เฉพาะเมนูที่ได้รับอนุญาต (users.admin_menus)
const CheckAdmin = () => {
    const {user} = useAuth();
    const {pathname} = useLocation();

    if (canAccessPath(user, pathname)) {
        return <Outlet/>;
    }
    return <Navigate to="/access/denied" replace/>;
};

export default CheckAdmin;
