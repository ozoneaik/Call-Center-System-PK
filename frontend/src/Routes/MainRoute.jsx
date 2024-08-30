import {createBrowserRouter} from "react-router-dom";
import GuestLayout from "../Components/GuestLayout.jsx";
import Login from "../Views/Login.jsx";
import Register from "../Views/Register.jsx";
import ProtectedLayout from "../Components/ProtectedLayout.jsx";
import HomePage from "../Views/HomePage/page.jsx";
import NotFoundPage from "../Views/NotFoundPage/page.jsx";
import App from "../App.jsx";
import ChatPage from "../Views/ChatPage/page.jsx";
import MyMessage from "../Views/ChatPage/MyMessage.jsx";
import TestPage from "../Views/Test/page.jsx";

export const route = createBrowserRouter([
    {path: '/', element: <App/>},
    {
        path: '/', element: <GuestLayout/>, children: [
            {path: '/login', element: <Login/>},
            {path: '/register', element: <Register/>},
        ],
    },
    {
        path: '/', element: <ProtectedLayout/>, children: [
            {path: '/home', element: <HomePage/>},
            {
                path: '/chats', element: <ChatPage/>, children: [
                    {path: ':id', element: <MyMessage/>},
                ]
            }
        ],
    },
    {path: '/test/:id', element: <TestPage/>},
    {path: '*', element: <NotFoundPage/>}
])