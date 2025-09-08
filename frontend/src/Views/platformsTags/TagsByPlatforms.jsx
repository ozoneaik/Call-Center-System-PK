import { useEffect, useState } from "react";
import axiosClient from "../../Axios";
import { ChatPageStyle } from "../../styles/ChatPageStyle";
import { Box, Sheet } from "@mui/joy";
import BreadcrumbsComponent from "../../Components/Breadcrumbs";
const BreadcrumbsPath = [{ name: 'จัดการแท็กตามแพลตฟอร์ม' }, { name: 'รายละเอียด' }];

export default function TagsByPlatforms() {
    const [records, setRecords] = useState([]);
    const [platforms, setPlatforms] = useState([]);
    const [tags, setTags] = useState([]);
    const [form, setForm] = useState({ platform_name: "", tag_id: "" });
    const [editingId, setEditingId] = useState(null);

    const fetchData = () => {
        axiosClient.get("tags-by-platform").then((res) => {
            setRecords(res.data.data ?? []);
        });
    };

    const fetchPlatforms = () => {
        axiosClient.get("tags-by-platform/platforms").then((res) => {
            setPlatforms(res.data.data ?? []);
        });
    };

    const fetchTags = () => {
        axiosClient.get("tags-by-platform/tags").then((res) => {
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
        console.log("form ที่จะส่ง:", form);
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
            fetchData();
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
    };

    const handleDelete = async (id) => {
        if (window.confirm("คุณต้องการลบข้อมูลนี้ใช่หรือไม่?")) {
            await axiosClient.delete(`tags-by-platform/${id}`);
            fetchData();
        }
    };

    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                </Box>
                <div>
                    <h2 style={{ paddingTop: "5px", paddingBottom: "5px" }}>จัดการแท็กตามแพลตฟอร์ม</h2>
                    <form onSubmit={handleSubmit} style={{
                        marginBottom: "10px",
                        paddingBottom: "10px",
                        paddingTop: "10px",

                    }}>
                        <select
                            value={form.platform_name}
                            onChange={(e) => setForm({ ...form, platform_name: e.target.value })}
                            required
                            style={{
                                padding: "8px",
                                marginRight: "15px",
                                marginBottom: "10px"
                            }}
                        >
                            <option value=""> เลือก Platform </option>
                            {platforms.map((p) => (
                                <option key={p.id} value={p.platform}>{p.platform}</option>
                            ))}
                        </select>
                        <select
                            value={form.tag_id}
                            onChange={(e) => setForm({ ...form, tag_id: e.target.value })}
                            required
                            style={{
                                padding: "8px",
                                marginRight: "15px",
                                marginBottom: "10px"
                            }}
                        >
                            <option value=""> เลือก Tag Menu </option>
                            {tags.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.id} - {t.tagName}
                                </option>
                            ))}
                        </select>

                        <button
                            type="submit"
                            style={{
                                padding: "8px 15px",
                                marginRight: "10px"
                            }}
                        >
                            {editingId ? "อัปเดต" : "เพิ่ม"}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setForm({ platform_name: "", tag_id: "" });
                                    setEditingId(null);
                                }}
                                style={{
                                    padding: "8px 15px"
                                }}
                            >
                                ยกเลิก
                            </button>
                        )}
                    </form>
                    <table border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th style={{ padding: "3px" }}>ID</th>
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
                                        <td style={{ textAlign: "center" }}>{row.platform_name}</td>
                                        <td style={{ textAlign: "center" }}>{row.tag_id}</td>
                                        <td style={{ textAlign: "center" }}>{tags.find(t => t.id === row.tag_id)?.tagName || ""}</td>
                                        <td style={{ textAlign: "center" }}>{row.created_at}</td>
                                        <td style={{ textAlign: "center" }}>{row.updated_at}</td>
                                        <td style={{ textAlign: "center", padding: "3px" }}>
                                            <button
                                                onClick={() => handleEdit(row)}
                                                style={{ padding: "5px 10px", marginRight: "5px" }}
                                            >
                                                แก้ไข
                                            </button>
                                            <button
                                                onClick={() => handleDelete(row.id)}
                                                style={{ padding: "5px 10px", marginLeft: "5px" }}
                                            >
                                                ลบ
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center", padding: "10px" }}>
                                        ไม่มีข้อมูล
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Box>

        </Sheet>
    );
}