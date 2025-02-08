import {createBrowserRouter} from "react-router-dom";
import ProtectedLayout from "./Layouts/ProtectedLayout.jsx";
import MainChat from "./Views/ChatPages/main.jsx";
import GuestLayout from "./Layouts/GuestLayout.jsx";
import Login from "./Views/Login.jsx";
import NotFoundPage from "./Views/NotFound.jsx";
import MainLayout from "./Layouts/MainLayout.jsx";
import MessagePane from "./Views/ChatPages/MessagePane/main.jsx";
import Home from "./Views/HomePages/Home.jsx";
import ChatRooms from "./Views/ChatRooms.jsx";
import ShortChats from "./Views/shortChats/ShortChats.jsx";
import Customers from "./Views/Customers.jsx";
import CheckAdmin from "./Components/CheckAdmin.jsx";
import TestUi from "./TestUi.jsx";
import ChatHistory from "./Views/ChatHistoryPages/ChatHistory.jsx";
import BotPage from "./Views/BotPages/main.jsx";
import TagePage from "./Views/TagPages/main.jsx";
import Users from "./Views/UserPages/main.jsx";
import AccessToken from "./Views/TokenPages/main.jsx";
import ReportPage from "./Views/ReportPages/main.jsx";
import AuthPages from "./Views/AuthPages/main.jsx";
import KeyWordPage from "./Views/KeyWordPages/main.jsx";
import MyCasePage from "./Views/MyCasePages/main.jsx";
import SearchNote from "./Views/SearchNotePages/SearchNote.jsx";

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
                            {path: 'room/:roomId/:roomName', element: <MainChat/>},
                            {path: 'myCase', element: <MyCasePage/>}
                        ]
                    },
                    {path : 'search-notes', element : <SearchNote/>},
                    {
                        path: '/', element: <CheckAdmin/>, children: [
                            {path: '/keywords', element: <KeyWordPage/>},
                            {path: '/chatRooms', element: <ChatRooms/>},
                            {path: '/shortChats', element: <ShortChats/>},
                            {path: '/customers', element: <Customers/>},
                            {path: '/users', element: <Users/>},
                            {path: '/accessToken', element: <AccessToken/>},
                            {path : '/botManage', element: <BotPage/>},
                            {path : '/tags', element: <TagePage/>},
                        ]
                    },
                    {path: '/chatHistory', element: <ChatHistory/>},
                    {path : '/profile', element : <AuthPages/>}
                ]
            },
            {path: '/report' , element : <ReportPage/>},
            {
                path: '/select', children: [
                    {path: 'message/:rateId/:activeId/:custId/:check', element: <MessagePane/>},
                ]
            }
        ]
    },
    {path: 'access/denied', element: <NotFoundPage/>},
    {path: 'test', element: <TestUi/>},
    {path: '*', element: <NotFoundPage/>}
])