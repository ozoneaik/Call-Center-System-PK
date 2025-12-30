import {
  Box,
  Sheet,
  Table,
  Typography,
  Button,
  IconButton,
  Stack,
  Modal,
  ModalDialog,
  ModalClose,
  FormControl,
  FormLabel,
  Input,
} from "@mui/joy";
import { ChatPageStyle } from "../../styles/ChatPageStyle";
import BreadcrumbsComponent from "../../Components/Breadcrumbs";
import { Grid2 } from "@mui/material";
import { useEffect, useState } from "react";
import axiosClient from "../../Axios";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { AlertDiaLog } from "../../Dialogs/Alert";

const BreadcrumbsPath = [{ name: "แชทช่วยเหลือ" }, { name: "รายการแชท" }];

function HelpChatList() {
  const [helpChatList, setHelpChatList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    search: "",
    problem: "",
    solve: "",
    sku: "",
    model: "",
    remark: "",
    search_vector: "",
    skugroup: "",
    cause: "",
  });

  const requiredFields = ["search", "problem", "solve", "skugroup", "cause"];

  useEffect(() => {
    fetchHelpChatList().finally(() => setLoading(false));
  }, []);

  const fetchHelpChatList = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get("/help-chat/list");
      console.log(data);
      setHelpChatList(data.data.data || []);
    } catch (error) {
      console.error("Error fetching help chat list:", error);
    }
  };

  const handleAdd = () => setOpenModal(true);

  const handleEdit = (item) => alert(`แก้ไข ID: ${item.id}`);

  const handleDelete = (item) => {
    if (window.confirm(`คุณแน่ใจว่าต้องการลบ ID: ${item.id} ?`)) {
      alert(`ลบ ID: ${item.id}`);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const missing = requiredFields.filter((field) => !formData[field].trim());
    if (missing.length > 0) {
      alert(`กรุณากรอกข้อมูลให้ครบถ้วนในช่อง: ${missing.join(", ")}`);
      return;
    }

    AlertDiaLog({
      title: "เพิ่มรายการใหม่เรียบร้อย",
      icon: "question",
      onPassed: async (confirm) => {
        if (confirm) {
          if (confirm) {
            const { data, status } = await axiosClient.post(
              "help-chat/store",
              formData
            );
            console.log(data, status);
            AlertDiaLog({
              title: status === 200 ? "สําเร็จ" : "ไม่สําเร็จ",
              icon: status === 200 ? "success" : "error",
              onPassed: () => {
                fetchHelpChatList().finally(() => setLoading(false));
              },
            });
          }
        }
      },
    });
    // Reset form
    setFormData({
      search: "",
      problem: "",
      solve: "",
      sku: "",
      model: "",
      remark: "",
      search_vector: "",
      skugroup: "",
      cause: "",
    });
    setOpenModal(false);
  };

  return (
    <Sheet sx={ChatPageStyle.Layout}>
      <Box sx={ChatPageStyle.MainContent}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          <BreadcrumbsComponent list={BreadcrumbsPath} />
          <Button color="primary" onClick={handleAdd}>
            เพิ่มรายการใหม่
          </Button>
        </Stack>

        <Box sx={{ ...ChatPageStyle.BoxTable, mt: 2 }}>
          <Typography level="h2" component="h1">
            จัดการลูกค้า
          </Typography>
        </Box>

        <Sheet variant="outlined" sx={{ ...ChatPageStyle.BoxSheet, mt: 2 }}>
          <Grid2 container spacing={2}>
            <Grid2 xs={12}>
              <Table
                stickyHeader
                hoverRow
                sx={[ChatPageStyle.Table, { overflow: "auto" }]}
              >
                <thead>
                  <tr>
                    <th>ID</th>
                    <th style={{ width: "300px" }}>Search</th>
                    <th style={{ width: "200px" }}>Problem</th>
                    <th style={{ width: "200px" }}>Solve</th>
                    <th>SKU</th>
                    <th>Model</th>
                    <th>Remark</th>
                    <th>Vector</th>
                    <th>Group</th>
                    <th>Cause</th>
                    <th
                      onClick={() => {
                        console.log(helpChatList);
                      }}
                      style={{ textAlign: "center" }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && helpChatList.length > 0 ? (
                    helpChatList.map((item, index) => (
                      <tr key={index}>
                        <td>{item.id}</td>
                        <td>{item.search}</td>
                        <td>{item.problem}</td>
                        <td>{item.solve}</td>
                        <td>{item.sku}</td>
                        <td>{item.model}</td>
                        <td>{item.remark}</td>
                        <td>{item.search_vector}</td>
                        <td>{item.skugroup}</td>
                        <td>{item.cause}</td>
                        <td style={{ textAlign: "center" }}>
                          <IconButton
                            onClick={() => handleEdit(item)}
                            color="warning"
                            size="sm"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDelete(item)}
                            color="danger"
                            size="sm"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} style={{ textAlign: "center" }}>
                        {loading ? "กำลังโหลดข้อมูล..." : "ไม่พบข้อมูล"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Grid2>
          </Grid2>
        </Sheet>

        {/* Modal จาก Joy UI */}
        <Modal open={openModal} onClose={() => setOpenModal(false)}>
          <ModalDialog sx={{ width: 500 }}>
            <ModalClose />
            <Typography level="h4" component="h2">
              เพิ่มรายการใหม่
            </Typography>

            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
            >
              {[
                { label: "Search (ใช้สำหรับการค้นหาในหน้าห้องแชท)", key: "search", required: true },
                { label: "Problem (ปัญหาที่พบได้บ่อย)", key: "problem", required: true },
                { label: "Solve (แนวทางการแก้ไขปัญหาหรือวิธีการแก้ไข ใช้สำหรับส่งตอบลูกค้า)", key: "solve", required: true },
                { label: "SKU", key: "sku" },
                { label: "Model", key: "model" },
                { label: "Remark", key: "remark" },
                { label: "Search Vector", key: "search_vector" },
                { label: "SKU Group", key: "skugroup", required: true },
                { label: "Cause", key: "cause", required: true },
              ].map(({ label, key, required }) => (
                <FormControl key={key} required={required}>
                  <FormLabel>{label}</FormLabel>
                  <Input
                    value={formData[key]}
                    onChange={(e) => handleFormChange(key, e.target.value)}
                    placeholder={required ? `${label} (จำเป็น)` : label}
                  />
                </FormControl>
              ))}
            </Box>

            <Stack direction="row" justifyContent="flex-end" spacing={1} mt={3}>
              <Button variant="plain" onClick={() => setOpenModal(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleSubmit} color="primary">
                บันทึก
              </Button>
            </Stack>
          </ModalDialog>
        </Modal>
      </Box>
    </Sheet>
  );
}

export default HelpChatList;
