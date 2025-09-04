import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import { Box, Sheet, Table } from "@mui/joy";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import { useEffect, useState } from "react";
import { deleteTokenApi, tokenListApi } from "../../Api/Token.js";
import Chip from "@mui/joy/Chip";
import { convertFullDate } from "../../Components/Options.jsx";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CircularProgress from '@mui/joy/CircularProgress';
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import { TokenForm } from "./TokenForm.jsx";


const BreadcrumbsPath = [{ name: 'จัดการ Token' }, { name: 'รายละเอียด' }];

export default function AccessToken() {
    const [tokens, setTokens] = useState([]); // เริ่มต้นด้วย Array ว่าง
    const [newToken, setNewToken] = useState({}); // เริ่มต้นด้วย Object ว่าง
    const [loading, setLoading] = useState(false);

    const getTokens = async () => {
        setLoading(true);
        try {
            const { data, status } = await tokenListApi();
            if (status === 200) {
                setTokens(data.tokens);
            }
        } catch (error) {
            console.error("Failed to fetch tokens:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getTokens();
    }, []);

    const handleEdit = (token) => {
        setNewToken({ ...token }); // นำข้อมูลทั้งหมดมาใส่ใน form
    };

    const handleDelete = (id) => {
        AlertDiaLog({
            icon: "question",
            title: "ยืนยันการลบ",
            text: "กดตกลงเพื่อยืนยันการลบ",
            onPassed: async (confirm) => {
                if (!confirm) {
                    console.log("ไม่ได้กดยืนยันการลบ");
                    return;
                }

                // --- เพิ่ม TRY...CATCH ตรงนี้ ---
                try {
                    const { data, status } = await deleteTokenApi(id);
                    AlertDiaLog({
                        title: data.message,
                        text: data.detail || "ดำเนินการสำเร็จ",
                        icon: "success",
                        onPassed: () => {
                            if (status === 200) {
                                setTokens(tokens.filter((token) => token.id !== id));
                            }
                        },
                    });
                } catch (error) {
                    // แสดงข้อความที่เป็นมิตรกับผู้ใช้
                    AlertDiaLog({
                        title: "เกิดข้อผิดพลาด",
                        text: "ไม่สามารถลบข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
                        icon: "error",
                    });
                }
                // --- สิ้นสุดการแก้ไข ---
            },
        });
    };

    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                </Box>
                <Box sx={ChatPageStyle.BoxTable}>
                    <Typography level="h2" component="h1">
                        จัดการ Token
                    </Typography>
                </Box>
                <TokenForm
                    newToken={newToken}
                    setNewToken={setNewToken}
                    setTokens={setTokens}
                />
                <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
                    <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
                        <thead>
                            <tr>
                                <th style={{ width: 200 }}>ไอดี</th>
                                <th style={{ width: 200 }}>Token</th>
                                <th style={{ width: 200 }}>คำอธิบาย</th>
                                <th style={{ width: 200 }}>Platform</th>
                                <th style={{ width: 200 }}>สร้างเมื่อ</th>
                                <th style={{ width: 200 }}>อัพเดทเมื่อ</th>
                                <th style={{ width: 200 }}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: "center" }}>
                                        <CircularProgress />
                                    </td>
                                </tr>
                            ) : tokens && tokens.length > 0 ? (
                                tokens.map((token) => ( // ไม่ต้องใช้ index ถ้า id ซ้ำกันไม่ได้
                                    <tr key={token.id}>
                                        <td>{token.id}</td>
                                        <td>*****************</td>
                                        <td>{token.description}</td>
                                        <td>
                                            <Chip
                                                color={
                                                    token.platform === "line" ? "success" : "primary"
                                                }
                                            >
                                                {token.platform}
                                            </Chip>
                                        </td>
                                        <td>
                                            <Chip color="primary">
                                                {convertFullDate(token.created_at)}
                                            </Chip>
                                        </td>
                                        <td>
                                            <Chip color="warning">
                                                {convertFullDate(token.updated_at)}
                                            </Chip>
                                        </td>
                                        <td>
                                            <Box sx={{ display: "flex", gap: 1 }}>
                                                <Button
                                                    size="sm"
                                                    color="warning"
                                                    onClick={() => handleEdit(token)}
                                                >
                                                    <EditIcon />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    color="danger"
                                                    onClick={() => handleDelete(token.id)}
                                                >
                                                    <DeleteIcon />
                                                </Button>
                                            </Box>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: "center" }}>
                                        <Chip color="danger">ไม่มีข้อมูล</Chip>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Sheet>
            </Box>
        </Sheet>
    );
}