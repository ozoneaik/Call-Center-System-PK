import { ChatPageStyle } from "../styles/ChatPageStyle.js";
import {
    Box,
    Button,
    CircularProgress,
    FormControl,
    FormLabel,
    Grid,
    Input,
    Sheet,
    Table,
    Typography,
    Card,
    CardContent,
    Divider,
} from "@mui/joy";
import BreadcrumbsComponent from "../Components/Breadcrumbs.jsx";
import { useEffect, useState } from "react";
import {
    chatRoomListApi,
    deleteChatRoomsApi,
    storeOrUpdateChatRoomsApi,
} from "../Api/ChatRooms.js";
import SaveIcon from "@mui/icons-material/Save";
import EditNoteIcon from "@mui/icons-material/EditNote";
import DeleteIcon from "@mui/icons-material/Delete";
import { AlertDiaLog } from "../Dialogs/Alert.js";
import { useChatRooms } from "../context/ChatRoomContext.jsx";

const BreadcrumbsPath = [{ name: "จัดการห้องแชท" }, { name: "รายละเอียด" }];

export default function ChatRooms() {
    const { setChatRoomsContext } = useChatRooms();
    const [chatRooms, setChatRooms] = useState([]);
    const [selected, setSelected] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getChatRooms().finally(() => setLoading(false));
    }, []);

    const getChatRooms = async () => {
        setLoading(true);
        const { data, status } = await chatRoomListApi();
        if (status === 200) {
            setChatRooms(data.chatRooms);
            setChatRoomsContext(data.chatRooms);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        AlertDiaLog({
            icon: "question",
            title: "ยืนยันการสร้าง/อัพเดทข้อมูล",
            text: "กด ตกลง เพื่อยืนยัน",
            onPassed: async (confirm) => {
                if (confirm) {
                    const { data, status } = await storeOrUpdateChatRoomsApi(selected);
                    AlertDiaLog({
                        icon: status === 200 && "success",
                        title: data.message,
                        text: data.detail,
                        onPassed: () => {
                            if (status === 200) {
                                setSelected({});
                                getChatRooms().finally(() => {
                                    setLoading(false);
                                });
                            }
                        },
                    });
                }
            },
        });
    };

    const handleDelete = (roomId) => {
        AlertDiaLog({
            icon: "question",
            title: "ลบ",
            text: "กด ตกลง เพื่อยืนยัน",
            onPassed: async (confirm) => {
                if (confirm) {
                    const { data, status } = await deleteChatRoomsApi(roomId);
                    AlertDiaLog({
                        icon: status === 200 && "success",
                        title: data.message,
                        text: data.detail,
                        onPassed: () => {
                            if (status === 200) {
                                setSelected({});
                                getChatRooms().finally(() => setLoading(false));
                            }
                        },
                    });
                }
            },
        });
    };

    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                </Box>

                <Grid container spacing={2}>
                    {/* Add/Edit Form */}
                    <Grid xs={12} md={4}>
                        <Card variant="outlined" sx={{ height: "100%" }}>
                            <CardContent>
                                <Typography level="h3" sx={{ mb: 2 }}>
                                    {selected.roomId ? "แก้ไขห้องแชท" : "เพิ่มห้องแชท"}
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <form onSubmit={handleSubmit}>
                                    {selected.roomId && (
                                        <FormControl sx={{ mb: 2 }}>
                                            <FormLabel>รหัสห้อง</FormLabel>
                                            <Input
                                                value={selected.roomId || ""}
                                                disabled
                                                placeholder="ex. ROOM01"
                                            />
                                        </FormControl>
                                    )}

                                    <FormControl sx={{ mb: 2 }}>
                                        <FormLabel>ชื่อห้อง</FormLabel>
                                        <Input
                                            value={selected.roomName || ""}
                                            onChange={(e) =>
                                                setSelected((prev) => ({
                                                    ...prev,
                                                    roomName: e.target.value,
                                                }))
                                            }
                                            placeholder="ex. ห้องประสานงาน"
                                        />
                                    </FormControl>

                                    <Box sx={{ display: "flex", gap: 1 }}>
                                        <Button
                                            color="neutral"
                                            variant="soft"
                                            disabled={!selected.roomName}
                                            onClick={() => setSelected({})}
                                        >
                                            ล้าง
                                        </Button>
                                        <Button
                                            type="submit"
                                            startDecorator={<SaveIcon />}
                                            disabled={!selected.roomName}
                                        >
                                            {selected.roomId ? "อัพเดท" : "สร้าง"}
                                        </Button>
                                    </Box>
                                </form>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Chat Room List Table */}
                    <Grid xs={12} md={8}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography level="h3" sx={{ mb: 2 }}>
                                    รายการห้องแชท
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Box sx={{ maxHeight: "80vh", overflowY: "auto" }}>
                                    <Table
                                        stickyHeader
                                        hoverRow
                                        borderAxis="bothBetween"
                                        sx={{ minWidth: 600 }}
                                    >
                                        <thead>
                                            <tr>
                                                <th>ไอดีห้อง</th>
                                                <th>ชื่อห้อง</th>
                                                <th style={{ width: 120, textAlign: "center" }}>จัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {!loading ? (
                                                chatRooms.length > 0 ? (
                                                    chatRooms.map((chatRoom, index) => (
                                                        <tr key={index}>
                                                            <td>{chatRoom.roomId}</td>
                                                            <td>{chatRoom.roomName}</td>
                                                            <td>
                                                                <Box
                                                                    sx={{
                                                                        display: "flex",
                                                                        justifyContent: "center",
                                                                        gap: 1,
                                                                    }}
                                                                >
                                                                    <Button
                                                                        size="sm"
                                                                        variant="soft"
                                                                        onClick={() => setSelected(chatRoom)}
                                                                        disabled={
                                                                            chatRoom.roomId === "ROOM00" ||
                                                                            chatRoom.roomId === "ROOM02"
                                                                        }
                                                                    >
                                                                        <EditNoteIcon />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        color="danger"
                                                                        variant="solid"
                                                                        onClick={() => handleDelete(chatRoom.roomId)}
                                                                        disabled={
                                                                            chatRoom.roomId === "ROOM00" ||
                                                                            chatRoom.roomId === "ROOM02"
                                                                        }
                                                                    >
                                                                        <DeleteIcon />
                                                                    </Button>
                                                                </Box>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={3} style={{ textAlign: "center" }}>
                                                            <Typography level="body-md">
                                                                ไม่พบข้อมูลห้องแชท
                                                            </Typography>
                                                        </td>
                                                    </tr>
                                                )
                                            ) : (
                                                <tr>
                                                    <td colSpan={3} style={{ textAlign: "center" }}>
                                                        <CircularProgress color="primary" size="md" />
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Sheet>
    );
}
