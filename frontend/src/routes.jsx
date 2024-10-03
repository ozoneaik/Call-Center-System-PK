import {createBrowserRouter} from "react-router-dom";
import ProtectedLayout from "./layouts/ProtectedLayout.jsx";
import MainChat from "./views/ChatPages/MainChat.jsx";
import GuestLayout from "./layouts/GuestLayout.jsx";
import Login from "./views/Login.jsx";
import NotFoundPage from "./views/NotFound.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import MessagePane from "./views/ChatPages/MessagePane.jsx";
import Home from "./views/Home.jsx";
import ChatRooms from "./Views/ChatRooms.jsx";
import ShortChats from "./Views/ShortChats.jsx";
import Customers from "./Views/Customers.jsx";
import Users from "./Views/Users.jsx";
import CheckAdmin from "./Components/CheckAdmin.jsx";

export const routes = createBrowserRouter([
    {
        path: '/',
        element: <GuestLayout/>,
        children: [
            {path: '/', element: <Login/>,},
        ],
    },
    {
        path: '/', element: <MainLayout/>, children: [
            {
                path: '/', element: <ProtectedLayout/>, children: [
                    {path: 'home', element: <Home/>},
                    {
                        path: '/chat', children: [
                            {path: 'room/:roomId/:roomName', element: <MainChat/>,},
                        ]
                    },
                    {
                        path: '/', element: <CheckAdmin/>, children: [
                            {path: '/chatRooms', element: <ChatRooms/>},
                            {path: '/shortChats', element: <ShortChats/>},
                            {path: '/customers', element: <Customers/>},
                            {path: '/users', element: <Users/>},
                        ]
                    },
                ]
            },
            {
                path: '/select', children: [
                    {path: 'message/:rateId/:activeId/:custId', element: <MessagePane/>},
                ]
            }
        ]
    },
    {path: 'access/denied', element: <NotFoundPage/>},
    {path: '*', element: <NotFoundPage/>}
])