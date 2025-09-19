import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import {
    Box,
    Button,
    CircularProgress,
    Sheet,
    Table,
    Typography,
    Chip,
    Select,
    Option,
    Stack,
} from "@mui/joy";
import { useEffect, useState } from "react";
import { botListApi } from "../../Api/BotMenu.js";
import { FormCreateOrUpdateBot } from "./form.jsx";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";

const BreadcrumbsPath = [{ name: "จัดการเมนูบอท" }, { name: "รายละเอียด" }];

export default function BotList() {
    const [loading, setLoading] = useState(true);
    const [bots, setBots] = useState([]);
    const [chatRooms, setChatRooms] = useState([]);
    const [selected, setSelected] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [filterPlatform, setFilterPlatform] = useState("all");

    useEffect(() => {
        fetchData().finally(() => setLoading(false));
    }, []);

    const fetchData = async () => {
        const { data, status } = await botListApi();
        status === 200 ? setBots(data.list) : setBots([]);
        status === 200 ? setChatRooms(data.chatRooms) : setChatRooms([]);
    };

    const filteredBots =
        filterPlatform === "all"
            ? bots
            : bots.filter((bot) => bot.platform === filterPlatform);

    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                {/* Breadcrumb */}
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                </Box>

                {/* Title + Filter */}
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 2 }}
                >
                    <Typography level="h2" component="h1">
                        จัดการเมนูบอท
                    </Typography>
                    <Select
                        size="sm"
                        value={filterPlatform}
                        onChange={(e, newValue) => setFilterPlatform(newValue)}
                        sx={{ minWidth: 200 }}
                    >
                        <Option value="all">ทั้งหมด</Option>
                        <Option value="shopee">Shopee</Option>
                        <Option value="lazada">Lazada</Option>
                        <Option value="line">Line</Option>
                        <Option value="facebook">Facebook</Option>
                        <Option value="tiktok">TikTok</Option>
                    </Select>
                </Stack>

                {showForm && (
                    <Sheet
                        variant="outlined"
                        sx={[ChatPageStyle.BoxSheet, { border: "none", mb: 2 }]}
                    >
                        <FormCreateOrUpdateBot
                            showForm={showForm}
                            setShowForm={setShowForm}
                            setBots={setBots}
                            chatRooms={chatRooms}
                            selected={selected}
                            setSelected={setSelected}
                        />
                    </Sheet>
                )}

                {/* Table */}
                <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
                    {!loading ? (
                        filteredBots.length > 0 ? (
                            <Table stickyHeader hoverRow borderAxis="bothBetween" sx={{ minWidth: 700 }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: 60 }}>#</th>
                                        <th style={{ width: 180 }}>แพลตฟอร์ม</th>
                                        <th style={{ width: 200 }}>ชื่อบอท</th>
                                        <th>เมนู</th>
                                        <th style={{ width: 120, textAlign: "center" }}>จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBots.map((bot, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <Chip
                                                    size="sm"
                                                    variant="soft"
                                                    color={
                                                        bot.platform === "shopee"
                                                            ? "warning"
                                                            : bot.platform === "lazada"
                                                                ? "primary"
                                                                : bot.platform === "line"
                                                                    ? "success"
                                                                    : bot.platform === "facebook"
                                                                        ? "neutral"
                                                                        : bot.platform === "tiktok"
                                                                            ? "danger"
                                                                            : "neutral"
                                                    }
                                                >
                                                    {bot.platform}
                                                </Chip>
                                            </td>
                                            <td>
                                                <SupportAgentIcon
                                                    style={{ verticalAlign: "middle", marginRight: 8 }}
                                                />
                                                {bot.description}
                                            </td>
                                            <td>
                                                {bot.list.length > 0 ? (
                                                    bot.list.map((b, i) => (
                                                        <Typography key={i} level="body-sm" sx={{ display: "block" }}>
                                                            {i + 1}. {b.menuName}
                                                        </Typography>
                                                    ))
                                                ) : (
                                                    <Typography level="body-sm" color="neutral">
                                                        ไม่มีรายการ
                                                    </Typography>
                                                )}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                <Button
                                                    variant="solid"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelected(bot);
                                                        setShowForm(true);
                                                    }}
                                                >
                                                    จัดการ
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        ) : (
                            <Typography level="body-md" sx={{ textAlign: "center", p: 2 }}>
                                ไม่พบข้อมูลบอท
                            </Typography>
                        )
                    ) : (
                        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                            <CircularProgress />
                        </Box>
                    )}
                </Sheet>
            </Box>
        </Sheet>
    );
}