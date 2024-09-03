import React, { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import { MessageAllAPi } from "../../Api/sendMessage.js";

const TestPage = () => {
    const [messages, setMessages] = useState([]); // ประกาศ state สำหรับเก็บข้อมูลแชท
    const { id } = useParams(); // ดึงค่า id ของห้องแชทจากพารามิเตอร์ของ URL

    useEffect(() => {
        listMessage(); // เรียกฟังก์ชันเมื่อคอมโพเนนต์ถูก mount
    }, []); // ใส่ [] เพื่อให้ useEffect ทำงานครั้งเดียวเมื่อ mount

    const listMessage = async () => {
        try {
            const { data, status } = await MessageAllAPi(); // เรียก API เพื่อดึงข้อมูลแชท
            console.log(data, status); // แสดงข้อมูลและสถานะที่ได้รับจาก API ใน console
            setMessages(data); // เก็บข้อมูลแชทใน state messages
        } catch (error) {
            console.error('Failed to fetch messages:', error); // แสดงข้อผิดพลาดถ้ามีปัญหาในการเรียก API
        }
    }

    return (
        <div>
            <h3>Id Room Chat: {id}</h3> {/* แสดง id ของห้องแชท */}
            {/*<div>*/}
            {/*    {messages.map((msg, index) => (*/}
            {/*        <div key={index}>Message ID: {msg.id}</div> // แสดงข้อมูล id ของแต่ละข้อความแชท*/}
            {/*    ))}*/}
            {/*</div>*/}
        </div>
    );
};

export default TestPage;
