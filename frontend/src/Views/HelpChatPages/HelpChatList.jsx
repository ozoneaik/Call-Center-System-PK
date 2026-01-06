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
  GlobalStyles, 
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

const initialFormData = {
  search: "",
  problem: "",
  solve: "",
  sku: "",
  model: "",
  remark: "",
  search_vector: "",
  skugroup: "",
  cause: "",
};

function HelpChatList() {
  const [helpChatList, setHelpChatList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const requiredFields = ["search", "problem", "solve", "skugroup", "cause"];

  useEffect(() => {
    fetchHelpChatList();
  }, []);

  const fetchHelpChatList = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get("/help-chat/list");
      setHelpChatList(data.data.data || []);
    } catch (error) {
      console.error("Error fetching help chat list:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setOpenModal(true);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      search: item.search || "",
      problem: item.problem || "",
      solve: item.solve || "",
      sku: item.sku || "",
      model: item.model || "",
      remark: item.remark || "",
      search_vector: item.search_vector || "",
      skugroup: item.skugroup || "",
      cause: item.cause || "",
    });
    setOpenModal(true);
  };

  const handleDelete = (item) => {
    AlertDiaLog({
      title: "ยืนยันการลบ",
      text: `คุณแน่ใจว่าต้องการลบ ID: ${item.id} ?`,
      icon: "warning",
      onPassed: async (confirm) => {
        if (confirm) {
          try {
            const { status } = await axiosClient.delete(
              `/help-chat/delete/${item.id}`
            );
            if (status === 200) {
              fetchHelpChatList();
            }
          } catch (err) {
            console.error(err);
            AlertDiaLog({ title: "ลบไม่สำเร็จ", icon: "error" });
          }
        }
      },
    });
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
      title: editingId ? "ยืนยันการแก้ไขข้อมูล" : "ยืนยันการเพิ่มข้อมูล",
      icon: "question",
      onPassed: async (confirm) => {
        if (confirm) {
          try {
            let res;
            if (editingId) {
              res = await axiosClient.post(
                `/help-chat/update/${editingId}`,
                {
                  ...formData,
                  _method: 'PUT'
                }
              );
            } else {
              res = await axiosClient.post("/help-chat/store", formData);
            }
            const { status, data } = res;

            if (status === 200 || status === 201) {
              handleCloseModal();
              fetchHelpChatList();
              AlertDiaLog({
                title: "สําเร็จ",
                text: data.message || "บันทึกข้อมูลเรียบร้อย",
                icon: "success",
              });
            } else {
              AlertDiaLog({
                title: "ไม่สําเร็จ",
                text: data.message || "เกิดข้อผิดพลาด",
                icon: "error",
              });
            }
          } catch (error) {
            console.error("Submit Error:", error);
            AlertDiaLog({
              title: "เกิดข้อผิดพลาด",
              text: error.response?.data?.message || error.message,
              icon: "error",
            });
          }
        }
      },
    });
  };

  return (
    <Sheet sx={ChatPageStyle.Layout}>
      <GlobalStyles
        styles={{
          ".swal2-container": {
            zIndex: "10000 !important",
          },
        }}
      />

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
            จัดการ Help Chat
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
                    <th>Group</th>
                    <th>Cause</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
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
                        <td>{item.skugroup}</td>
                        <td>{item.cause}</td>
                        <td style={{ textAlign: "center" }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="center"
                          >
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
                          </Stack>
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

        <Modal open={openModal} onClose={handleCloseModal}>
          <ModalDialog sx={{ width: 600, overflow: "auto", maxHeight: "90vh" }}>
            <ModalClose />
            <Typography level="h4" component="h2">
              {editingId
                ? `แก้ไขรายการ (ID: ${editingId})`
                : "เพิ่มรายการใหม่"}
            </Typography>

            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
            >
              {[
                {
                  label: "Search (ใช้สำหรับการค้นหาในหน้าห้องแชท)",
                  key: "search",
                  required: true,
                },
                {
                  label: "Problem (ปัญหาที่พบได้บ่อย)",
                  key: "problem",
                  required: true,
                },
                {
                  label: "Solve (แนวทางการแก้ไขปัญหา)",
                  key: "solve",
                  required: true,
                },
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
              <Button variant="plain" onClick={handleCloseModal}>
                ยกเลิก
              </Button>
              <Button onClick={handleSubmit} color="primary">
                {editingId ? "อัปเดตข้อมูล" : "บันทึก"}
              </Button>
            </Stack>
          </ModalDialog>
        </Modal>
      </Box>
    </Sheet>
  );
}

export default HelpChatList;
