import Content from "../../Layouts/Content.jsx";
import MyMessage from "./MyMessage.jsx";
import {useParams} from "react-router-dom";
import {useEffect} from "react";

function ChatPage() {
    const {id} = useParams();
    return (
        <Content>
            <MyMessage id={id}/>
        </Content>
    );
}

export default ChatPage;