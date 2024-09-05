import {useEffect, useState} from "react";
import axios from "axios";

const TestPage = () => {
    const [imageUrl, setImageUrl] = useState(null); // ใช้สำหรับเก็บ URL ของรูปภาพที่สร้างจาก Blob

    const ShowImage = () => {
        const url = "https://api-data.line.me/v2/bot/message/524479411290898514/content/preview";
        const parts = url.split('/');
        const messageId = parts[6];
        axios.get(`http://localhost:8000/api/line-image/${messageId}`, {
            responseType: 'blob'
        }).then((res) => {
            const imageBlob = res.data;
            const imageObjectUrl = URL.createObjectURL(imageBlob);
            setImageUrl(imageObjectUrl);
        }).catch((err) => {
            console.error("Error fetching image: ", err);
        });
    };


    return (
        <>
            <button onClick={ShowImage}>Click</button>
            {imageUrl && <img src={imageUrl} alt="LINE Image" />} {/* แสดงรูปภาพเมื่อ imageUrl มีค่า */}
        </>
    );
};

export default TestPage;
