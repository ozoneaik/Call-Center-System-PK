import {
    Box,
    IconButton,
    Sheet,
    Table,
    Typography,
    Modal,
    ModalDialog,
    List,
    ListItem,
    Input,
    Divider,
    Chip,
    Tooltip,
} from "@mui/joy";
import DescriptionIcon from "@mui/icons-material/Description";
import InventoryIcon from "@mui/icons-material/Inventory";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useState } from "react";
import axiosClient from "../../../Axios";

export default function TagWorkloadTable({ rows }) {
    const [open, setOpen] = useState(false);
    const [skuList, setSkuList] = useState([]);
    const [selectedTag, setSelectedTag] = useState("");
    const [search, setSearch] = useState("");

    const handleOpenSku = async (row) => {
        try {
            const { data } = await axiosClient.get(
                `/home/user-case/tag/${encodeURIComponent(row.tag)}/descriptions`
            );
            setSkuList(data.descriptions || []);
            setSelectedTag(row.tag);
            setOpen(true);
        } catch (err) {
            console.error("❌ load descriptions failed", err);
        }
    };

    const filteredSku = skuList.filter((d) =>
        d.toLowerCase().includes(search.toLowerCase())
    );

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <Sheet sx={{ mt: 3 }}>
            <Typography level="h5" sx={{ fontWeight: "bold", mb: 1 }}>
                ปริมาณปิดงาน ตาม Tag
            </Typography>
            <Box sx={{ overflowX: "auto" }}>
                <Table hoverRow variant="outlined" sx={{ minWidth: 1100 }}>
                    <thead>
                        <tr>
                            <th style={{ width: "40px", textAlign: "center" }}>#</th>
                            <th style={{ textAlign: "left" }}>Tag</th>
                            <th style={{ textAlign: "left" }}>Tag Group</th>
                            <th style={{ textAlign: "center" }}>คิดเป็น (%)</th>
                            <th style={{ textAlign: "center" }}>งานทั้งหมด</th>
                            <th style={{ textAlign: "center" }}>1-5 นาที</th>
                            <th style={{ textAlign: "center" }}>5-10 นาที</th>
                            <th style={{ textAlign: "center" }}>มากกว่า 10 นาที</th>
                            <th style={{ textAlign: "center" }}>Action</th>
                            <th style={{ textAlign: "center" }}>SKU Descriptions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={`${row.tag}-${row.tag_group}`}>
                                <td style={{ textAlign: "center" }}>{index + 1}</td>
                                <td style={{ textAlign: "left" }}>{row.tag}</td>
                                <td style={{ textAlign: "left" }}>{row.tag_group}</td>
                                <td style={{ textAlign: "center" }}>{row.percent}%</td>
                                <td style={{ textAlign: "center" }}>{row.total}</td>
                                <td style={{ textAlign: "center" }}>{row.min1to5}</td>
                                <td style={{ textAlign: "center" }}>{row.min5to10}</td>
                                <td style={{ textAlign: "center" }}>{row.over10}</td>
                                <td style={{ textAlign: "center" }}>
                                    <IconButton
                                        variant="soft"
                                        color="neutral"
                                        onClick={() => row.onClickDetail(row)}
                                    >
                                        <DescriptionIcon />
                                    </IconButton>
                                </td>
                                <td style={{ textAlign: "center" }}>
                                    {row.is_product_code && (
                                        <IconButton
                                            variant="soft"
                                            color="primary"
                                            onClick={() => handleOpenSku(row)}
                                        >
                                            <InventoryIcon />
                                        </IconButton>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Box>

            {/* ✅ Modal แสดงรหัสสินค้า */}
            <Modal open={open} onClose={() => setOpen(false)}>
                <ModalDialog sx={{ minWidth: 700, maxHeight: "80vh", overflowY: "auto" }}>
                    <Typography level="h4" mb={1}>
                        🔖 รายการ Description (SKU) ของ Tag:{" "}
                        <Chip color="primary" size="sm">{selectedTag}</Chip>
                    </Typography>

                    <Input
                        placeholder="ค้นหา SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ mb: 2 }}
                    />

                    <Divider />

                    {filteredSku.length > 0 ? (
                        <List sx={{ mt: 1 }}>
                            {filteredSku.map((desc, i) => (
                                <ListItem
                                    key={i}
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        borderBottom: "1px solid #eee",
                                        py: 1,
                                    }}
                                >
                                    <Typography level="body-md">{desc}</Typography>
                                    <Tooltip title="Copy">
                                        <IconButton
                                            size="sm"
                                            variant="outlined"
                                            color="neutral"
                                            onClick={() => handleCopy(desc)}
                                        >
                                            <ContentCopyIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography level="body-sm" color="neutral" sx={{ mt: 2 }}>
                            ❌ ไม่มี description ที่ match SKU
                        </Typography>
                    )}
                </ModalDialog>
            </Modal>
        </Sheet>
    );
}
