import {createBrowserRouter} from "react-router-dom";
import App from "./App.jsx";
import ProtectedLayout from "./layouts/ProtectedLayout.jsx";
import MainChat from "./views/ChatPages/MainChat.jsx";
import GuestLayout from "./layouts/GuestLayout.jsx";
import Login from "./views/Login.jsx";
import NotFoundPage from "./views/NotFound.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import MessagePane from "./views/ChatPages/MessagePane.jsx";
import Home from "./views/Home.jsx";
import ChatRoomMain from "./Views/ChatRoomPages/ChatRoomMain.jsx";

export const routes = createBrowserRouter([
    {
        path: '/',
        element: <GuestLayout />,
        children: [
            {path: '/', element: <Login />,},
        ],
    },
    {
        path : '/' ,element : <MainLayout/>, children : [
            {
                path: '/', element: <ProtectedLayout/>, children: [
                    {path: 'home', element: <Home/>},
                    {
                        path: '/chat', children: [
                            {path: 'room/:roomId/:roomName', element: <MainChat/>,},
                        ]
                    },
                    {path: '/chatRooms',element: <ChatRoomMain/>}
                ]
            },
            {
                path: '/select', children: [
                    {path : 'message/:rateId/:activeId/:custId', element : <MessagePane/>},
                ]
            }
        ]
    },

    {path : '*' , element : <NotFoundPage/>}
])