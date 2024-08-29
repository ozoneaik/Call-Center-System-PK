import './App.css'
import {useEffect} from "react";
import {useAuth} from "./Contexts/AuthContext.jsx";
import {Navigate} from "react-router-dom";
function App() {
    const {user} = useAuth();
        if (!user) {
            return <Navigate to={'/login'}/>
        }
    return <Navigate to={'/home'}/>
}

export default App
