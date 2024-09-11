import {createBrowserRouter} from "react-router-dom";
import GuestLayout from "../Components/GuestLayout.jsx";
import Login from "../Views/Login.jsx";
import Register from "../Views/Register.jsx";
import ProtectedLayout from "../Components/ProtectedLayout.jsx";
import HomePage from "../Views/HomePage/page.jsx";
import NotFoundPage from "../Views/NotFoundPage/page.jsx";
import App from "../App.jsx";
import ChatPage from "../Views/ChatPage/page.jsx";
import TestPage from "../Views/Test/page.jsx";
import CustomerListPage from "../Views/CustomerPage/page.jsx";
import UserListTable from "../Views/UserPage/page.jsx";
import CustomerDetail from "../Views/CustomerPage/CustomerDetail.jsx";
import UserDetail from "../Views/UserPage/UserDetail.jsx";
import CustDmPage from "../Views/NewCustDmPage/page.jsx";

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
                path: '/chats', children: [
                    {path : 'cust-dm-message',element: <CustDmPage/>},
                    {path: 'room/:id', element: <ChatPage/>},
                ]
            },
            {
                path: '/customer', children: [
                    {path: 'list', element: <CustomerListPage/>},
                    {path: 'detail/:custId', element: <CustomerDetail/>}
                ]
            },
            {
                path: '/user', children: [
                    {path: 'list', element: <UserListTable/>},
                    {path: 'detail/:custId', element: <UserDetail/>}
                ]
            }
        ],
    },
    {path: '/test/:id', element: <TestPage/>},
    {path: '*', element: <NotFoundPage/>}
])