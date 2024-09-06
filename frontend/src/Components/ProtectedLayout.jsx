import {Outlet} from "react-router-dom";
import {useAuth} from "../Contexts/AuthContext.jsx";
import {useEffect} from "react";
import axiosClient from "../Axios.js";
import {ProfileApi} from "../Api/Auth.js";

function ProtectedLayout() {
    console.log("ProtectedLayout rendered");
    const {setUser} = useAuth();

    useEffect(() => {
        console.log('ProtectedLayout useEffect triggered');
        (async () => {
            try {
                const {data,status} = await ProfileApi();
                if (status === 200) {
                    setUser(data.user);
                    return (
                        <div>
                            <Outlet/>
                        </div>
                    );
                } else {
                    window.location.href = "/login";
                }
            } catch (error) {
                alert(error.response.status);
                if (error.response.status === 401) {
                    localStorage.removeItem('user');
                    window.location.href = "/login";
                }
            }
        })()
    }, []);

    return (
        <div>
            <Outlet/>
        </div>
    );

}

export default ProtectedLayout;