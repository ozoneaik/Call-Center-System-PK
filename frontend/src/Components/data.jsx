// ลูกค้า
export const customers = [
    {
        custId: 'Ueecf3a08fa18b3864d2d7f50e70933f4',
        name: 'ร้านอุ้งอิ้ง',
        description: '@คุยไม่ค่อยรู้เรื่อง',
        avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/640px-User_icon_2.svg.png',
        online: true,
        platform: 'line',
        roomId: 1
    },
];

// พนักงานที่ต้องตอบแชท
export const users = [
    {
        id: 1,
        code : '70010',
        name: 'employee (mechanic)',
        description: '@พนักงานช่าง',
        email : 'test@gmail.com',
        avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/640px-User_icon_2.svg.png',
        rooms: [1,2,4,1],
        role : 'mechanic',
    }
];


// ข้อมูลแชท
export const chats = [
    {
        id: 1,
        sender: customers[0],
        messages: [
            {
                id: 1,
                content: "สวัสดีครับ",
                contentType: 'text',
                timestamp: '10:10 AM',
                sender: customers[0],
                platform: 'line',
                attachment : {
                    fileName: 'Tech requirements.pdf',
                    type: 'pdf',
                    size: '1.2 MB',
                }
            },
            {
                id: 2,
                content: "สวัสดีครับ",
                contentType: 'text',
                timestamp: '10:09 PM',
                sender: 'You',
                platform: 'line',
            },
        ],
    },
];