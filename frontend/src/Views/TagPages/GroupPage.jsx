import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Sheet,
  Typography,
} from "@mui/joy";
import Grid from "@mui/material/Grid"; 
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import { ChatPageStyle } from "../../styles/ChatPageStyle";
import { listTagGroupsApi, deleteTagGroupApi } from "../../Api/Tags.js";
import { FormGroup } from "./FormGroup.jsx";
import { AlertDiaLog } from "../../Dialogs/Alert.js";

const BreadcrumbsPath = [
  { name: "จัดการ tag การจบสทนา", href: "/tags" },
  { name: "จัดการ Group การสนทนา" },
];

export default function GroupPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState({});

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, []);

  const fetchData = async () => {
    const { data, status } = await listTagGroupsApi();
    if (status === 200) {
      setGroups(data.list);
    }
  };

  const deleteGroup = ({ id }) => {
    AlertDiaLog({
      icon: "question",
      title: "ยืนยันการลบ Group",
      text: "กดตกลงเพื่อยืนยันการลบ",
      onPassed: async (confirm) => {
        if (confirm) {
          const { data, status } = await deleteTagGroupApi({ id });
          AlertDiaLog({
            icon: status === 200 && "success",
            title: data.message,
            text: data.detail,
            onPassed: () => {
              if (status === 200) {
                setGroups((prev) => prev.filter((g) => g.id !== id));
              }
            },
          });
        }
      },
    });
  };

  return (
    <>
      {show && (
        <FormGroup
          show={show}
          setShow={setShow}
          selected={selected}
          setSelected={setSelected}
          setGroups={setGroups}
        />
      )}
      <Sheet sx={ChatPageStyle.Layout}>
        <Box component="main" sx={ChatPageStyle.MainContent}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <BreadcrumbsComponent list={BreadcrumbsPath} />
          </Box>

          <Box sx={ChatPageStyle.BoxTable}>
            <Typography level="h2" component="h1">
              จัดการ Group การสนทนา
            </Typography>
          </Box>

          <Sheet variant="outlined" sx={[ChatPageStyle.BoxSheet, { border: "none" }]}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: "flex", justifyContent: "end" }}>
                  <Button onClick={() => setShow(true)}>สร้าง Group</Button>
                </Box>
              </Grid>

              {!loading ? (
                groups.length > 0 ? (
                  groups.map((group, i) => (
                    <Grid item key={i} xs={12} sm={6} md={4} lg={3}>
                      <Card variant="outlined" color="primary">
                        <CardContent>
                          <Typography level="body-md">Group ID: {group.group_id}</Typography>
                          <Typography level="h4">{group.group_name}</Typography>
                          <Typography level="body-sm">{group.group_description}</Typography>
                        </CardContent>
                        <CardActions>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelected(group);
                              setShow(true);
                            }}
                          >
                            แก้ไข
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            variant="solid"
                            onClick={() => deleteGroup({ id: group.id })}
                          >
                            ลบ
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))
                ) : (
                  <>ไม่พบ Group</>
                )
              ) : (
                <CircularProgress color="primary" />
              )}
            </Grid>
          </Sheet>
        </Box>
      </Sheet>
    </>
  );
}
