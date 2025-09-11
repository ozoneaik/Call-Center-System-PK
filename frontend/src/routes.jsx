import { createBrowserRouter } from "react-router-dom";
import ProtectedLayout from "./Layouts/ProtectedLayout.jsx";
import MainChat from "./Views/ChatPages/main.jsx";
import GuestLayout from "./Layouts/GuestLayout.jsx";
import Login from "./Views/Login.jsx";
import NotFoundPage from "./Views/NotFound.jsx";
import MainLayout from "./Layouts/MainLayout.jsx";
import MessagePane from "./Views/ChatPages/MessagePane/main.jsx";
import ChatRooms from "./Views/ChatRooms.jsx";
import ShortChats from "./Views/shortChats/ShortChats.jsx";
import Customers from "./Views/Customers.jsx";
import CheckAdmin from "./Components/CheckAdmin.jsx";
import TestUi from "./TestUi.jsx";
import ChatHistory from "./Views/ChatHistoryPages/ChatHistory.jsx";
import BotList from "./Views/BotPages/BotList.jsx";
import Users from "./Views/UserPages/main.jsx";
import TokenList from "./Views/TokenPages/TokenList.jsx";
import ReportPage from "./Views/ReportPages/main.jsx";
import AuthPages from "./Views/AuthPages/main.jsx";
import KeyWordPage from "./Views/KeyWordPages/main.jsx";
import MyCasePage from "./Views/MyCasePages/main.jsx";
import SearchNote from "./Views/SearchNotePages/SearchNote.jsx";
import ChatDetail from "./Views/ChatHistoryPages/ChatDetail.jsx";
import HomeNew from "./Views/HomePages/HomeNew.jsx";
import Feedback from "./Views/Feedback.jsx";
import HelpChatList from "./Views/HelpChatPages/HelpChatList.jsx";
import LayoutSeCreate from "./Views/Secret/LayoutSeCreate.jsx";
import StickerList from "./Views/StickerPages/StickerList.jsx";
import AnnouncesList from "./Views/AnnouncePages/AnnouncesList.jsx";
import GroupPage
    from "./Views/TagPages/GroupPage.jsx";
import CreateTagPage from "./Views/TagPages/TagMenu/CreateTagPage.jsx";
import EditTagPage from "./Views/TagPages/TagMenu/EditTagPage.jsx";
import TagPage from "./Views/TagPages/TagMenu/main.jsx";
import CreateGroupPage from "./Views/TagPages/CreateGroupPage.jsx";
import EditGroupPage from "./Views/TagPages/EditGroupPage.jsx";
import TagsByPlatforms from "./Views/platformsTags/TagsByPlatforms.jsx";
import ChatPageNew from "./Views/ChatPagesNew/ChatPageNew.jsx";
export const routes = createBrowserRouter([
    {
        path: '/',
        element: <GuestLayout />,
        children: [
            { path: '/', element: <Login />, },
        ],
    },
    {
        path: '/', element: <MainLayout />, children: [
            {
                path: '/', element: <ProtectedLayout />, children: [
                    { path: 'home', element: <HomeNew /> },
                    {
                        path: '/chat', children: [
                            { path: 'room/:roomId/:roomName', element: <MainChat /> },
                            { path: 'myCase', element: <MyCasePage /> }
                        ]
                    },
                    { path: 'search-notes', element: <SearchNote /> },
                    {
                        path: '/', element: <CheckAdmin />, children: [
                            { path: '/keywords', element: <KeyWordPage /> },
                            { path: '/chatRooms', element: <ChatRooms /> },
                            { path: '/shortChats', element: <ShortChats /> },
                            { path: '/customers', element: <Customers /> },
                            { path: '/users', element: <Users /> },
                            { path: '/accessToken', element: <TokenList /> },
                            { path: '/botManage', element: <BotList /> },
                            
                            { path: '/tags', element: <TagPage /> },
                            { path: '/tags/create', element: <CreateTagPage /> },
                            { path: '/tags/:id/edit', element: <EditTagPage /> },
                            
                            { path: '/tags-by-platforms', element: <TagsByPlatforms /> },

                            { path: '/tags/groups', element: <GroupPage /> },
                            { path: '/tags/groups/create', element: <CreateGroupPage /> },
                            { path: '/tags/groups/:id/edit', element: <EditGroupPage /> },

                            { path: '/helpChat', element: <HelpChatList /> },
                            { path: '/sticker', element: <StickerList /> },
                            { path: '/announces', element: <AnnouncesList /> },
                        ]
                    },
                    { path: '/report', element: <ReportPage /> },
                    { path: '/chatHistory', element: <ChatHistory /> },
                    { path: '/profile', element: <AuthPages /> },

                    {path : '/chat-pages-new', element: <ChatPageNew/>}
                ],
            },
            { path: '/chatHistory/detail/:custId', element: <ChatDetail /> },

            {
                path: '/select', children: [
                    { path: 'message/:rateId/:activeId/:custId/:check', element: <MessagePane /> },
                ]
            },
            { path: '/secret', element: <LayoutSeCreate /> }
        ]
    },
    { path: 'access/denied', element: <NotFoundPage /> },
    { path: 'test', element: <TestUi /> },
    { path: '*', element: <NotFoundPage /> },
    { path: 'feedback/:custId/:rateId', element: <Feedback /> }
])