import { useEffect, useState } from "react";
import axiosClient from "../../Axios";
import { ChatPageStyle } from "../../styles/ChatPageStyle";
import { Box, Sheet } from "@mui/joy";
import BreadcrumbsComponent from "../../Components/Breadcrumbs";
const BreadcrumbsPath = [{ name: "จัดการแท็กตามแพลตฟอร์ม" }, { name: "รายละเอียด" }];

export default function TagsByPlatforms() {
    const [records, setRecords] = useState([]);
    const [platforms, setPlatforms] = useState([]);
    const [tags, setTags] = useState([]);
    const [form, setForm] = useState({ platform_name: "", tag_id: "" });
    const [editingId, setEditingId] = useState(null);
    const [filterPlatform, setFilterPlatform] = useState("");
    const [filterTag, setFilterTag] = useState("");

    const fetchData = (platform = "", tag = "") => {
        const params = {};
        if (platform) params.platform_name = platform;
        if (tag) params.tag_id = tag;

        axiosClient.get("tags-by-platform", { params }).then((res) => {
            setRecords(res.data.data ?? []);
        });
    };

    const fetchPlatforms = () => {
        axiosClient.get("tags-by-platform/platforms").then((res) => {
            setPlatforms(res.data.data ?? []);
        });
    };

    const fetchTags = (platformName = "") => {
        axiosClient
            .get("tags-by-platform/tags", {
                params: { platform_name: platformName },
            })
            .then((res) => {
                setTags(res.data.data ?? []);
            });
    };

    useEffect(() => {
        fetchData();
        fetchPlatforms();
        fetchTags();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                const res = await axiosClient.put(
                    `tags-by-platform/${editingId}`,
                    form,
                    { headers: { "Content-Type": "application/json" } }
                );
                alert(res.data.message);
            } else {
                const res = await axiosClient.post(
                    "tags-by-platform",
                    form,
                    { headers: { "Content-Type": "application/json" } }
                );
                alert(res.data.message);
            }
            setForm({ platform_name: "", tag_id: "" });
            setEditingId(null);
            fetchData(filterPlatform);
        } catch (error) {
            if (error.response && error.response.status === 409) {
                alert(error.response.data.message);
            } else if (error.response && error.response.status === 422) {
                console.error("Validation Error:", error.response.data.errors);
                alert("กรุณากรอกข้อมูลให้ครบ");
            } else {
                console.error("เกิดข้อผิดพลาด:", error);
                alert("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
            }
        }
    };

    const handleEdit = (record) => {
        setForm({ platform_name: record.platform_name, tag_id: record.tag_id });
        setEditingId(record.id);
        fetchTags(record.platform_name);
    };

    const handleDelete = async (id) => {
        if (window.confirm("คุณต้องการลบข้อมูลนี้ใช่หรือไม่?")) {
            await axiosClient.delete(`tags-by-platform/${id}`);
            fetchData(filterPlatform);
        }
    };

    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                </Box>
                <div>
                    <h2 style={{ paddingTop: "5px", paddingBottom: "5px" }}>
                        จัดการแท็กตามแพลตฟอร์ม
                    </h2>
                    <form
                        onSubmit={handleSubmit}
                        style={{
                            marginBottom: "10px",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "15px",
                        }}
                    >
                        <fieldset
                            style={{
                                flex: "1 1 300px",
                                border: "1px solid #ccc",
                                padding: "10px",
                                minWidth: "280px",
                            }}
                        >
                            <legend style={{ padding: "0 10px" }}>สร้าง</legend>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                                {/* <select
                                    value={form.platform_name}
                                    onChange={(e) => {
                                        const platform = e.target.value;
                                        setForm({
                                            ...form,
                                            platform_name: platform,
                                            tag_id: "",
                                        });
                                        fetchTags(platform);
                                    }}
                                    required
                                    style={{ flex: "1 1 150px", padding: "8px" }}
                                >
                                    <option value="">เลือกแพลตฟอร์ม</option>
                                    {platforms.map((p, i) => (
                                        <option key={i} value={p.platform}>
                                            {p.platform}
                                        </option>
                                    ))}
                                </select> */}
                                <select
                                    value={form.platform_name}
                                    onChange={(e) => {
                                        const platform = e.target.value;
                                        setForm({
                                            ...form,
                                            platform_name: platform,
                                            tag_id: "",
                                        });
                                        fetchTags(platform);
                                    }}
                                    required
                                    style={{
                                        width: "auto",       
                                        minWidth: "120px",   
                                        maxWidth: "180px",   
                                        padding: "6px 8px"
                                    }}
                                >
                                    <option value="">เลือกแพลตฟอร์ม</option>
                                    {platforms.map((p, i) => (
                                        <option key={i} value={p.platform}>
                                            {p.platform}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={form.tag_id}
                                    onChange={(e) =>
                                        setForm({ ...form, tag_id: e.target.value })
                                    }
                                    required
                                    style={{ flex: "1 1 150px", padding: "8px" }}
                                >
                                    <option value="">เลือกแท็คเมนู</option>
                                    {tags.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.id} - {t.tagName}
                                        </option>
                                    ))}
                                </select>

                                <button
                                    type="submit"
                                    style={{ flex: "1 1 100px", padding: "8px 15px" }}
                                >
                                    {editingId ? "อัปเดต" : "เพิ่ม"}
                                </button>
                            </div>
                        </fieldset>

                        <fieldset
                            style={{
                                flex: "1 1 300px",
                                border: "1px solid #ccc",
                                padding: "10px",
                                minWidth: "280px",
                            }}
                        >
                            <legend style={{ padding: "0 10px" }}>กรอง</legend>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                                <select
                                    value={filterPlatform}
                                    onChange={(e) => {
                                        setFilterPlatform(e.target.value);
                                        fetchData(e.target.value, filterTag);
                                    }}
                                    style={{ flex: "1 1 150px", padding: "8px" }}
                                >
                                    <option value="">ทั้งหมด (แพลตฟอร์ม)</option>
                                    {platforms.map((p, i) => (
                                        <option key={i} value={p.platform}>
                                            {p.platform}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={filterTag}
                                    onChange={(e) => {
                                        setFilterTag(e.target.value);
                                        fetchData(filterPlatform, e.target.value);
                                    }}
                                    style={{ flex: "1 1 150px", padding: "8px" }}
                                >
                                    <option value="">ทั้งหมด (แท็ก)</option>
                                    {tags.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.id} - {t.tagName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </fieldset>
                    </form>
                    <div style={{ width: "100%", overflowX: "auto" }}>
                        <table
                            border="1"
                            cellPadding="10"
                            style={{
                                minWidth: "800px",
                                borderCollapse: "collapse",
                                width: "100%",
                            }}
                        >
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Platform Name</th>
                                    <th>Tag ID</th>
                                    <th>Tag Name</th>
                                    <th>Created At</th>
                                    <th>Updated At</th>
                                    <th>การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.length > 0 ? (
                                    records.map((row) => (
                                        <tr key={row.id}>
                                            <td style={{ textAlign: "center" }}>{row.id}</td>
                                            <td style={{ textAlign: "center" }}>
                                                {row.platform_name}
                                            </td>
                                            <td style={{ textAlign: "center" }}>{row.tag_id}</td>
                                            <td style={{ textAlign: "center" }}>{row.tagName}</td>
                                            <td style={{ textAlign: "center" }}>
                                                {row.created_at}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                {row.updated_at}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                <button
                                                    onClick={() => handleEdit(row)}
                                                    style={{
                                                        padding: "5px 10px",
                                                        marginRight: "5px",
                                                    }}
                                                >
                                                    แก้ไข
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(row.id)}
                                                    style={{
                                                        padding: "5px 10px",
                                                        marginLeft: "5px",
                                                    }}
                                                >
                                                    ลบ
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            style={{ textAlign: "center", padding: "10px" }}
                                        >
                                            ไม่มีข้อมูล
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Box>
        </Sheet>
    );
}
